/**
 * Floating name labels above each engineer — visible in all non-AR camera views.
 * Shows engineer ID, name, and suit color indicator.
 */
import { Scene } from '@babylonjs/core/scene';
import { AdvancedDynamicTexture } from '@babylonjs/gui/2D/advancedDynamicTexture';
import { TextBlock } from '@babylonjs/gui/2D/controls/textBlock';
import { Rectangle } from '@babylonjs/gui/2D/controls/rectangle';
import { Ellipse } from '@babylonjs/gui/2D/controls/ellipse';
import { StackPanel } from '@babylonjs/gui/2D/controls/stackPanel';
import { Control } from '@babylonjs/gui/2D/controls/control';
import type { EngineerAgent } from '../scene/engineerAgent';

const SUIT_INDICATOR_COLORS: Record<string, string> = {
  base: '#e8eaed',  // white suit
  blue: '#4a90d9',  // blue suit
};

interface LabelEntry {
  panel: Rectangle;
  agent: EngineerAgent;
}

export interface EngineerLabels {
  dispose(): void;
}

export function createEngineerLabels(
  scene: Scene,
  engineers: EngineerAgent[],
  suitVariants: Map<string, string>,
): EngineerLabels {
  const ui = AdvancedDynamicTexture.CreateFullscreenUI('engineerLabels', true, scene);
  ui.idealWidth = 1280;
  ui.idealHeight = 960;

  const labels: LabelEntry[] = [];

  for (const agent of engineers) {
    // Container
    const panel = new Rectangle(`label_${agent.id}`);
    panel.width = '120px';
    panel.height = '28px';
    panel.cornerRadius = 4;
    panel.thickness = 1;
    panel.color = '#0ff';
    panel.background = 'rgba(0, 10, 20, 0.8)';
    panel.isVisible = true;

    const stack = new StackPanel(`stack_${agent.id}`);
    stack.isVertical = false;
    stack.height = '20px';
    panel.addControl(stack);

    // Suit color dot
    const dot = new Ellipse(`dot_${agent.id}`);
    const variant = suitVariants.get(agent.id) ?? 'base';
    const dotColor = SUIT_INDICATOR_COLORS[variant] ?? '#e8eaed';
    dot.width = '8px';
    dot.height = '8px';
    dot.color = dotColor;
    dot.background = dotColor;
    dot.thickness = 0;
    dot.paddingRight = '4px';
    stack.addControl(dot);

    // ID + Name text
    const text = new TextBlock(`text_${agent.id}`, `${agent.id} ${agent.name}`);
    text.color = '#0ff';
    text.fontSize = 10;
    text.fontFamily = 'Fira Code, monospace';
    text.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    text.resizeToFit = true;
    stack.addControl(text);

    // Link to mesh — offset above head
    ui.addControl(panel);
    panel.linkWithMesh(agent.root);
    panel.linkOffsetY = -80;

    labels.push({ panel, agent });
  }

  return {
    dispose() {
      ui.dispose();
    },
  };
}
