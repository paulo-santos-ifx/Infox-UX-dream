---
name: backend-guidelines
description: Decide how a backend behaves — trust boundary and server-side validation, caching and invalidation, transaction boundaries, idempotency and retries, query shape and N+1, pagination, safe migrations, background work, and failure of external services. Stack-agnostic. TRIGGER on any backend, API, service, worker, or data-layer task. SKIP for pure UI work with no server behavior.
metadata:
  version: "1.0.0"
---

# Backend Guidelines

The mirror of `frontend-guidelines/SKILL.md`: not how anything looks, but **how the server behaves
under real traffic, real concurrency, and real failure**.

Nothing here is tied to a framework, a language, or a database. These are the backend decisions that
are expensive to reverse and quiet when wrong — they do not fail in the test suite, they fail in
production at a load the suite never reproduced.

---

## 1. The trust boundary

**The client is hostile and fully under the attacker's control.** Not "a curious user with dev
tools" — an attacker sending handcrafted requests with no browser involved.
- **Validate every input server-side**, by type, range, length, and shape, regardless of what the
  client already validated. Client-side validation is feedback for honest people; it is never a
  control.
- **Everything the client sends is attacker-chosen** — headers, cookies, hidden fields, ordering,
  content type, body size.
- **A disabled button, a hidden route, and an absent menu item are not authorization.**
- **Bound everything that can grow:** string length, array size, page size, upload size, request
  body. An unbounded list parameter is a denial-of-service knob.

Rule of thumb: if a rule matters, it is enforced on the server, and the server's version is the one
with a test. `security-scan/SKILL.md` verifies this at Phase 13; this section is how you build it so
the verification passes.

---

## 2. Caching

Cache is the most common source of "it works on my machine and lies in production", because a cache
bug does not fail — it succeeds with the wrong answer.

### Decide three things, explicitly, before adding any cache

1. **What is the key?** It must include everything the value varies on: resource id, **tenant or
   user**, role, locale, currency, version, feature flags. A key that omits the tenant is a
   cross-tenant leak that waits for traffic to reveal itself.
2. **What invalidates it?** Name the events. "It expires in five minutes" is a TTL, not an
   invalidation strategy — it is the answer to _how stale may this get_, not to _what makes this
   wrong_.
3. **How wrong may it be?** Some data tolerates minutes (a public product list). Some tolerates
   seconds (a dashboard count). Some tolerates nothing (a balance, a permission, a stock level at
   checkout). Write the tolerance in the spec; it is a product decision, not a technical one.

If any of the three has no answer, the cache is not ready to be added.

### Where the cache lives changes the rules

| Layer                          | Shared between users?                   | The rule that matters                                                                                          |
| ------------------------------ | --------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| **Per-request memo**           | No                                      | Safe, cheap, and the first thing to reach for. Dies with the request                                           |
| **Process memory**             | Yes, within one instance                | Inconsistent across instances — never for anything that must agree between callers                             |
| **Shared store** (Redis, etc.) | Yes, globally                           | Needs an explicit key discipline and an invalidation path. Its failure is a dependency failure — see section 9 |
| **HTTP / CDN**                 | Yes, globally, and outside your control | See below. The highest blast radius on this list                                                               |

### HTTP and CDN cache — where cache meets authorization

**An authenticated or personalized response must never be cacheable on a shared layer.**
`Cache-Control: public` on a personalized endpoint serves one user's data to the next, through a CDN
doing exactly what it was told. Authenticated responses are `private`, or `no-store` when they carry
anything sensitive.
- Set `Vary` for every header the response actually depends on — authorization, accept-language,
  anything that changes the body.
- `stale-while-revalidate` is the right tool for tolerable staleness on public data, and the wrong
  tool for anything a permission change must revoke immediately.
- **When permission is revoked, what still serves the old answer, and for how long?** If the answer
  is "up to the TTL", that TTL is your revocation delay. Decide whether that is acceptable and write
  it down.

### Invalidation

- Prefer **invalidate on write** over waiting for expiry, for anything a user can change and then
  immediately look at. The single loudest bug class in caching is "I saved it and it still shows the
  old value".
- **A failed invalidation must be visible.** Silent failure here means indefinitely stale data with
  no signal.
- Beware the **stampede**: when a hot key expires, every concurrent request misses at once and
  rebuilds the same value against the database. Use a lock, a staggered TTL, or serve stale while
  one caller refreshes.
- **Never cache an error response** unless you meant to, with a short deliberate TTL. Caching a 500
  turns a blip into an outage.

---

## 3. Transaction boundaries

- **One unit of business meaning, one transaction.** A transaction that spans two unrelated
  operations locks more than it needs; two transactions where one was meant leave the system
  half-updated.
- **Nothing external inside a transaction** — no HTTP call, no queue publish, no email. The
  transaction holds locks for as long as the third party takes to answer, and rolls back work the
  third party already saw.
- **Publish after commit**, not before. Otherwise a consumer reacts to a state that never existed.
- **Name the isolation level** when the operation reads and then writes based on what it read. The
  default is a choice even when nobody makes it, and read-modify-write under the wrong level is how
  two concurrent callers both succeed at spending the same balance.

---

## 4. Idempotency and retries

Every network call in the system will be retried, by a client, a proxy, a queue, or a person hitting
a button twice.
- **Any operation with an external effect needs an idempotency key** — charging, sending, creating.
  Same key, same result, exactly one effect.
- **A retry with no idempotency is a duplicate**, and for payments that is money.
- **Retries need backoff and a ceiling.** Immediate uniform retries from many clients turn a brief
  failure into a sustained one.
- **Only retry what is safe to retry.** A timeout does not mean the work did not happen — it means
  you do not know. Treat unknown as "may have succeeded".
