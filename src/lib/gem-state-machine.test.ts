import { GemStateMachine } from './gem-state-machine';
import type { GemState } from './mes-types';

describe('GemStateMachine', () => {
  let fsm: GemStateMachine;

  beforeEach(() => {
    fsm = new GemStateMachine();
  });

  describe('initial state', () => {
    it('starts in INIT state', () => {
      expect(fsm.canTransitionTo('IDLE')).toBe(true);
      expect(fsm.getValidTransitions()).toEqual(['IDLE']);
    });

    it('has empty history on creation', () => {
      expect(fsm.getStateHistory()).toEqual([]);
    });
  });

  describe('canTransitionTo — valid transitions', () => {
    const validPairs: [GemState, GemState][] = [
      ['INIT', 'IDLE'],
      ['IDLE', 'SETUP'],
      ['SETUP', 'READY'],
      ['READY', 'EXECUTING'],
      ['EXECUTING', 'PAUSED'],
      ['EXECUTING', 'COMPLETED'],
      ['EXECUTING', 'ABORTED'],
      ['PAUSED', 'EXECUTING'],
      ['PAUSED', 'ABORTED'],
      ['COMPLETED', 'IDLE'],
      ['ABORTED', 'IDLE'],
    ];

    it.each(validPairs)('allows %s → %s', (from, to) => {
      // Navigate to the 'from' state
      const path = pathToState(from);
      for (const s of path) {
        fsm.transitionTo(s);
      }
      expect(fsm.canTransitionTo(to)).toBe(true);
    });
  });

  describe('canTransitionTo — invalid transitions', () => {
    it('returns false for self-transition', () => {
      expect(fsm.canTransitionTo('INIT')).toBe(false);
    });

    it('returns false for unreachable transition from INIT', () => {
      expect(fsm.canTransitionTo('EXECUTING')).toBe(false);
      expect(fsm.canTransitionTo('COMPLETED')).toBe(false);
    });

    it('returns false for backwards transition', () => {
      navigate(fsm, ['IDLE', 'SETUP', 'READY']);
      expect(fsm.canTransitionTo('IDLE')).toBe(false);
      expect(fsm.canTransitionTo('SETUP')).toBe(false);
    });
  });

  describe('transitionTo — valid transitions', () => {
    it('transitions INIT → IDLE returning S6F11 notification', () => {
      const events = fsm.transitionTo('IDLE');
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('s6f11_notification');
      expect(events[0].label).toContain('GEM_STATE_CHANGE');
    });

    it('returns S2F41 stop on EXECUTING → PAUSED', () => {
      navigate(fsm, ['IDLE', 'SETUP', 'READY', 'EXECUTING']);
      const events = fsm.transitionTo('PAUSED');
      expect(events).toHaveLength(2);
      expect(events[0].type).toBe('s6f11_notification');
      expect(events[1].type).toBe('s2f41_stop');
    });

    it('returns S2F41 resume on PAUSED → EXECUTING', () => {
      navigate(fsm, ['IDLE', 'SETUP', 'READY', 'EXECUTING', 'PAUSED']);
      const events = fsm.transitionTo('EXECUTING');
      expect(events).toHaveLength(2);
      expect(events[0].type).toBe('s6f11_notification');
      expect(events[1].type).toBe('s2f41_resume');
    });

    it('returns only S6F11 for EXECUTING → COMPLETED', () => {
      navigate(fsm, ['IDLE', 'SETUP', 'READY', 'EXECUTING']);
      const events = fsm.transitionTo('COMPLETED');
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('s6f11_notification');
    });
  });

  describe('transitionTo — invalid transitions', () => {
    it('throws for invalid transition with descriptive message', () => {
      expect(() => fsm.transitionTo('EXECUTING')).toThrow(
        /Invalid state transition.*INIT.*->.*EXECUTING/,
      );
    });

    it('throws for self-transition', () => {
      expect(() => fsm.transitionTo('INIT')).toThrow(
        /Invalid state transition.*INIT.*->.*INIT/,
      );
    });
  });

  describe('getValidTransitions', () => {
    it('returns IDLE from INIT', () => {
      expect(fsm.getValidTransitions()).toEqual(['IDLE']);
    });

    it('returns PAUSED, COMPLETED, ABORTED from EXECUTING', () => {
      navigate(fsm, ['IDLE', 'SETUP', 'READY', 'EXECUTING']);
      expect(fsm.getValidTransitions()).toEqual(['PAUSED', 'COMPLETED', 'ABORTED']);
    });
  });

  describe('getStateHistory', () => {
    it('records each transition with from, to, and timestamp', () => {
      fsm.transitionTo('IDLE');
      const history = fsm.getStateHistory();
      expect(history).toHaveLength(1);
      expect(history[0].from).toBe('INIT');
      expect(history[0].to).toBe('IDLE');
      expect(history[0].timestamp).toBeInstanceOf(Date);
    });

    it('records multiple transitions in order', () => {
      navigate(fsm, ['IDLE', 'SETUP', 'READY']);
      const history = fsm.getStateHistory();
      expect(history).toHaveLength(3);
      expect(history.map((h) => h.from)).toEqual(['INIT', 'IDLE', 'SETUP']);
      expect(history.map((h) => h.to)).toEqual(['IDLE', 'SETUP', 'READY']);
    });

    it('does not record failed transitions', () => {
      expect(() => fsm.transitionTo('EXECUTING')).toThrow();
      expect(fsm.getStateHistory()).toHaveLength(0);
    });
  });

  describe('reset', () => {
    it('resets state to INIT and clears history', () => {
      navigate(fsm, ['IDLE', 'SETUP', 'READY']);
      fsm.reset();
      expect(fsm.getValidTransitions()).toEqual(['IDLE']);
      expect(fsm.getStateHistory()).toEqual([]);
    });

    it('allows full cycle after reset', () => {
      navigate(fsm, ['IDLE', 'SETUP']);
      fsm.reset();
      const events = fsm.transitionTo('IDLE');
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('s6f11_notification');
    });
  });

  describe('full lifecycle', () => {
    it('completes INIT → IDLE → SETUP → READY → EXECUTING → COMPLETED → IDLE', () => {
      const path: GemState[] = ['IDLE', 'SETUP', 'READY', 'EXECUTING', 'COMPLETED', 'IDLE'];
      for (const state of path) {
        const events = fsm.transitionTo(state);
        expect(events.length).toBeGreaterThan(0);
        expect(events[0].type).toBe('s6f11_notification');
      }
      expect(fsm.getStateHistory()).toHaveLength(6);
    });

    it('handles pause/resume cycle', () => {
      navigate(fsm, ['IDLE', 'SETUP', 'READY', 'EXECUTING']);

      const pauseEvents = fsm.transitionTo('PAUSED');
      expect(pauseEvents[0].type).toBe('s6f11_notification');
      expect(pauseEvents[1].type).toBe('s2f41_stop');

      const resumeEvents = fsm.transitionTo('EXECUTING');
      expect(resumeEvents[0].type).toBe('s6f11_notification');
      expect(resumeEvents[1].type).toBe('s2f41_resume');
    });

    it('handles abort and return to idle', () => {
      navigate(fsm, ['IDLE', 'SETUP', 'READY', 'EXECUTING']);

      const abortEvents = fsm.transitionTo('ABORTED');
      expect(abortEvents).toHaveLength(1);
      expect(abortEvents[0].type).toBe('s6f11_notification');

      // After abort, can go back to IDLE
      const idleEvents = fsm.transitionTo('IDLE');
      expect(idleEvents).toHaveLength(1);
      expect(idleEvents[0].type).toBe('s6f11_notification');

      // After idle, can restart the cycle
      expect(fsm.canTransitionTo('SETUP')).toBe(true);
    });
  });
});

// ── helpers ───────────────────────────────────────────

function navigate(fsm: GemStateMachine, states: GemState[]): void {
  for (const state of states) {
    fsm.transitionTo(state);
  }
}

/** Returns the states to transition through to reach a given state (inclusive). */
function pathToState(target: GemState): GemState[] {
  const map: Record<GemState, GemState[]> = {
    INIT: [],
    IDLE: ['IDLE'],
    SETUP: ['IDLE', 'SETUP'],
    READY: ['IDLE', 'SETUP', 'READY'],
    EXECUTING: ['IDLE', 'SETUP', 'READY', 'EXECUTING'],
    PAUSED: ['IDLE', 'SETUP', 'READY', 'EXECUTING', 'PAUSED'],
    COMPLETED: ['IDLE', 'SETUP', 'READY', 'EXECUTING', 'COMPLETED'],
    ABORTED: ['IDLE', 'SETUP', 'READY', 'EXECUTING', 'ABORTED'],
  };
  return map[target];
}
