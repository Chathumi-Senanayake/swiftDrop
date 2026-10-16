# Edge Cases SwiftDrop Handles

| # | Edge case | What happens | How |
|---|-----------|--------------|-----|
| 1 | 1,000 people buy the last units at the same millisecond | Exactly `stock` people succeed, everyone else gets "Sorry, this item is sold out." Never oversold. | Atomic `findOneAndUpdate` with `stock > 0` condition (`purchaseService.js`) |
| 2 | Two app servers process requests for the same item at once | Still no oversell | The check and the decrement happen inside MongoDB in one step, not in app memory |
| 3 | Customer double-clicks Buy Now | Only one request is sent | Button is disabled immediately until the server replies |
| 4 | Same customer sends two purchase requests at once (two tabs, script) | One succeeds, the other gets "You have already purchased this item." and its unit is returned | Unique index on `(userId, itemId)` for active orders + stock rollback |
| 5 | Customer buys the same item again later | Rejected with a clear message | Same unique index + early check |
| 6 | Customer cancels at the payment step | Order marked cancelled, unit goes straight back to stock and others can buy it | `cancel()` → `releaseReservation()` |
| 7 | Customer reserves and closes the browser | Unit is returned automatically after 5 minutes | Background job `releaseExpired()` every 15 s |
| 8 | Expiry job runs on 3 servers at the same time | Each reservation is released only once (no extra stock created) | Release only matches `status: 'reserved'` atomically |
| 9 | Customer confirms payment after the reservation expired | "This reservation has expired…" – no order without stock | `confirm()` only matches unexpired reserved orders |
| 10 | Customer tries to buy before go-live (e.g. calls the API directly) | "This sale hasn't started yet." | Server checks event status; button is also disabled |
| 11 | Customer tries to buy from a closed event | "This sale has ended." | Server-side status check |
| 12 | All items reach zero | Event automatically shows **Sold Out** | Status is computed from item stock |
| 13 | Countdown reaches zero while the page is open | Page switches to Live without reload | Countdown triggers a stock/status refresh |
| 14 | Admin force-opens an event early | Customers' pages switch to Live within 2 s | `manualStatus: 'live'` + polling |
| 15 | Admin tries to edit/delete a Live or Closed event | Rejected: "Only locked events can be edited." | Status check in `eventService` |
| 16 | Admin enters quantity outside 100–500, price ≤ 0, empty name, past go-live time | Clear validation message naming the item | `parseEventForm()` |
| 17 | Someone registers with an existing email (any letter case) | "An account with this email already exists." | Emails stored lower-case + unique index |
| 18 | Someone tries to sign up as admin | Impossible – registration always creates `customer` | `register()` ignores any role field |
| 19 | Customer calls admin endpoints | 403 "Only admins can do this." | `requireAdmin` middleware |
| 20 | Logged-out token is reused | Rejected immediately | Token is tied to a server-side session that logout deletes |
| 21 | Admin deactivates a customer who is logged in | Their next request fails and they cannot log in again | Sessions deleted + `active` checked on every request |
| 22 | Forged or tampered token | Rejected | JWT signature verified on every request |
| 23 | Traffic spike beyond capacity | Extra requests get a friendly 429 JSON at Nginx, app servers stay healthy | Nginx `limit_req` zones |
| 24 | One user/bot spamming the purchase API | Limited to 2 requests/second | Per-user Nginx zone keyed by login token |
| 25 | One app server crashes | Nginx routes traffic to the other two | Upstream `max_fails` / `proxy_next_upstream` |
| 26 | A purchase POST times out at Nginx | Not retried on another server, so there's no accidental double purchase | Nginx never retries non-idempotent requests |
| 27 | Unknown URL, invalid ID, broken JSON, oversized/non-image upload | Structured JSON error, never a stack trace or HTML page | Central `errorHandler.js` + Nginx JSON error pages |
| 28 | Network drops while buying | "Cannot reach the server. Please check your connection." and the button re-enables | `api()` helper in `common.js` |
| 29 | Event details change after an order was made | Order history still shows the original names and price | Order stores a copy of item/event name and price |
| 30 | Image URL breaks | A placeholder image is shown | `onerror` fallback |
