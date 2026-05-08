# Data Contracts

## Purpose
Define stable event-style payloads that keep modules interoperable and auditable.

## Contract: order.created
```ts
{
  eventType: 'order.created';
  tenantId: string;
  branchId: string;
  orderId: string;
  orderRef: string;
  total: number;
  paymentMethod: 'cash' | 'card' | 'other';
  createdAt: string;
}
```

## Contract: sync.replay_deduped
```ts
{
  eventType: 'sync.replay_deduped';
  tenantId: string;
  mutationId: string;
  idempotencyKey: string;
  detectedAt: string;
  reason: 'duplicate_replay';
}
```

## Contract: sync.dead_lettered
```ts
{
  eventType: 'sync.dead_lettered';
  tenantId: string;
  mutationId: string;
  mutationType: 'CREATE_ORDER' | 'VOID_ORDER' | 'CLOSE_SHIFT';
  attempts: number;
  lastError: string;
  deadLetteredAt: string;
}
```

## Contract: exception.approved
```ts
{
  eventType: 'exception.approved';
  tenantId: string;
  branchId: string;
  exceptionId: string;
  approvedBy: string;
  approvedAt: string;
}
```

## Design Rules
1. Tenant and branch identifiers are explicit in every contract.
2. Timestamps are ISO-8601 UTC.
3. Event names are action-first and stable.
4. Sensitive fields are excluded from audit-adjacent events.
