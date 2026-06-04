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
