/**
 * Alert system — checks engineer position against restricted zones each frame.
 * Manages alert state transitions (clear → triggered → cooldown → clear).
 * Plays audio beep on trigger. Pushes alerts to DOM panel.
 */
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { restrictedZones, isInsideZone, RestrictedZone, Severity } from '../config/zones';

export interface Alert {
  id: string;
  zone: RestrictedZone;
  timestamp: number;
  acknowledged: boolean;
}

export interface AlertSystem {
  activeAlerts: Alert[];
  update(engineerPos: Vector3): void;
  acknowledge(alertId: string): void;
  dispose(): void;
}

const COOLDOWN_MS = 5000; // 5s cooldown after leaving zone
const BEEP_DURATION = 0.15;

export function createAlertSystem(): AlertSystem {
  const activeAlerts: Alert[] = [];
  const cooldowns = new Map<string, number>(); // zone id → timestamp when cooldown expires
  let audioCtx: AudioContext | null = null;

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

      // Frequency based on severity
      const freqMap: Record<Severity, number> = {
        critical: 880,
        high: 660,
        medium: 440,
      };
      osc.frequency.value = freqMap[severity];
      osc.type = 'square';

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + BEEP_DURATION);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + BEEP_DURATION);
    } catch {
      // Audio not available — silent fallback
    }
  }

  function triggerAlert(zone: RestrictedZone): void {
    const existing = activeAlerts.find(a => a.zone.id === zone.id && !a.acknowledged);
    if (existing) return; // Already alerting for this zone

    const alert: Alert = {
      id: `${zone.id}_${Date.now()}`,
      zone,
      timestamp: Date.now(),
      acknowledged: false,
    };
    activeAlerts.push(alert);
    playBeep(zone.severity);
    renderAlertToDOM(alert);
    flashCameraBorder(zone);
  }

  function update(engineerPos: Vector3): void {
    const now = Date.now();

    for (const zone of restrictedZones) {
      const inside = isInsideZone(engineerPos, zone);
      const inCooldown = cooldowns.has(zone.id) && cooldowns.get(zone.id)! > now;

      if (inside && !inCooldown) {
        triggerAlert(zone);
        // Set cooldown so we don't re-trigger every frame
        cooldowns.set(zone.id, now + COOLDOWN_MS);
      }
    }

    // Prune old acknowledged alerts (keep last 10)
    while (activeAlerts.length > 10) {
      activeAlerts.shift();
    }
  }

  function acknowledge(alertId: string): void {
    const alert = activeAlerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      // Remove from DOM
      const el = document.getElementById(`alert-${alertId}`);
      if (el) el.remove();
    }
  }

  function dispose(): void {
    if (audioCtx) {
      audioCtx.close();
      audioCtx = null;
    }
    // Clear DOM
    const panel = document.getElementById('alert-panel');
    if (panel) panel.innerHTML = '';
  }

  return { activeAlerts, update, acknowledge, dispose };
}

// --- DOM rendering helpers ---

function renderAlertToDOM(alert: Alert): void {
  const panel = document.getElementById('alert-panel');
  if (!panel) return;

  const el = document.createElement('div');
  el.className = 'alert-item';
  el.id = `alert-${alert.id}`;

  const time = new Date(alert.timestamp).toLocaleTimeString('zh-TW', { hour12: false });

  el.innerHTML = `
    <div>
      <span class="alert-time">${time}</span>
      <span class="alert-severity ${alert.zone.severity}">${alert.zone.severity.toUpperCase()}</span>
    </div>
    <div class="alert-zone">${alert.zone.name}</div>
    <div>人員進入限制區域</div>
    <button data-alert-id="${alert.id}">確認</button>
  `;

  el.querySelector('button')?.addEventListener('click', () => {
    const id = el.querySelector('button')?.getAttribute('data-alert-id');
    if (id) {
      alert.acknowledged = true;
      el.remove();
    }
  });

  panel.prepend(el);
}

function flashCameraBorder(zone: RestrictedZone): void {
  // Map zone to camera indices that should flash
  const zoneToCamera: Record<string, number[]> = {
    litho_bay: [3], // cam-4: litho close-up
    chemical_storage: [5], // cam-6: chemical close-up
    maintenance_pit: [1], // cam-2: minimap
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
