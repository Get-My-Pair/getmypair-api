# GetMyPair AI — WhatsApp booking & progress

**Channel number:** `+91 63741 29515` (`6374129515`)  
**Product name:** GetMyPair AI  
**Status:** Planned (not built yet)  
**Owner surfaces:** `getmypair-api` (new), Darkworkstore / Masteradmin web (`client`), customer app (`getmypair-mobile`) stays in sync

This document is the development spec. It maps the WhatsApp journey onto APIs and dashboards that already exist, and lists what still has to be built.

---

## 1. Goal

A customer messages **GetMyPair AI** on WhatsApp. They pick **Tamil** or **English**, log in with **OTP**, choose a service, send a **photo + issue description + address**, then Darkworkstore sets the **amount**. The customer **accepts or rejects**. If they accept, they get a **payment link**. After payment, every **job progress** step is sent on the same WhatsApp chat.

Same `User`, `ServiceRequest`, cost approval, and Zoho payment records as the mobile app. One order — three channels (app, WhatsApp, dashboards).

---



## 2. End-to-end journey

```
Hi
 → Language (Tamil / English)
 → Login (mobile or email) → OTP → verify
 → Select service
 → Photo(s) → issue description → follow-up questions → address
 → Request created (Darkworkstore sees it)
 → Store sets actual amount
 → Customer Accept / Reject on WhatsApp
 → If Accept → Zoho payment link
 → If Paid → WhatsApp progress on every tracking step
 → Delivered
```

Reject cancels the request (same as the app today).

---



## 3. What already exists vs what is new


| Step            | Today                                                                                                                                         | WhatsApp work                                                                              |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Language        | User field is `en` / `kn` only (`user.model.js`)                                                                                              | Add `ta`. Store on chat session + `User.preferredLanguage`                                 |
| Login OTP       | `POST /api/auth/send-otp` + `verify-otp` — **mobile only**. SMS send is **TODO** (OTP only logged)                                            | Send OTP **inside WhatsApp**. Optional: email OTP for customers                            |
| Profile         | `POST /api/auth/complete-profile` needs name, DOB, gender                                                                                     | Light WhatsApp signup: name + address; fill DOB/gender later in app                        |
| Service types   | `repair`, `maintenance`, `wash`, `donate`, `dispose`                                                                                          | Use these first. **Resale** and **rent** are coming-soon in the app — Phase 2              |
| Photo           | Cloudinary via `/api/service/upload-proof/image`                                                                                              | Download WhatsApp media → upload Cloudinary                                                |
| Description     | `problemDescription` on create                                                                                                                | Collect in chat                                                                            |
| Questions       | App has free text only (maintenance plan picker for maintain)                                                                                 | Structured Q&A per service in chat, stored on the request                                  |
| Address         | `POST /api/user/profile/address/add`                                                                                                          | Collect line, city, pincode in chat                                                        |
| Create request  | `POST /api/service/create` needs `articleId` + `addressId`                                                                                    | Auto-create a shoe article from the photo, then create the request. Tag `source: whatsapp` |
| Store amount    | Darkworkstore **Cost approval** → `PATCH /api/darkworkstore/payments/cost/:id`                                                                | No new store UI required. Push WhatsApp when cost is set                                   |
| Accept / reject | `POST /api/service/respond-actual-cost`                                                                                                       | Interactive Accept / Reject buttons on WhatsApp                                            |
| Payment         | `POST /api/payment/link` (Zoho). App opens URL. Link is **not** messaged today                                                                | Send the Zoho URL on WhatsApp                                                              |
| Progress        | `trackingState` on the request; **in-app** notifications only (`COST_APPROVAL_PENDING`, `PAYMENT_SUCCESS`, `PAYMENT_FAILED`). **No WhatsApp** | Hook every tracking change → WhatsApp template                                             |


**Not in the codebase today:** Meta WhatsApp Cloud API, chat sessions, Tamil, customer email OTP, resale/rent create, payment-link messaging, progress WhatsApp.

---



## 4. Conversation design

Keep replies short. One question at a time. Buttons / list messages where Meta allows them.

### 4.1 Language

**Trigger:** `Hi`, `Hello`, `வணக்கம்`, or first message.

