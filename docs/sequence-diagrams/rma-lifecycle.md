# RMA Lifecycle

State transition diagram for the 9-state RMA FSM, followed by a sequence diagram showing a full return flow end-to-end.

## State Transitions

```mermaid
stateDiagram-v2
    [*] --> draft : Case created
    draft --> submitted : Customer submits
    draft --> cancelled : Customer cancels

    submitted --> received : Warehouse receives goods
    submitted --> cancelled : Staff cancels

    received --> inspecting : All lines have receivedQty
    received --> cancelled : Staff cancels

    inspecting --> approved : All lines have condition
    inspecting --> rejected : All lines have condition

    approved --> resolved : Resolution action complete
    rejected --> closed : Case finalized

    resolved --> [*]
    closed --> [*]
    cancelled --> [*]
```

---

## Full Return Flow (Sequence)

```mermaid
sequenceDiagram
    actor Customer
    participant Portal as Customer Portal
    participant Staff as Warehouse Staff (RMA Panel)
    participant FSM as useRmaFsm
    participant API as Cloud Function
    participant DB as Firestore<br/>/tenants/{id}/rma_cases
    participant Audit as system_logs

    Customer->>Portal: Submits return request
    Portal->>API: createRmaCase(lines, flowType='return')
    API->>API: requireAuth + verifyTenantAccess
    API->>DB: write RmaCase { status: 'draft' }
    API->>Audit: logAudit('rma.create')
    API-->>Portal: { ref: 'RMA-2026-0042', publicToken }
    Portal-->>Customer: Confirmation + shipping label

    Customer->>Staff: Parcel arrives at warehouse
    Staff->>FSM: advance('submitted') → advance('received')
    Staff->>Staff: Record receivedQty per line
    FSM->>FSM: guardInspecting() passes
    Staff->>FSM: advance('inspecting')

    Staff->>Staff: Record condition per line
    FSM->>FSM: guardApproveReject() passes
    Staff->>FSM: advance('approved')

    FSM->>API: patchRmaStatus('approved', meta)
    API->>DB: update status
    API->>Audit: logAudit('rma.advance', 'approved')
    API-->>FSM: ack

    Staff->>FSM: advance('resolved')
    FSM->>API: patchRmaStatus('resolved', meta)
    API->>DB: update + set resolvedAt
    API->>Audit: logAudit('rma.resolve')
    API-->>Portal: webhook → notify customer
    Portal-->>Customer: "Return resolved — refund issued"
```
