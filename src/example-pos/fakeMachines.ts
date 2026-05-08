// src/example-pos/fakeMachines.ts
// Fake register and machine state data — non-proprietary demo data only

import type { Register } from '../shared/types/pos';
import type { MachineState } from './useMachineState';

export const FAKE_REGISTERS: Register[] = [
  { id: 'reg-001', branchId: 'branch-shibuya', label: 'レジ 1', currentShiftId: null },
  { id: 'reg-002', branchId: 'branch-shibuya', label: 'レジ 2', currentShiftId: 'shift-abc123' },
  { id: 'reg-003', branchId: 'branch-harajuku', label: 'レジ 1', currentShiftId: null },
];

export const FAKE_INITIAL_STATE: MachineState = 'idle';

export const FAKE_SHIFT_OPEN_STATE: MachineState = 'shift_open';

export const STATE_LABELS: Record<MachineState, string> = {
  idle: 'アイドル',
  shift_open: 'シフト中',
  order_building: '注文中',
  confirming: '確認中',
  suspended: '一時停止',
  shift_closing: 'クローズ中',
};