**English**

> Welcome to **GetMyPair AI**.  
> Please select your language.

Buttons: `English` · `தமிழ்`

**Tamil**

> GetMyPair AI-க்கு வரவேற்கிறோம்.  
> மொழியை தேர்வு செய்யவும்.

Buttons: `English` · `தமிழ்`

Save as `en` or `ta`. All later copy follows this choice.

### 4.2 Login

If this WhatsApp number is already a verified GetMyPair user → skip OTP and greet by name.

Otherwise:

> Login to continue.  
> Send your **10-digit mobile** or **email**.

Then:

> We sent a 6-digit OTP. Reply with the code.

- **Mobile** = WhatsApp chat number, or the number they typed → send OTP **on this WhatsApp chat** (do not depend on SMS).
- **Email** = send OTP to that email (new customer email OTP; portal email OTP already exists).
- Reuse `otp.service.js` (6 digits, expiry, attempts).
- After verify: existing user → JWT stored on session. New user → ask **name**, then continue (create user + profile).

Failed OTP: allow resend (existing rate limit on `/api/auth/send-otp`).

### 4.3 Select service

> What do you need today?


| Button (EN) | Button (TA)   | API `serviceType` | Phase                   |
| ----------- | ------------- | ----------------- | ----------------------- |
| Repair      | பழுதுபார்ப்பு | `repair`          | 1                       |
| Wash        | கழுவுதல்      | `wash`            | 1                       |
| Maintain    | பராமரிப்பு    | `maintenance`     | 1                       |
| Donate      | தானம்         | `donate`          | 1                       |
| Resale      | விற்பனை       | `resale`          | 2 (not in API enum yet) |
| Rent        | வாடகை         | `rent`            | 2 (not in API enum yet) |


Phase 1 if they tap Resale/Rent:

> This service will open in the GetMyPair app soon. Please choose Repair, Wash, Maintain, or Donate.



### 4.4 Photo → description → questions → address

1. **Photo**
  > Please send 1–5 clear photos of the pair.
   Save WhatsApp image IDs → download via Meta media API → Cloudinary (`/api/service/upload-proof/image`).
2. **Description**
  > Briefly describe the issue (or what you want done).
   → `problemDescription`
3. **Follow-up questions** (required)

  | Service  | Ask                                                                                       |
  | -------- | ----------------------------------------------------------------------------------------- |
  | Repair   | Which part? (sole / upper / stitching / other). How old is the pair? Any previous repair? |
  | Wash     | Material? (leather / canvas / suede / unknown). Any stains to highlight?                  |
  | Maintain | Plan: 1 month / 3 months / 6 months (same as app: ₹299 / ₹999 / ₹1500).                   |
  | Donate   | Reason (optional). Pickup from home?                                                      |

   Store answers as `intakeAnswers` (new field on `ServiceRequest`).
4. **Address**
  If profile already has addresses → list them (reply `1`, `2`, …) plus **Add new**.
   New address, one field at a time:
  - House / street (`addressLine1`)
  - City
  - State (default Tamil Nadu if skipped)
  - Pincode
   Then `POST /api/user/profile/address/add`.
5. **Confirm & create**
  > Service: Repair  
  > Issue: …  
  > Address: …  
  > Reply **YES** to submit.
   Then create article (from first photo) + `POST /api/service/create`.
  > Request **#ABC12XYZ** received. Darkworkstore will inspect and send the amount here.



### 4.5 Amount — accept or reject

When Darkworkstore saves actual cost (existing Cost approval screen):

> Amount for order **#ABC12XYZ**: **₹1,250**.  
> Reply **ACCEPT** to pay, or **REJECT** to cancel.

Buttons: `ACCEPT` · `REJECT`

- ACCEPT → `POST /api/service/respond-actual-cost` `{ decision: "accept" }` then create Zoho link.
- REJECT → `{ decision: "reject" }` (request cancelled, same as app).



### 4.6 Payment link

> Pay securely:  
> https://…zoho…  
> After payment we will update you here.

On Zoho webhook success (`POST /api/payment/webhook/zoho`):

> Payment received for **#ABC12XYZ**. Pickup will be arranged.



### 4.7 Progress on WhatsApp (after paid)

