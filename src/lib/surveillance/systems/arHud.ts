/**
 * AR HUD overlay — renders equipment labels with distance, zone boundary wireframe,
 * REC indicator, engineer ID, signal bars, and warning banner.
 * Rendered on the AR camera view using Babylon.js GUI.
 */
import { Scene } from '@babylonjs/core/scene';
import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { AdvancedDynamicTexture } from '@babylonjs/gui/2D/advancedDynamicTexture';
import { TextBlock } from '@babylonjs/gui/2D/controls/textBlock';
import { Rectangle } from '@babylonjs/gui/2D/controls/rectangle';
import { StackPanel } from '@babylonjs/gui/2D/controls/stackPanel';
import { Control } from '@babylonjs/gui/2D/controls/control';
import { Ellipse } from '@babylonjs/gui/2D/controls/ellipse';
import type { LoadedEquipment } from '../config/assets';
import { restrictedZones, isInsideZone } from '../config/zones';

export interface ArHud {
  update(): void;
  setActiveEngineer(id: string, name: string): void;
  clearActiveEngineer(): void;
  dispose(): void;
}

interface LabelMarker {
  worldPos: Vector3;
  label: string;
  rect: Rectangle;
  text: TextBlock;
}

const AR_HUD_LAYER_MASK = 0x10000000;

