/**
 * Alert system — checks multiple engineers against restricted zones.
 * Manages alert lifecycle: triggered → active → acknowledged → removed.
 * Triggers camera swap via callback when "查看 AR" is clicked.
 */
import { restrictedZones, isInsideZone, type RestrictedZone, type Severity } from '../config/zones';
import type { EngineerAgent } from '../scene/engineerAgent';

export interface Alert {
  id: string;
  engineerId: string;
  engineerName: string;
  zone: RestrictedZone;
  timestamp: number;
  acknowledged: boolean;
  acknowledgedAt: number | null;
}

export interface AlertSystem {
  activeAlerts: Alert[];
  update(engineers: EngineerAgent[]): void;
  acknowledge(alertId: string): void;
  onViewAR: ((engineerId: string) => void) | null;
  dispose(): void;
}

const COOLDOWN_MS = 8000;
const MAX_VISIBLE_ALERTS = 5;
const AUTO_REMOVE_MS = 15000;
const BEEP_DURATION = 0.15;

export function createAlertSystem(): AlertSystem {
  const activeAlerts: Alert[] = [];
  // cooldown key: `${engineerId}:${zoneId}`
  const cooldowns = new Map<string, number>();
  let audioCtx: AudioContext | null = null;
  let onViewAR: ((engineerId: string) => void) | null = null;

  function getAudioCtx(): AudioContext {
    if (!audioCtx) {
      audioCtx = new AudioContext();
    }
    return audioCtx;
  }

  function playBeep(severity: Severity): void {
    try {
      const ctx = getAudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      const freqMap: Record<Severity, number> = {
        critical: 880,
        high: 660,
        medium: 440,
      };
      osc.frequency.value = freqMap[severity];
      osc.type = 'square';

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + BEEP_DURATION);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + BEEP_DURATION);
    } catch {
      // Audio not available
    }
  }

  function triggerAlert(engineer: EngineerAgent, zone: RestrictedZone): void {
    // Check if already alerting for this engineer + zone combo
    const existing = activeAlerts.find(
      a => a.engineerId === engineer.id && a.zone.id === zone.id && !a.acknowledged,
    );
    if (existing) return;

    const alert: Alert = {
      id: `${engineer.id}_${zone.id}_${Date.now()}`,
      engineerId: engineer.id,
      engineerName: engineer.name,
      zone,
      timestamp: Date.now(),
      acknowledged: false,
      acknowledgedAt: null,
    };
    activeAlerts.push(alert);
    playBeep(zone.severity);
    renderAlertToDOM(alert);
    flashCameraBorder(zone);
  }

  function update(engineers: EngineerAgent[]): void {
    const now = Date.now();

    for (const engineer of engineers) {
      for (const zone of restrictedZones) {
        const key = `${engineer.id}:${zone.id}`;
        const inside = isInsideZone(engineer.position, zone);
        const inCooldown = cooldowns.has(key) && cooldowns.get(key)! > now;

        if (inside && !inCooldown) {
          triggerAlert(engineer, zone);
          cooldowns.set(key, now + COOLDOWN_MS);
        }
      }
    }

    // Auto-remove acknowledged alerts after timeout
    for (let i = activeAlerts.length - 1; i >= 0; i--) {
      const alert = activeAlerts[i];
      if (alert.acknowledged && alert.acknowledgedAt !== null && (now - alert.acknowledgedAt) > AUTO_REMOVE_MS) {
        activeAlerts.splice(i, 1);
        const el = document.getElementById(`alert-${alert.id}`);
        if (el) el.remove();
      }
    }

    // Cap visible alerts
    while (activeAlerts.length > MAX_VISIBLE_ALERTS * 2) {
      const removed = activeAlerts.shift();
      if (removed) {
        const el = document.getElementById(`alert-${removed.id}`);
        if (el) el.remove();
      }
    }
  }

  function acknowledge(alertId: string): void {
    const alert = activeAlerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      alert.acknowledgedAt = Date.now();
      const el = document.getElementById(`alert-${alertId}`);
      if (el) {
        el.style.opacity = '0.4';
        el.style.borderColor = '#444';
      }
    }
  }

  function dispose(): void {
    if (audioCtx) {
      audioCtx.close();
      audioCtx = null;
    }
    const panel = document.getElementById('alert-panel');
    if (panel) panel.innerHTML = '';
  }

  // --- DOM rendering ---

  function renderAlertToDOM(alert: Alert): void {
    const panel = document.getElementById('alert-panel');
    if (!panel) return;

    const el = document.createElement('div');
    el.className = 'alert-item';
    el.id = `alert-${alert.id}`;

    const time = new Date(alert.timestamp).toLocaleTimeString('zh-TW', { hour12: false });
    const severityLabel = alert.zone.severity.toUpperCase();

    el.innerHTML = `
      <div class="alert-header">
        <span class="alert-time">${time}</span>
        <span class="alert-severity ${alert.zone.severity}">${severityLabel}</span>
      </div>
      <div class="alert-zone">${alert.zone.name}</div>
      <div class="alert-person">[${alert.engineerId}] ${alert.engineerName} 進入限制區域</div>
      <div class="alert-actions">
        <button class="btn-view-ar" data-engineer-id="${alert.engineerId}">查看 AR</button>
        <button class="btn-ack" data-alert-id="${alert.id}">確認</button>
      </div>
    `;

    // "查看 AR" button
    el.querySelector('.btn-view-ar')?.addEventListener('click', () => {
      if (onViewAR) {
        onViewAR(alert.engineerId);
      }
    });

    // "確認" button
    el.querySelector('.btn-ack')?.addEventListener('click', () => {
      acknowledge(alert.id);
    });

    panel.prepend(el);
    trimVisibleAlerts(panel);
  }

  function trimVisibleAlerts(panel: HTMLElement): void {
    while (panel.children.length > MAX_VISIBLE_ALERTS) {
      panel.lastElementChild?.remove();
    }
  }

  function flashCameraBorder(zone: RestrictedZone): void {
    const zoneToCamera: Record<string, number[]> = {
      litho_bay: [3],
      chemical_storage: [5],
      maintenance_pit: [6],
    };

    const indices = zoneToCamera[zone.id] || [];
    for (const idx of indices) {
      const cell = document.querySelector(`[data-cam-index="${idx}"]`);
      if (cell) {
        cell.setAttribute('data-alert', 'true');
        setTimeout(() => cell.removeAttribute('data-alert'), 3000);
      }
    }
  }

  return {
    activeAlerts,
    update,
    acknowledge,
    get onViewAR() { return onViewAR; },
    set onViewAR(cb: ((engineerId: string) => void) | null) { onViewAR = cb; },
    dispose,
  };
}
