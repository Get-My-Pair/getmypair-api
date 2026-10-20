# Delivery partner plan

How footwear moves for GetMyPair, which courier partners to use, and what stays internal-only.

---

## 1. What we already have

We can already run a full repair job from the customer app through payment, then pickup → repair shop → return to customer.

We also built a **small delivery login portal** for our own people to click through jobs and test the flow.

That delivery portal is for **internal testing only**. It is not the app real courier partners will use. Live pickups and deliveries should go through a **courier company** (Shiprocket, Shadowfax, etc.).

---

## 2. Main delivery flow

```text
Customer → GMP Hub or Nearby Cobbler → Repair shop → GMP Hub (return) or Nearby Cobbler → Customer (return)
```

| Step | From | To | What happens |
|------|------|-----|--------------|
| 1 | Customer | **GMP Hub** *or* **Nearby Cobbler** | Courier picks up (or short handoff to cobbler) |
| 2 | Hub or Cobbler | Repair shop | Pair goes for repair work |
| 3 | Repair shop | **GMP Hub** *or* **Nearby Cobbler** | Work done; pair goes to return point |
| 4 | Hub or Cobbler | Customer | Courier (or cobbler) delivers back |

**GMP Hub** = city collection + sort.  
**Nearby Cobbler** = local pickup / return point when the customer is close to a cobbler.  
**Repair shop** = actual repair work (always in the middle).

Pickup and return can mix (e.g. pickup via hub, return via nearby cobbler) based on distance and ops choice — both still use the same partner API + app tracking.

---

## 3. Hub vs Nearby Cobbler

| Path | Best when | Role |
|------|-----------|------|
| **GMP Hub** | Most home pickups; batching many pairs | Collection + sort before / after shop |
| **Nearby Cobbler** | Customer is close to a cobbler | Local handoff for pickup and/or return |

Hub does **not** replace the repair shop. Cobbler here is mainly a **local pickup/return point** on the way to / from the repair shop.

---

## 4. Partner connect (API with GetMyPair app)

We do **not** hire every rider ourselves for launch, and we do **not** use the courier’s website by hand for each order.

**Connection method:** GetMyPair connects to the courier by **API** (Shiprocket Quick / Shadowfax). Our **customer app** and ops screens talk to our server; our server books and tracks deliveries with the partner.

How it works in practice:

1. Customer pays in the **GetMyPair app**
2. Our system creates a pickup via the **partner API** (Customer → GMP Hub **or** Nearby Cobbler)
3. Partner assigns a rider and sends live status back to us (webhook / track API)
4. Customer sees status in the **app** (“picked up”, “at hub / cobbler”, “at repair shop”, “out for delivery”)
5. Same API path for return: Repair shop → GMP Hub **or** Nearby Cobbler → Customer

| Who | Role |
|-----|------|
| **GetMyPair app** | Customer books repair, sees tracking |
| **GetMyPair server + partner API** | Create order, cancel, track, map status |
| **Courier partner** | Real rider, ETA, proof of delivery |
| **Delivery web portal** | Internal test only — not for live partner bookings |

No manual booking in Shiprocket / Shadowfax dashboards for day-to-day orders once API is live.

---

## 5. Cost per delivery — Shiprocket Quick & Shadowfax

Public / indicative rates only. Final B2B price depends on city, distance, weight, and contract. Confirm with each partner’s sales team before quoting customers.

### Per one-way trip (one pickup → one drop)

| Partner | How they price | Typical city hop (approx.) | Notes |
|---------|----------------|----------------------------|--------|
| **Shiprocket Quick** | From **₹45** per order; about **₹10 / km**; **no surge** | **₹45 – ₹80** for ~3–5 km bike parcel | App / site: lowest from ₹45; ₹10/km advertised |
| **Shadowfax** (hyperlocal) | About **₹50** for first **0–4 km**, then **₹10 / km** (often capped ~7 km) | **₹50 – ₹80** for short city hop | Older public slab; live API returns `delivery_cost` (example ~₹42–₹78). Enterprise rates differ |

