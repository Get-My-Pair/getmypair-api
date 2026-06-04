# Module 5 — Database indexes

## Payment collection (`payments`)

| Index | Fields |
|-------|--------|
| orderId | unique |
| serviceRequestId + status | compound |
| userId + createdAt | compound (desc) |
| cobblerId + status + createdAt | compound (desc) |
| status + createdAt | compound (desc) |

Defined in `server/src/models/payment.model.js`.

## Settlement collection (settlements)

| Index | Fields |
|-------|--------|
| paymentId | single |
| beneficiaryId + status + createdAt | compound (desc) |
| status + scheduledAt | compound |

Defined in server/src/models/settlement.model.js.
