import type { GemState, SecsEvent } from './mes-types';
import { GEM_VALID_TRANSITIONS } from './mes-types';
import {
  makeS6F11Notification,
  makeS2F41Stop,
  makeS2F41Resume,
} from './secs-message-log';

interface TransitionContext {
  parameter?: import('./mes-types').SpcParameter;
  rule?: import('./mes-types').SpcRule;
}

export interface StateTransition {
  from: GemState;
  to: GemState;
  timestamp: Date;
}

export class GemStateMachine {
  private _state: GemState = 'INIT';
  private _history: StateTransition[] = [];

  /** Current GEM state. */
  get state(): GemState {
    return this._state;
  }

  /**
   * Transition to a new state.
   * Returns SECS events that the caller can record (e.g. add to the store).
   * Throws if the transition is not in the valid transition matrix.
   */
  transitionTo(target: GemState, context: TransitionContext = {}): SecsEvent[] {
    const valid = this.getValidTransitions();
    if (!valid.includes(target)) {
      throw new Error(
        `Invalid state transition: ${this._state} -> ${target}. ` +
          `Valid transitions from ${this._state} are: [${valid.join(', ')}]`,
      );
    }

    const from = this._state;
    const timestamp = new Date();
    this._state = target;
    this._history.push({ from, to: target, timestamp });

    return this._buildEvents(from, target, context);
  }

  /**
   * Check whether a transition to the given state is currently valid.
   * Does NOT perform the transition.
   */
  canTransitionTo(target: GemState): boolean {
    return GEM_VALID_TRANSITIONS[this._state].includes(target);
  }

  /**
   * Return the list of states reachable from the current state.
   */
  getValidTransitions(): GemState[] {
    return GEM_VALID_TRANSITIONS[this._state];
  }

  /**
   * Return a copy of the state history.
   */
  getStateHistory(): StateTransition[] {
    return [...this._history];
  }

  /**
   * Reset the machine to INIT state and clear history.
   */
  reset(): void {
    this._state = 'INIT';
    this._history = [];
  }

  // ── private ────────────────────────────────────────

  private _buildEvents(from: GemState, to: GemState, context: TransitionContext): SecsEvent[] {
    const events: SecsEvent[] = [
      makeS6F11Notification('GEM_STATE_CHANGE', { from, to }),
    ];

    // EXECUTING → PAUSED: emit S2F41 STOP
    if (from === 'EXECUTING' && to === 'PAUSED') {
      events.push(makeS2F41Stop(context.parameter ?? 'cd', context.rule ?? 'rule_1'));
    }

    // PAUSED → EXECUTING: emit S2F41 RESUME
    if (from === 'PAUSED' && to === 'EXECUTING') {
      events.push(makeS2F41Resume());
    }

    return events;
  }
}
