'use client';
import { useRef, useEffect } from 'react';

interface SchematicNode {
  id: string;
  label: string;
  x: number;
  y: number;
  values: { label: string; value: string }[];
  health: 'normal' | 'warning' | 'alarm';
  highlighted?: boolean;
}

interface SchematicEdge {
  from: string;
  to: string;
  animated?: boolean;
}

interface NetworkSchematicProps {
  nodes: SchematicNode[];
  edges: SchematicEdge[];
  width?: number;
  height?: number;
}

/* ---------- colour constants ---------- */
const HEALTH_COLOR: Record<string, string> = {
  normal: '#10B981',
  warning: '#F59E0B',
  alarm: '#EF4444',
};
const EDGE_COLOR = 'rgba(148,163,184,0.4)';
const ANIMATED_EDGE_COLOR = '#22D3EE';
const HIGHLIGHT_COLOR = '#F47920';

const NODE_W = 84;
const NODE_H = 56;
const HALF_W = NODE_W / 2;
const HALF_H = NODE_H / 2;

export function NetworkSchematic({
  nodes,
  edges,
  width = 400,
  height = 240,
}: NetworkSchematicProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const nodeMap = new Map<string, SchematicNode>();
    for (const n of nodes) nodeMap.set(n.id, n);

    let running = true;

    const draw = (t: number) => {
      if (!running) return;
      ctx.clearRect(0, 0, width, height);

      /* ---- edges ---- */
      for (const edge of edges) {
        const from = nodeMap.get(edge.from);
        const to = nodeMap.get(edge.to);
        if (!from || !to) continue;

        const fx = from.x + HALF_W;
        const fy = from.y + HALF_H;
        const tx = to.x + HALF_W;
        const ty = to.y + HALF_H;

        ctx.beginPath();
        ctx.lineWidth = 1.5;

        if (edge.animated) {
          ctx.strokeStyle = ANIMATED_EDGE_COLOR;
          ctx.setLineDash([6, 4]);
          ctx.lineDashOffset = -(t / 40); // moving dash
        } else {
          ctx.strokeStyle = EDGE_COLOR;
          ctx.setLineDash([]);
        }

        ctx.moveTo(fx, fy);
        ctx.lineTo(tx, ty);
        ctx.stroke();
        ctx.setLineDash([]);

        // Arrowhead
        const angle = Math.atan2(ty - fy, tx - fx);
        const arrLen = 8;
        const ax = tx - Math.cos(angle) * (HALF_W + 2);
        const ay = ty - Math.sin(angle) * (HALF_H + 2);

        ctx.beginPath();
        ctx.fillStyle = edge.animated ? ANIMATED_EDGE_COLOR : EDGE_COLOR;
        ctx.moveTo(ax, ay);
        ctx.lineTo(
          ax - arrLen * Math.cos(angle - 0.4),
          ay - arrLen * Math.sin(angle - 0.4),
        );
        ctx.lineTo(
          ax - arrLen * Math.cos(angle + 0.4),
          ay - arrLen * Math.sin(angle + 0.4),
        );
        ctx.closePath();
        ctx.fill();
      }

      /* ---- nodes ---- */
      for (const node of nodes) {
        const hc = HEALTH_COLOR[node.health] ?? HEALTH_COLOR.normal;
        let borderAlpha = 1;

        // Pulse effect
        if (node.health === 'alarm') {
          borderAlpha = 0.5 + 0.5 * Math.sin((t / 1000) * 2 * Math.PI * 2); // 2 Hz
        } else if (node.health === 'warning') {
          borderAlpha = 0.6 + 0.4 * Math.sin((t / 1000) * 2 * Math.PI * 1); // 1 Hz
        }

        // Rounded rectangle
        const r = 6;
        const x = node.x;
        const y = node.y;

        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + NODE_W - r, y);
        ctx.quadraticCurveTo(x + NODE_W, y, x + NODE_W, y + r);
        ctx.lineTo(x + NODE_W, y + NODE_H - r);
        ctx.quadraticCurveTo(x + NODE_W, y + NODE_H, x + NODE_W - r, y + NODE_H);
        ctx.lineTo(x + r, y + NODE_H);
        ctx.quadraticCurveTo(x, y + NODE_H, x, y + NODE_H - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();

        // Fill background
        ctx.fillStyle = 'rgba(15,23,42,0.85)';
        ctx.fill();

        // Border
        const borderColor = node.highlighted ? HIGHLIGHT_COLOR : hc;
        ctx.strokeStyle = borderColor;
        ctx.globalAlpha = borderAlpha;
        ctx.lineWidth = node.highlighted ? 2 : 1.5;
        ctx.stroke();
        ctx.globalAlpha = 1;

        // Label (bold 8px mono)
        ctx.fillStyle = '#E2E8F0';
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(node.label, x + HALF_W, y + 4, NODE_W - 8);

        // Value rows (up to 3)
        ctx.font = '8px monospace';
        const maxRows = Math.min(node.values.length, 3);
        for (let i = 0; i < maxRows; i++) {
          const vy = y + 16 + i * 12;
          const v = node.values[i];

          // label left
          ctx.fillStyle = '#94A3B8';
          ctx.textAlign = 'left';
          ctx.fillText(v.label, x + 4, vy, HALF_W - 6);

          // value right
          ctx.fillStyle = '#E2E8F0';
          ctx.textAlign = 'right';
          ctx.fillText(v.value, x + NODE_W - 4, vy, HALF_W - 6);
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, [nodes, edges, width, height]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width, height }}
      aria-label="Network schematic diagram"
      role="img"
    />
  );
}
