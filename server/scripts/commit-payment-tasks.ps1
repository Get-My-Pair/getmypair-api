# One git commit per payment task (10 DB + 20 API). Run from getmypair-api repo root:
#   powershell -ExecutionPolicy Bypass -File server/scripts/commit-payment-tasks.ps1

$ErrorActionPreference = "Stop"
$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
Set-Location $RepoRoot

$TasksFile = "server/docs/payment/TASKS.md"

function Commit-Task {
    param(
        [string]$Message,
        [string[]]$Files,
        [string]$TaskLine,
        [switch]$AllowEmpty
    )
    if ($TaskLine) {
        Add-Content -Path $TasksFile -Value $TaskLine
        git add $TasksFile
    }
    foreach ($f in $Files) {
        if (Test-Path $f) { git add -- $f }
    }
    $pending = git diff --cached --name-only
    if (-not $pending) {
        if ($AllowEmpty) {
            git commit --allow-empty -m $Message
            Write-Host "COMMITTED (empty): $Message"
            return
        }
        Write-Host "SKIP (nothing staged): $Message"
        return
    }
    git commit -m $Message
    Write-Host "COMMITTED: $Message"
}

# DATABASE (10)
Commit-Task "feat(db): Payment Collection" @("server/src/models/payment.model.js") "- [x] Payment Collection"
Commit-Task "feat(db): Settlement Collection" @("server/src/models/settlement.model.js") "- [x] Settlement Collection"
Commit-Task "feat(db): Commission Collection" @("server/src/models/commission.model.js") "- [x] Commission Collection"
Commit-Task "feat(db): Webhook Logs Collection" @("server/src/models/webhookLog.model.js") "- [x] Webhook Logs Collection"
Commit-Task "feat(db): Refund Collection" @("server/src/models/refund.model.js") "- [x] Refund Collection"
Commit-Task "feat(db): Payment Indexes" @("server/docs/payment/DATABASE_INDEXES.md") "- [x] Payment Indexes"

Add-Content -Path "server/docs/payment/DATABASE_INDEXES.md" -Value @"

## Settlement collection (`settlements`)

| Index | Fields |
|-------|--------|
| paymentId | single |
| beneficiaryId + status + createdAt | compound (desc) |
| status + scheduledAt | compound |

Defined in `server/src/models/settlement.model.js`.
"@

Commit-Task "feat(db): Settlement Indexes" @("server/docs/payment/DATABASE_INDEXES.md") "- [x] Settlement Indexes"
Commit-Task "feat(db): Audit Collection" @("server/src/models/paymentAudit.model.js") "- [x] Audit Collection"
Commit-Task "feat(db): Invoice Collection" @("server/src/models/invoice.model.js") "- [x] Invoice Collection"
Commit-Task "feat(db): Revenue Collection" @("server/src/models/revenue.model.js") "- [x] Revenue Collection"

# API services (8)
Commit-Task "feat(payment): Commission Engine" @(
    "server/src/constants/paymentWorkflow.constants.js",
    "server/src/services/commission.service.js"
) "- [x] Commission Engine"
Commit-Task "feat(payment): Audit Log Service" @("server/src/services/paymentAudit.service.js") "- [x] Audit Log Service"
Commit-Task "feat(payment): Notification Trigger Service" @("server/src/services/paymentNotification.service.js") "- [x] Notification Trigger Service"
Commit-Task "feat(payment): Zoho payment gateway client" @("server/src/services/zohoPayment.service.js") "- [x] Zoho payment gateway client"
Commit-Task "feat(payment): payment workflow helper" @("server/src/utils/paymentWorkflow.helper.js") "- [x] payment workflow helper"
Commit-Task "feat(payment): Payment service (order, link, verify, webhook)" @("server/src/services/payment.service.js") "- [x] Create Payment Order API (service)"
Commit-Task "feat(payment): Payment Success Handler" @() "- [x] Payment Success Handler (processPaymentSuccess in payment.service)" -AllowEmpty
Commit-Task "feat(payment): Payment Failed Handler" @() "- [x] Payment Failed Handler (processPaymentFailed in payment.service)" -AllowEmpty
Commit-Task "feat(payment): Payment Pending Handler" @() "- [x] Payment Pending Handler (processPaymentPending in payment.service)" -AllowEmpty
Commit-Task "feat(payment): Settlement Scheduler" @("server/src/services/settlementScheduler.service.js") "- [x] Settlement Scheduler"

# API routes & integration (12)
Commit-Task "feat(payment): Create Payment Link API" @(
    "server/src/validations/payment.validation.js",
    "server/src/controllers/payment.controller.js",
    "server/src/routes/payment.routes.js"
) "- [x] Create Payment Link API"
Commit-Task "feat(payment): Verify Payment API" @() "- [x] Verify Payment API" -AllowEmpty
Commit-Task "feat(payment): Webhook API" @("server/src/app.js") "- [x] Webhook API"
Commit-Task "feat(payment): Payment History API" @() "- [x] Payment History API" -AllowEmpty
Commit-Task "feat(payment): Payment Details API" @() "- [x] Payment Details API" -AllowEmpty
Commit-Task "feat(payment): Cost Approval API" @() "- [x] Cost Approval API" -AllowEmpty
Commit-Task "feat(payment): Cost Reject API" @() "- [x] Cost Reject API" -AllowEmpty
Commit-Task "feat(payment): Cobbler Earnings API" @() "- [x] Cobbler Earnings API" -AllowEmpty
Commit-Task "feat(payment): Darkworkstore Revenue API" @() "- [x] Darkworkstore Revenue API" -AllowEmpty
Commit-Task "feat(payment): Settlement API" @() "- [x] Settlement API" -AllowEmpty
Commit-Task "feat(payment): Refund API" @() "- [x] Refund API" -AllowEmpty
Commit-Task "feat(payment): Payment Report API" @() "- [x] Payment Report API" -AllowEmpty

Commit-Task "feat(payment): wire server, env, and service workflow" @(
    "server/src/server.js",
    "server/src/config/env.js",
    "server/src/models/serviceRequest.model.js",
    "server/src/controllers/service.controller.js",
    "server/src/controllers/cobblerHome.controller.js"
) "- [x] Module 5 integration"

Commit-Task "docs(payment): Module 5 guide, catalog, and Swagger" @(
    "server/docs/MODULE_5_PAYMENT.md",
    "server/docs/API-CATALOG.md",
    "server/src/docs/payment.paths.js",
    "server/src/config/swagger.js"
) "- [x] API documentation"

Write-Host "`n--- Push to GitHub (origin) ---"
git push origin HEAD
Write-Host "`nRecent commits:"
git log --oneline -40