Send one message per `trackingState` change. Use **utility templates** (Meta approval required).


| `trackingState`       | English                                                 | Tamil (short)                     |
| --------------------- | ------------------------------------------------------- | --------------------------------- |
| `pickup_scheduled`    | Pickup is scheduled. Our partner will collect the pair. | பிக்அப் திட்டமிடப்பட்டது.         |
| `item_picked`         | Pair collected from you.                                | ஜோடி எடுக்கப்பட்டது.              |
| `dark_store_received` | Pair reached the Darkworkstore.                         | டார்க்வொர்க்ஸ்டோருக்கு சேர்ந்தது. |
| `inspection_started`  | Inspection started.                                     | பரிசோதனை தொடங்கியது.              |
| `repair_in_progress`  | Work is in progress.                                    | பணி நடைபெறுகிறது.                 |
| `repair_completed`    | Work completed. Quality check next.                     | பணி முடிந்தது.                    |
| `dispatch_ready`      | Ready to return to you.                                 | திருப்பி அனுப்ப தயார்.            |
| `out_for_delivery`    | Out for delivery.                                       | டெலிவரிக்கு புறப்பட்டது.          |
| `delivered`           | Delivered. Thank you for using GetMyPair.               | டெலிவரி முடிந்தது. நன்றி.         |


Also send on `PAYMENT_FAILED` and if the store rejects the job.

---



## 5. Architecture

```
Customer WhatsApp  →  Meta Cloud API  →  POST /api/whatsapp/webhook
                                              │
                                    GetMyPair AI engine
                                    (session + language + step)
                                              │
                         ┌────────────────────┼────────────────────┐
                         ▼                    ▼                    ▼
                   Auth / OTP           Service + Article      Payment (Zoho)
                   User / Profile       Darkworkstore jobs     Cost accept
                         │                    │                    │
                         └────────────────────┴────────────────────┘
                                              │
                                    WhatsApp send API
                                    (session + templates)
```


| Piece                                                  | Repo                                   | Role                                               |
| ------------------------------------------------------ | -------------------------------------- | -------------------------------------------------- |
| Webhook, session, templates, OTP-on-WA, progress hooks | **getmypair-api**                      | Source of truth                                    |
| Cost update, jobs, delivery (unchanged flow)           | **client** Darkworkstore / Masteradmin | Show WhatsApp-origin jobs                          |
| Same user sees the order                               | **getmypair-mobile**                   | No duplicate create; optional “opened on WhatsApp” |


Do **not** put Meta tokens in the Flutter app or the React dashboards.

---



## 6. What you must have before coding



### 6.1 Meta / WhatsApp


