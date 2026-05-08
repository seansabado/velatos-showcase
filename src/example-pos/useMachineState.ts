// src/example-pos/useMachineState.ts
// Demonstrates an offline-capable FSM hook for POS machine state
// Not connected to any real system

import { useState, useCallback } from 'react';

export type MachineState =
  | 'idle'
  | 'shift_open'
  | 'order_building'
  | 'confirming'
  | 'suspended'
  | 'shift_closing';

type Transition = {
  from: MachineState | MachineState[];
  to: MachineState;
  guard?: () => boolean;
};

const TRANSITIONS: Record<string, Transition> = {
  openShift:    { from: 'idle',                              to: 'shift_open' },
  newOrder:     { from: 'shift_open',                        to: 'order_building' },
  confirmOrder: { from: 'order_building',                    to: 'confirming' },
  editOrder:    { from: 'confirming',                        to: 'order_building' },
  completeOrder:{ from: 'confirming',                        to: 'shift_open' },
  cancelOrder:  { from: ['order_building', 'confirming'],    to: 'shift_open' },
  suspend:      { from: ['shift_open', 'order_building'],    to: 'suspended' },
  resume:       { from: 'suspended',                         to: 'shift_open' },
  startClose:   { from: 'shift_open',                        to: 'shift_closing' },
  closeShift:   { from: 'shift_closing',                     to: 'idle' },
  cancelClose:  { from: 'shift_closing',                     to: 'shift_open' },
};

function canTransition(current: MachineState, transition: Transition): boolean {
  const from = Array.isArray(transition.from) ? transition.from : [transition.from];
  if (!from.includes(current)) return false;
  if (transition.guard && !transition.guard()) return false;
  return true;
}

type MachineActions = {
  send: (event: string) => boolean;
  canSend: (event: string) => boolean;
  state: MachineState;
};

/**
 * Manages the POS machine state via explicit, validated transitions.
 * Invalid transitions are silently rejected and return false.
 *
 * Pattern: the state machine is the single source of truth for what the POS
 * is doing. UI components are derived from the state, not the other way around.
 *
 * @example
 * const { state, send } = useMachineState();
 * send('openShift');   // idle → shift_open
 * send('newOrder');    // shift_open → order_building
 * send('confirmOrder');// order_building → confirming
 */
export function useMachineState(initial: MachineState = 'idle'): MachineActions {
  const [state, setState] = useState<MachineState>(initial);

  const send = useCallback((event: string): boolean => {
    const transition = TRANSITIONS[event];
    if (!transition) return false;

    setState((current) => {
      if (!canTransition(current, transition)) return current;
      return transition.to;
    });

    return true;
  }, []);

  const canSend = useCallback((event: string): boolean => {
    const transition = TRANSITIONS[event];
    if (!transition) return false;
    return canTransition(state, transition);
  }, [state]);

  return { state, send, canSend };
}
