# Module 5 — Payment Workflow (Zoho + Revenue Split)

## Overview

Implements the GetMyPair payment workflow: cost approval → Zoho payment link → webhook → paid status → pickup scheduling, with **80% cobbler / 20% GMP** commission on direct cobbler routes.

| Layer | Path |
|-------|------|
| Routes | `server/src/routes/payment.routes.js` |
| Controller | `server/src/controllers/payment.controller.js` |
| Services | `server/src/services/payment.service.js`, `zohoPayment.service.js`, `commission.service.js` |
| Models | `payment`, `settlement`, `commission`, `webhookLog`, `refund`, `paymentAudit`, `invoice`, `revenue` |

Mount: `app.use('/api/payment', paymentRoutes)`  
Webhook (no auth): `POST /api/payment/webhook/zoho` (registered in `app.js` before JSON body parser).

## Environment

```env
ZOHO_API_KEY=
ZOHO_WEBHOOK_SECRET=
ZOHO_PAYMENTS_BASE_URL=https://payments.zoho.in/api/v1
ZOHO_PAYMENT_RETURN_URL=https://your-app/callback
ZOHO_PAYMENTS_MOCK=true
API_PUBLIC_BASE_URL=http://localhost:3000
SETTLEMENT_SCHEDULER_ENABLED=true
SETTLEMENT_SCHEDULER_INTERVAL_MS=3600000
```

With `ZOHO_PAYMENTS_MOCK=true` (or no API key), payment links point to `/api/payment/mock-checkout?orderId=...` for local testing.

## User flow

1. Create service request → `workflowStatus: AWAITING_ACCEPTANCE`
2. Cobbler/dark store sets `actualCost` → `COBBLER_COST_PENDING` + `paymentState: COST_APPROVAL_PENDING`
3. User approves cost → `POST /api/payment/cost/approve` (or existing `/api/service/respond-actual-cost` with `accept`)
4. **Pay now** → `POST /api/payment/link` → open `paymentLink.url`
5. Zoho webhook or `POST /api/payment/verify` → `PAYMENT_SUCCESS`, pickup scheduled (`trackingState: pickup_scheduled`)

## API summary

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | `/api/payment/order` | USER | Create payment order |
| POST | `/api/payment/link` | USER | Generate Zoho payment link |
| POST | `/api/payment/verify` | USER | Verify transaction |
| POST | `/api/payment/webhook/zoho` | — | Zoho callback |
| POST | `/api/payment/cost/approve` | USER | Cost approval |
| POST | `/api/payment/cost/reject` | USER | Cost rejection |
| GET | `/api/payment/history` | USER | Transaction history |
| GET | `/api/payment/:paymentId` | USER/ADMIN | Payment details |
| GET | `/api/payment/cobbler/earnings` | COBBER | Earnings + settlements |
| GET | `/api/payment/darkstore/:id/revenue` | ADMIN/COBBER | Dark store revenue |
| POST | `/api/payment/settlement/process` | ADMIN | Process payout |
| POST | `/api/payment/refund` | USER/ADMIN | Refund |
| GET | `/api/payment/admin/report` | ADMIN | Reporting |
| GET | `/api/payment/admin/commission-preview` | * | Split calculator |

## Revenue split (cobbler direct)

| Total | Cobbler (80%) | GMP (20%) |
|-------|---------------|-----------|
| ₹500 | ₹400 | ₹100 |
| ₹1000 | ₹800 | ₹200 |
| ₹1500 | ₹1200 | ₹300 |
| ₹2000 | ₹1600 | ₹400 |

## Service request fields

- `workflowStatus` — routing lifecycle (see `paymentWorkflow.constants.js`)
- `paymentState` — payment lifecycle
- `activePaymentId` — current Payment document

## Database collections

1. **payments** — transactions  
2. **settlements** — payouts  
3. **commissions** — GMP ledger  
4. **webhooklogs** — Zoho callbacks  
5. **refunds** — refund records  
6. **paymentaudits** — audit trail  
7. **invoices** — future GST  
8. **revenues** — daily rollups  