| Item                                           | Detail                                                                                   |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Phone                                          | **+91 63741 29515** registered as WhatsApp Business                                      |
| Meta Business + WhatsApp Cloud API app         | [developers.facebook.com](https://developers.facebook.com)                               |
| Phone number ID + WhatsApp Business Account ID | From Meta app                                                                            |
| Permanent system user token                    | `whatsapp_business_messaging`, `whatsapp_business_management`                            |
| Webhook                                        | `https://<API_HOST>/api/whatsapp/webhook`                                                |
| Verify token                                   | Random string in env                                                                     |
| Display name                                   | GetMyPair AI                                                                             |
| 24-hour session                                | Free-form replies after the user messages                                                |
| Templates                                      | Required **outside** the 24h window (OTP reminder, amount, pay link, each progress step) |


Submit Tamil **and** English templates. Utility category for OTP, amount, payment, tracking.

### 6.2 Environment (`getmypair-api`)

```env
WHATSAPP_ENABLED=true
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_BUSINESS_ACCOUNT_ID=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_WEBHOOK_VERIFY_TOKEN=
WHATSAPP_APP_SECRET=
WHATSAPP_DISPLAY_NUMBER=6374129515
WHATSAPP_API_VERSION=v21.0
```

Reuse existing: `OTP_*`, Cloudinary, `ZOHO_*`, `RESEND_*` / SMTP.

### 6.3 Backend work


| Build                                                   | Why                                                               |
| ------------------------------------------------------- | ----------------------------------------------------------------- |
| `POST /api/whatsapp/webhook` (GET verify + POST events) | Meta requirement                                                  |
| `WhatsAppSession` collection                            | Step, language, userId, draft (service, photos, answers, address) |
| Download media from Meta → Cloudinary                   | Photos                                                            |
| Send text, buttons, list, template                      | Conversation                                                      |
| OTP delivery over WhatsApp                              | Login without SMS                                                 |
| Customer email OTP (if not present)                     | Email login path                                                  |
| `preferredLanguage`: add `ta`                           | Tamil                                                             |
| `ServiceRequest.source`: `app` | `whatsapp`             | Dashboards                                                        |
| `ServiceRequest.intakeAnswers`                          | Q&A                                                               |
| `ServiceRequest.whatsappFrom`                           | Chat id / wa_id                                                   |
| Auto-create `Article` from first photo                  | Create API needs `articleId`                                      |
| On `updateActualCost`                                   | WhatsApp amount message                                           |
| On `respond-actual-cost` accept                         | Create link + send URL                                            |
| On Zoho paid webhook                                    | Paid confirmation                                                 |
| On `applyTracking` / job progress                       | Progress WhatsApp                                                 |
| Idempotent send log                                     | No duplicate progress messages                                    |




### 6.4 Darkworkstore / Masteradmin (`client`)

- Keep Cost approval and Jobs as they are.
- Show source **WhatsApp** on the job if `source === 'whatsapp'`.
- Customer mobile on the job is the WhatsApp number — staff can still call.

No install-app prompt on the public landing (already restricted to Masteradmin, Darkworkstore, Delivery).

### 6.5 Mobile app (`getmypair-mobile`)

- Same account (mobile number) sees WhatsApp-created requests in **My Service Requests**.
- Optional: mention GetMyPair AI number in FAQ / profile.
- Do not build a second booking bot in the app (current `ChatbotPage` is a local demo).

---



## 7. APIs to reuse (do not duplicate)


| Need                     | Existing API                                                            |
| ------------------------ | ----------------------------------------------------------------------- |
| Send / verify mobile OTP | `POST /api/auth/send-otp`, `POST /api/auth/verify-otp`                  |
| New user                 | `POST /api/auth/complete-profile`                                       |
| Addresses                | `GET /api/user/profile/addresses`, `POST /api/user/profile/address/add` |
| Upload photo             | `POST /api/service/upload-proof/image`                                  |
| Create article           | `POST /api/articles/create`                                             |
| Create request           | `POST /api/service/create`                                              |
| Store sets cost          | `PATCH /api/darkworkstore/payments/cost/:serviceRequestId`              |
| Accept / reject amount   | `POST /api/service/respond-actual-cost`                                 |
| Payment link             | `POST /api/payment/link`                                                |
| Payment webhook          | `POST /api/payment/webhook/zoho`                                        |


New public route: `/api/whatsapp/*` only for Meta. Internal helpers call the services above.

Suggested files:

- `server/src/routes/whatsapp.routes.js`
- `server/src/controllers/whatsapp.controller.js`
- `server/src/services/whatsappCloud.service.js` (Meta HTTP)
- `server/src/services/whatsappConversation.service.js` (state machine)
- `server/src/services/whatsappNotify.service.js` (amount, pay, progress)
- `server/src/models/whatsappSession.model.js`
- `server/src/models/whatsappMessageLog.model.js`

---



## 8. Suggested session shape

```json
{
  "waId": "916374129515",
  "phone": "+916374129515",
  "language": "ta",
  "step": "AWAIT_PHOTO",
  "userId": null,
  "accessToken": null,
  "draft": {
    "serviceType": "repair",
    "photos": [],
    "problemDescription": "",
    "intakeAnswers": {},
    "addressId": null
  },
  "serviceRequestId": null,
  "updatedAt": "ISO date"
}
```

**Steps:** `LANGUAGE` → `LOGIN_ID` → `LOGIN_OTP` → `PROFILE_NAME` (new users) → `SERVICE` → `PHOTO` → `DESCRIPTION` → `QUESTIONS` → `ADDRESS` → `CONFIRM` → `WAIT_COST` → `WAIT_DECISION` → `WAIT_PAYMENT` → `IN_PROGRESS` → `DONE`

Timeout: reset draft after 24 hours of silence; language can be kept.

---



## 9. Service-type mapping (do not invent extra enums in Phase 1)


| Marketing / chat | API value     | Live in app today                                   |
| ---------------- | ------------- | --------------------------------------------------- |
| Repair           | `repair`      | Yes                                                 |
| Wash             | `wash`        | Yes                                                 |
| Maintain         | `maintenance` | Yes                                                 |
| Donate           | `donate`      | Yes                                                 |
| Dispose          | `dispose`     | API only; skip in WhatsApp menu unless product asks |
| Resale / Sell    | `resale`      | App: coming soon — **Phase 2**                      |
| Rent             | `rent`        | App: coming soon — **Phase 2**                      |


Phase 2 needs schema + validation + Darkworkstore handling before WhatsApp offers them.

---



## 10. Build phases



### Phase 0 — Meta setup (no product code)

- Number `6374129515` on Cloud API, webhook verified with a stub, display name approved.
- Draft and submit EN + TA templates (OTP, amount, pay, 9 progress states).

**Done when:** test number can send/receive a hello in Meta’s tester.

### Phase 1 — Conversation to create request

- Language, WhatsApp OTP login, service (4 live types), photo, description, questions, address, confirm.
- Auto article + `POST /api/service/create` with `source: whatsapp`.
- Job visible in Darkworkstore **GMP Orders**.

**Done when:** a tester can complete a Repair request from WhatsApp and staff see it.

### Phase 2 — Amount, pay, progress

- Cost-update hook → ACCEPT/REJECT on WhatsApp.
- Payment link on WhatsApp; paid webhook confirmation.
- Progress templates on each `trackingState`.

**Done when:** one paid Repair order receives pickup → … → delivered messages on WhatsApp.

### Phase 3 — Polish

- Email OTP login, saved-address picker, Tamil copy review, resend OTP, agent handoff (`care@getmypair.com`).
- Optional: `resale` / `rent` after API support.
- App FAQ with the WhatsApp number.

---



## 11. Acceptance checks

1. `Hi` → language buttons; Tamil path stays Tamil.
2. OTP on WhatsApp; wrong OTP rejected; lockout matches existing OTP rules.
3. Photo required before create; Cloudinary URL on the request.
4. Address saved on `UserProfile` and linked as `addressId`.
5. Darkworkstore can set cost; customer gets amount message even if 24h window closed (template).
6. REJECT cancels; ACCEPT then payment URL; unpaid stays `PAYMENT_PENDING`.
7. After pay, each store/delivery status change sends **one** WhatsApp (no duplicates).
8. Same user opening the **mobile app** sees the same request.
9. Landing website does **not** show this flow (app download + WhatsApp number only, if you add it later).

---



## 12. Risks


| Risk                                | Mitigation                                                                  |
| ----------------------------------- | --------------------------------------------------------------------------- |
| Template not approved               | Start with 24h session messages; submit templates early                     |
| Create needs `articleId`            | Always create a minimal article from the first photo                        |
| SMS OTP never implemented           | Prefer WhatsApp OTP; SMS is optional later                                  |
| Email login vs unique `User.mobile` | Email-only users still need a mobile; default to WhatsApp `wa_id` as mobile |
| Resale / rent promised in chat      | Phase 1 copy: coming soon                                                   |
| Duplicate progress spam             | Message log unique on `(serviceRequestId, trackingState)`                   |


---



## 13. Related docs

- Service requests: [MODULE_4_DOCUMENTATION.md](MODULE_4_DOCUMENTATION.md)
- Payments / Zoho: [MODULE_5_PAYMENT.md](MODULE_5_PAYMENT.md)
- Auth: [MODULE_1_DOCUMENTATION.md](MODULE_1_DOCUMENTATION.md)
- Dashboards: [ADMIN_DASHBOARD.md](ADMIN_DASHBOARD.md)
- Mobile Care / Rehome: `getmypair-mobile/gmp/docs/MODULE_4_SERVICE_REQUESTS.md`

---

*Channel: WhatsApp Business* `+91 63741 29515` *· GetMyPair AI · keep this file updated when templates or enums change.*