export function createArHud(
  scene: Scene,
  equipment: LoadedEquipment,
): ArHud {
  const ui = AdvancedDynamicTexture.CreateFullscreenUI('arHud', true, scene);
  ui.idealWidth = 640;
  ui.idealHeight = 480;
  ui.rootContainer.isVisible = false;
  if (ui.layer) {
    ui.layer.layerMask = AR_HUD_LAYER_MASK;
  }

  const markers: LabelMarker[] = [];
  let activeCamera: FreeCamera | null = null;
  let activeEngineerId = '';
  let activeEngineerName = '';
  let blinkVisible = true;
  let blinkTimer = 0;
  let signalBars = 3;
  let signalTimer = 0;

  // --- Equipment labels with distance ---
  for (const [label, worldPos] of equipment.labels) {
    const rect = new Rectangle(`marker_${label}`);
    rect.width = '140px';
    rect.height = '26px';
    rect.cornerRadius = 3;
    rect.color = '#0ff';
    rect.thickness = 1;
    rect.background = 'rgba(0, 20, 40, 0.75)';
    rect.isVisible = false;
    rect.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    rect.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;

    const text = new TextBlock(`text_${label}`, label);
    text.color = '#0ff';
    text.fontSize = 9;
    text.fontFamily = 'Fira Code, monospace';
    rect.addControl(text);

    ui.addControl(rect);
    markers.push({ worldPos, label, rect, text });
  }

  // --- Top-left: REC indicator + timestamp ---
  const topLeftPanel = new StackPanel('topLeft');
  topLeftPanel.isVertical = false;
  topLeftPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
  topLeftPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
  topLeftPanel.left = '12px';
  topLeftPanel.top = '10px';
  topLeftPanel.height = '20px';
  topLeftPanel.width = '160px';
  ui.addControl(topLeftPanel);

  const recDot = new Ellipse('recDot');
  recDot.width = '8px';
  recDot.height = '8px';
  recDot.color = '#f00';
  recDot.background = '#f00';
  recDot.thickness = 0;
  topLeftPanel.addControl(recDot);

  const recText = new TextBlock('recLabel', ' REC');
  recText.color = '#f00';
  recText.fontSize = 9;
  recText.fontFamily = 'Fira Code, monospace';
  recText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
  recText.width = '40px';
  topLeftPanel.addControl(recText);

  const timeText = new TextBlock('timeLabel', '');
  timeText.color = '#aaa';
  timeText.fontSize = 9;
  timeText.fontFamily = 'Fira Code, monospace';
  timeText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
  timeText.width = '80px';
  topLeftPanel.addControl(timeText);

  // --- Top-right: Engineer ID + signal bars ---
  const topRightPanel = new StackPanel('topRight');
  topRightPanel.isVertical = false;
  topRightPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
  topRightPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
  topRightPanel.left = '-12px';
  topRightPanel.top = '10px';
  topRightPanel.height = '20px';
  topRightPanel.width = '140px';
  ui.addControl(topRightPanel);

  const idText = new TextBlock('engineerId', '');
  idText.color = '#0ff';
  idText.fontSize = 9;
  idText.fontFamily = 'Fira Code, monospace';
  idText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
  idText.width = '100px';
  topRightPanel.addControl(idText);

  const signalText = new TextBlock('signal', '|||');
  signalText.color = '#0ff';
  signalText.fontSize = 10;
  signalText.fontFamily = 'Fira Code, monospace';
  signalText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
  signalText.width = '30px';
  topRightPanel.addControl(signalText);

  // --- Bottom: Warning banner ---
  const warningBanner = new Rectangle('warningBanner');
  warningBanner.width = '280px';
  warningBanner.height = '32px';
  warningBanner.cornerRadius = 4;
  warningBanner.color = '#f00';
  warningBanner.thickness = 1;
  warningBanner.background = 'rgba(80, 0, 0, 0.85)';
  warningBanner.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
  warningBanner.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
  warningBanner.top = '-16px';
  warningBanner.isVisible = false;
  ui.addControl(warningBanner);

  const warningText = new TextBlock('warningText', '⚠ 限制區域 — 請立即撤離');
  warningText.color = '#ff4444';
  warningText.fontSize = 11;
  warningText.fontFamily = 'Fira Code, monospace';
  warningBanner.addControl(warningText);

  // --- Zone boundary wireframe markers (red dashed corners at floor level) ---
  const zoneCornerMarkers: Rectangle[] = [];
  for (const zone of restrictedZones) {
    const corners = [
      new Vector3(zone.min.x, 0.1, zone.min.z),
      new Vector3(zone.max.x, 0.1, zone.min.z),
      new Vector3(zone.min.x, 0.1, zone.max.z),
      new Vector3(zone.max.x, 0.1, zone.max.z),
    ];
    for (const corner of corners) {
      const marker = new Rectangle(`zoneCorner_${zone.id}_${corner.x}_${corner.z}`);
      marker.width = '12px';
      marker.height = '12px';
      marker.color = '#f00';
      marker.thickness = 2;
      marker.background = 'transparent';
      marker.isVisible = false;
      ui.addControl(marker);
      // Store corner position as metadata via name hack
      (marker as unknown as { _worldPos: Vector3 })._worldPos = corner;
      zoneCornerMarkers.push(marker);
    }
  }

  function update(): void {
    if (!activeCamera) return;

    const camPos = activeCamera.position;
    const dt = scene.getEngine().getDeltaTime() / 1000;

    // Blink REC dot
    blinkTimer += dt;
    if (blinkTimer > 0.5) {
      blinkTimer = 0;
      blinkVisible = !blinkVisible;
    }
    recDot.isVisible = blinkVisible;
    recText.isVisible = blinkVisible;

    // Update timestamp
    timeText.text = new Date().toLocaleTimeString('en-US', { hour12: false });

    // Update signal bars (cosmetic jitter)
    signalTimer += dt;
    if (signalTimer > 1.5) {
      signalTimer = 0;
      signalBars = 2 + Math.floor(Math.random() * 2);
    }
    signalText.text = '|'.repeat(signalBars) + '·'.repeat(3 - signalBars);

    // Update engineer ID
    idText.text = activeEngineerId ? `${activeEngineerId} ${activeEngineerName}` : '';

    // Equipment markers — show nearest 5, cull overlap
    const markerData: Array<{ marker: LabelMarker; dist: number; sx: number; sy: number }> = [];

    for (const marker of markers) {
      marker.rect.isVisible = false; // Reset all
      const dist = Vector3.Distance(camPos, marker.worldPos);
      if (dist > 12) continue;

      const projected = Vector3.Project(
        marker.worldPos,
        scene.getTransformMatrix(),
        activeCamera.getViewMatrix().multiply(activeCamera.getProjectionMatrix()),
        activeCamera.viewport.toGlobal(
          scene.getEngine().getRenderWidth(),
          scene.getEngine().getRenderHeight(),
        ),
      );

      // Behind camera check
      if (projected.z > 1 || projected.z < 0) continue;

      const sx = (projected.x / scene.getEngine().getRenderWidth() - 0.5) * ui.idealWidth!;
      const sy = (projected.y / scene.getEngine().getRenderHeight() - 0.5) * ui.idealHeight!;
      markerData.push({ marker, dist, sx, sy });
    }

    // Sort by distance, keep nearest 5
    markerData.sort((a, b) => a.dist - b.dist);
    const visible = markerData.slice(0, 5);

    // Proximity culling: remove overlapping labels (< 30px apart)
    const accepted: typeof visible = [];
    for (const item of visible) {
      const tooClose = accepted.some(a =>
        Math.abs(a.sx - item.sx) < 30 && Math.abs(a.sy - item.sy) < 30
      );
      if (!tooClose) accepted.push(item);
    }

    // Apply positions
    for (const { marker, dist, sx, sy } of accepted) {
      marker.rect.isVisible = true;
      marker.text.text = `${marker.label} [${dist.toFixed(1)}m]`;
      marker.rect.alpha = Math.max(0.4, 1 - dist / 12);
      marker.rect.left = `${sx}px`;
      marker.rect.top = `${sy}px`;
    }

    // Zone corner markers — show nearby zone boundaries
    for (const marker of zoneCornerMarkers) {
      const worldPos = (marker as unknown as { _worldPos: Vector3 })._worldPos;
      const dist = Vector3.Distance(camPos, worldPos);
      marker.isVisible = dist < 12;
    }

    // Warning banner — show if inside any restricted zone
    let insideZone = false;
    for (const zone of restrictedZones) {
      if (isInsideZone(camPos, zone)) {
        insideZone = true;
        break;
      }
    }
    warningBanner.isVisible = insideZone;
  }

  function setActiveEngineer(id: string, name: string): void {
    if (activeCamera) {
      activeCamera.layerMask &= ~AR_HUD_LAYER_MASK;
    }
    activeEngineerId = id;
    activeEngineerName = name;
    // Find the engineer's AR camera from the scene
    const cam = scene.cameras.find(c => c.name === `arCam_${id}`);
    if (cam && cam instanceof FreeCamera) {
      activeCamera = cam;
      activeCamera.layerMask |= AR_HUD_LAYER_MASK;
      ui.rootContainer.isVisible = true;
    }
  }

  function clearActiveEngineer(): void {
    if (activeCamera) {
      activeCamera.layerMask &= ~AR_HUD_LAYER_MASK;
    }
    activeEngineerId = '';
    activeEngineerName = '';
    activeCamera = null;
    ui.rootContainer.isVisible = false;
    // Hide all markers
    for (const marker of markers) {
      marker.rect.isVisible = false;
    }
    warningBanner.isVisible = false;
  }

  function dispose(): void {
    ui.dispose();
  }

  return { update, setActiveEngineer, clearActiveEngineer, dispose };
}