- **Consumers are at-least-once by default.** Design for the message arriving twice, because it will.

---

## 5. Query shape

- **N+1 is the default outcome**, not an edge case — a loop that touches a relation per item is how
  a 50 ms endpoint becomes 5 s at real data volume. Check the query count, not just the response.
- **Select what is used.** Fetching whole rows to read one column costs on every layer.
- **Indexes follow the queries you actually run**, including the sort and the filter together. An
  index that does not match the query shape is storage and write cost with no read benefit.
- **Test against realistic volume.** Every query is fast against fifty rows, which is exactly why a
  suite that only ever sees fifty rows never catches this.

---

## 6. Pagination

- **Every list endpoint is paginated from the first version.** Adding pagination later is a breaking
  change to every caller.
- **A maximum page size is enforced server-side.** `?limit=1000000` is an input, and section 1
  applies.
- **Offset pagination drifts** when rows are inserted or removed mid-traversal: callers see
  duplicates and skips. Cursor pagination is the correct default for anything that changes.
- **The sort must be total.** Sorting by a non-unique column without a tiebreaker gives an unstable
  order and therefore unstable pages.

---

## 7. Safe migrations

The schema changes while the old code is still running. Plan for both being live at once.
- **Expand, migrate, contract** — add the new shape, move the data and the reads, remove the old
  shape in a later deploy. Never all three at once.
- **Additive first:** a new column is nullable or defaulted; making it required comes after the
  backfill.
- **Backfill in batches**, not one statement over the whole table, and make it resumable.
- **Know what locks.** A migration that takes an exclusive lock on a large hot table is an outage
  with a deployment ticket attached.
- **Every migration has a reversal**, or an explicit written note that it is one-way and why.

---

## 8. Background work

- **The request path does only what the caller must wait for.** Everything else is queued.
- **A job is a retry waiting to happen**, so section 4 applies in full.
- **A failed job must be visible** — a dead-letter path, not a swallowed exception in a worker log
  nobody reads.
- **Scheduled work overlaps.** A job that takes longer than its interval will run concurrently with
  itself unless prevented.
- **Jobs need a timeout.** Unbounded work holds a worker forever and starves the queue.

---

## 9. When the outside fails

Every external dependency is down right now for someone.
- **Every outbound call has a timeout.** The default in most clients is "forever", and a hung call
  holds a connection, a thread, and eventually the pool.
- **Decide the degraded behavior per dependency:** fail the request, serve stale, serve partial, or
  queue for later. Write it in the spec — the default of "propagate a 500" is a decision too, and
  usually the wrong one for a non-essential dependency.
- **Do not let one slow dependency take the service down.** Bound concurrency toward it and stop
  calling it when it is clearly failing.
- **A third party's error is not your error message.** Translate it; never forward the upstream body
  to the caller, which is both confusing and a disclosure surface.

---

## 10. Separation of responsibilities

The mirror of the same section in `frontend-guidelines`.
- **Business rules live where a test reaches them without a server, a database, or a queue.** The
  check is mechanical: can this rule be tested without booting anything? If not, it is in the wrong
  place.
- **Transport is not logic.** A route handler parses, authorizes, delegates, and formats. It does not
  decide.
- **The data layer returns data, not decisions.**
- **Configuration is injected, never read from the environment deep inside a rule** — a rule that
  reads `process.env` cannot be tested twice with different values.

---

## Cascade

| Skill                                  | When                                             | Relationship                                                                                                         |
| -------------------------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `security-scan/SKILL.md`               | **Phase 13, always**                             | Verifies what this skill tells you to build — trust boundary, cache on shared layers, error disclosure, dependencies |
| `context7-mcp/SKILL.md`                | Any framework, driver, or SDK specific question  | Current documentation instead of recalled API shapes                                                                 |
| `frontend-guidelines/SKILL.md`         | The change has a UI side                         | The client half of the same contract: states, copy, what a failure shows                                             |
| `large-scale-refactor/SKILL.md`        | The change is structural or a migration of shape | Sequencing and safety for large moves                                                                                |
| `generating-end-to-end-tests/SKILL.md` | Phase 7, when the flow crosses a browser         | Multi-step workflows rather than unit boundaries                                                                     |

---

## Anti-patterns

- trusting any client-side validation as a control;
- adding a cache without naming its key, its invalidation, and its tolerable staleness;
- a cache key that omits the tenant or the user;
- `Cache-Control: public` on anything authenticated or personalized;
- a TTL presented as an invalidation strategy;
- an HTTP call, a queue publish, or an email inside a transaction;
- publishing an event before the transaction commits;
- an external effect with no idempotency key;
- retrying without backoff, or retrying something unsafe to retry;
- a list endpoint with no pagination and no maximum page size;
- offset pagination over data that changes;
- adding a required column and backfilling it in one migration;
- an outbound call with no timeout;
- forwarding a third party's error body to the caller;
- a business rule that can only be tested by booting the application.

---

## Checklist

- [ ] Every input validated server-side, with bounds on anything that can grow
- [ ] Each cache has a stated key, invalidation trigger, and tolerable staleness
- [ ] No authenticated response cacheable on a shared layer; `Vary` correct
- [ ] Revocation delay known and accepted where a TTL applies
- [ ] Transactions hold no external calls; events publish after commit
- [ ] External effects carry an idempotency key; retries have backoff and a ceiling
- [ ] Query count checked, not only response time; indexes match real queries
- [ ] List endpoints paginated with an enforced maximum and a total sort
- [ ] Migrations are expand/migrate/contract, batched, reversible or explicitly one-way
- [ ] Background jobs have timeout, overlap protection, and a visible failure path
- [ ] Every outbound call has a timeout and a written degraded behavior
- [ ] Business rules testable without booting the application