GST / rain / tip / COD may add on top. Failed pickup or cancel after rider arrives can still bill part or full charge.

### Full GetMyPair loop (4 legs)

```text
Customer → Hub or Nearby Cobbler → Repair shop → Hub or Nearby Cobbler → Customer
```

If each leg is a separate courier booking:

| Scenario | Shiprocket Quick (approx.) | Shadowfax (approx.) |
|----------|----------------------------|---------------------|
| Short city (each leg ~3–4 km) | **₹180 – ₹320** per pair round trip | **₹200 – ₹320** per pair round trip |
| Longer hops (each leg ~5–7 km) | **₹280 – ₹400+** | **₹280 – ₹400+** |

**Ways to cut cost**

- Batch **Hub → Repair shop** and **Repair shop → Hub** (many pairs in one bag / Porter run) so those two legs are shared, not ₹50+ per pair
- Negotiate a monthly volume rate after the pilot
- Keep Customer ↔ Hub on Shiprocket Quick or Shadowfax; use Porter for hub ↔ shop bags

**Rule of thumb for planning:** budget about **₹200 – ₹350 logistics per pair** for the full loop until a contracted rate is signed; then update this section with the real number.

---

## 6. Five courier options — recommended mix (%)

These % are for early volume / who we engage first, not a locked contract split. Revisit after one city pilot.

| Rank | Partner | Why it fits GetMyPair | Mix |
|------|---------|----------------------|-----|
| 1 | **Shiprocket Quick** | One account can reach several hyperlocal couriers; good first option | **30%** |
| 2 | **Shadowfax** | Strong city pickup & return; good for shoes door-to-door and reverse pickup | **28%** |
| 3 | **Porter** | Better when the hub sends a **bag of many pairs** to a repair shop | **15%** |
| 4 | **Borzo** | Fast same-day style city delivery | **15%** |
| 5 | **LoadShare** (or Delhivery where hyperlocal works) | Backup for more cities later | **12%** |

**Primary choice**

- Prefer **one contract, many riders** → **Shiprocket Quick**
- Prefer **one strong courier with clear pickup/return** → **Shadowfax**
- Use **Porter** when hub ↔ shop is a bulk run, not one shoe at a time

---

## 7. Rollout

| Step | What we do | Outcome |
|------|------------|---------|
| 1 | Lock hub address + city | We know where everything lands |
| 2 | Open account with primary partner (Shiprocket Quick *or* Shadowfax) | Can book real pickups |
| 3 | Pilot hub path: Customer → Hub → Repair shop → Hub → Customer | Prove the full loop |
| 4 | Pilot nearby cobbler path: Customer → Cobbler → Repair shop → Cobbler → Customer | Prove local handoff |
| 5 | Add Porter for hub ↔ shop bags when volume grows | Lower cost per pair on shop runs |
| 6 | Keep second partner as backup if the first misses SLA | Less downtime |

---

## 8. Open points

1. **Hub location** — which city first, and who staffs scan/bag for the first month?
2. **Primary partner** — Shiprocket Quick vs Shadowfax for P1?
3. **Who pays delivery** — included in repair price, separate line, or free above a cart value?
4. **SLA promise** — same-day pickup? next-day return? what we tell the customer in the app
5. **Failed pickup / customer not home** — retry rules and who calls the customer
6. **Damage / loss** — partner insurance vs our goodwill policy
7. **Internal portal** — keep for testing only; no go-live for partner riders

---

## 9. Out of scope

- Building a public delivery partner app for outside companies  
- Replacing Repairshops or Masteradmin dashboards  
- Changing payment or OTP (pickup still after the customer pays)

---

## 10. Summary

**Customer → GMP Hub or Nearby Cobbler → Repair shop → GMP Hub or Nearby Cobbler → Customer — book and track via courier API connected to the GetMyPair app; keep our delivery web portal for internal tests only.**
