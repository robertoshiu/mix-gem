/**
 * AR HUD overlay — renders equipment labels and zone warnings
 * on the AR camera view using Babylon.js AdvancedDynamicTexture.
 */
import { Scene } from '@babylonjs/core/scene';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { AdvancedDynamicTexture } from '@babylonjs/gui/2D/advancedDynamicTexture';
import { TextBlock } from '@babylonjs/gui/2D/controls/textBlock';
import { Rectangle } from '@babylonjs/gui/2D/controls/rectangle';
import { Control } from '@babylonjs/gui/2D/controls/control';

export interface ArHud {
  update(): void;
  dispose(): void;
}

interface LabelMarker {
  mesh: Mesh;
  label: string;
  rect: Rectangle;
  text: TextBlock;
}

export function createArHud(
  scene: Scene,
  arCamera: FreeCamera,
  equipmentMeshes: Map<string, Mesh>,
): ArHud {
  // Create fullscreen UI for AR canvas (cam-8 view, index 7)
  const ui = AdvancedDynamicTexture.CreateFullscreenUI('arHud', true, scene);
  ui.idealWidth = 640;

  const markers: LabelMarker[] = [];

  // Create label for each equipment piece
  for (const [label, mesh] of equipmentMeshes) {
    const rect = new Rectangle(`marker_${label}`);
    rect.width = '120px';
    rect.height = '28px';
    rect.cornerRadius = 4;
    rect.color = '#0ff';
    rect.thickness = 1;
    rect.background = 'rgba(0, 20, 40, 0.7)';
    rect.isVisible = false;

    const text = new TextBlock(`text_${label}`, label);
    text.color = '#0ff';
    text.fontSize = 10;
    text.fontFamily = 'Fira Code, monospace';
    rect.addControl(text);

    ui.addControl(rect);
    rect.linkWithMesh(mesh);
    rect.linkOffsetY = -30;

    markers.push({ mesh, label, rect, text });
  }

  // Zone warning overlay
  const warningText = new TextBlock('zoneWarning', '');
  warningText.color = '#ff0000';
  warningText.fontSize = 14;
  warningText.fontFamily = 'Fira Code, monospace';
  warningText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
  warningText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
  warningText.top = '40px';
  warningText.isVisible = false;
  ui.addControl(warningText);

  function update(): void {
    const camPos = arCamera.position;

    // Show/hide markers based on distance to AR camera
    for (const marker of markers) {
      const dist = Vector3.Distance(camPos, marker.mesh.position);
      marker.rect.isVisible = dist < 8; // Only show within 8m

      // Adjust opacity by distance
      if (marker.rect.isVisible) {
        const alpha = Math.max(0.3, 1 - dist / 8);
        marker.rect.alpha = alpha;
      }
    }
  }

  function dispose(): void {
    ui.dispose();
  }

  return { update, dispose };
}
