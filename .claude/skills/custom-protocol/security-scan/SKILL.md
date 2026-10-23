---
name: security-scan
description: Sweep an implementation for security defects before delivery — input trust boundary, object-level authorization, authentication and session, timing side channels, secret exposure, cache on shared layers, rate limiting, error and log disclosure, dependency vulnerabilities, and data at rest. Produces a security-scan.md report and hands every finding to the human to decide. TRIGGER in Phase 13 when the change adds or upgrades dependencies, handles real input, loads a third-party script or integration, or adds server code. SKIP for purely presentational changes (styles, layouts, static content).
metadata:
  version: "1.0.0"
---

# Security Scan

## Where this runs

**Phase 13, after `critical-code-review/SKILL.md`, before Final Delivery**, whenever the change has
a surface: dependencies added or upgraded, a real form or input handling, a third-party script or
integration, or server code. A purely presentational change (styles, layouts, static content) is
exempt, and the delivery states that the scan was skipped and why.

When in doubt whether a change has a surface, it has one: **a plain input field is a surface.** So
is a new query parameter, a new dependency, an embedded third-party script.

---

## Core stance: never trust the frontend

Every check below rests on one assumption: **the client is hostile and fully under the attacker's
control.** Not "a user with dev tools" — an attacker replaying, forging, and reordering requests
with no browser involved at all.

Therefore:
- **Client-side validation is a convenience, never a control.** It exists so honest people get fast
  feedback. If a rule matters, the server enforces it again, independently, and the server's version
  is the one that is tested.
- **Anything the client sends is attacker-chosen**, including headers, cookies, hidden fields,
  ordering, content type, and the size of the body.
- **Anything the client receives is public**, including fields the UI does not render, values in a
  collapsed debug panel, and data embedded for a component that never mounts.
- **A disabled button, a hidden route, and an absent menu item are not authorization.**

When a finding traces back to "the frontend already prevents that", it is a finding, not a defence.

---

## What this skill produces

A file at `.sprints/<NN> <Sprint Name>/security-scan.md` (or the repository's review folder when the
work is not a sprint). It must exist even when the sweep finds nothing, so a scan that ran cannot
be confused with one that never happened.

```markdown
# Security Scan — <sprint or change>

Date: <YYYY-MM-DD> · Commit/branch: <ref> · Surfaces touched: <list, or "none">

## Findings

### S1 — <one-line title>

- **Severity:** critical | high | medium | low
- **Where:** `path/to/file.ts:42`
- **What:** what is wrong, in one or two sentences
- **How it is exploited:** concrete path — the request, the input, the sequence
- **OWASP:** A01:2021 Broken Access Control
- **Fix:** what the correct shape is
- **Decision:** fix now | accepted risk (human's words, recorded verbatim)

## Dependency check

<tool output summary + web search date and sources>

## Conclusion

<one paragraph: what was swept, what was found, what the human decided>
```

"No findings" is a valid and common report. Write it anyway — the record that the sweep ran is the
point, and a sprint whose report is missing cannot be distinguished later from a sprint where
nobody looked.

---

## What the human decides — always

**This skill orients and reports. It never fixes on its own judgement.**

After the report is written, present the findings and ask, in one message:

> "Encontrei N achados de segurança. Para cada um: corrijo agora ou aceitamos o risco?"

Then, per finding, the human picks one:

| Decision              | What the agent does                                                                                                                                                                  |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Fix now**           | Implement the fix inside this sprint, following the full protocol — spec, test RED → GREEN, refactor. A security fix is not exempt from the loop                                     |
| **Accept the risk**   | Record it in the report in the human's own words, with the reason. An accepted risk is a decision, not a silence                                                                     |

Never bundle the decisions into one question with one answer. A critical finding and a low one do
not deserve the same reflex.

**A critical or high finding blocks delivery** until the human has decided on it. Accepting the risk
unblocks it; ignoring it does not.

---

## The sweep

Walk all ten. For each one, either name what you checked or state that the surface is not present in
this change.

### 1. Input and trust boundary

- Every input the server accepts is validated **server-side**, by type, range, length, and shape.
- Length and size limits exist — on strings, arrays, uploads, and the request body itself. An
  unbounded array is a denial-of-service parameter.
- Parsing is total: malformed input produces a handled error, not an unhandled exception.
- The input is used in a way that cannot change the meaning of what it lands in — parameterized
  queries, never string-built SQL; no user value reaching a shell, an eval, a path, a template, a
  redirect target, or a deserializer without validation.
- Content type is checked, not assumed.

### 2. Object-level authorization

The most common real-world API defect: the endpoint checks _who you are_ and forgets to check _what
you own_.
- Every request that names a resource verifies that the caller may access **that specific
  resource**, at the point of access, not in a layer above it.
- Identifiers that are sequential and guessable (`/invoices/1234`) get extra attention — the test is
  simply: does the id of another tenant's record return data?
- Authorization is enforced on write and on **read**, and on the list endpoint too — filtering in the
  UI is not filtering.

### 3. Authentication and session

- Credentials are never compared with `===`; see section 4.
- Session invalidation on logout, on password change, and on privilege change actually revokes
  server-side, not just client-side.
- Token lifetime, refresh, and storage are stated explicitly and defensible.
- Multi-step flows (reset, verification, invite) expire, are single-use, and are bound to the
  account they were issued for.

### 4. Timing and side channels

Two responses can be byte-identical and still tell an attacker which branch ran.

**The classic:** "no such user" returns in 5 ms because nothing happened; "wrong password" returns in
300 ms because the password hash ran. The messages match perfectly and the timing is a membership
oracle.

**Random delay does not fix this.** Jitter averages out: an attacker takes 500 samples, the noise
cancels, and the 295 ms gap reappears cleanly. It costs every honest user latency and closes
nothing. Treat "we added a random delay" as an open finding.

What works:
1. **Always pay the expensive cost.** When the user does not exist, run the hash anyway against a
   fixed **dummy hash**. Both branches do the same work, so both take the same time.
2. **Constant-time comparison for every secret** — `crypto.timingSafeEqual` or the platform's
   equivalent, never `===`. `===` returns at the first differing byte, so the duration counts how
   many bytes the attacker got right. This applies to tokens, HMACs, API keys, verification codes,
   and signatures.
3. **If a floor is needed, use a fixed deadline, not noise** — respond at ≥ 200 ms always, rather
   than 200 ms plus a random amount.

Also check for non-timing oracles with the same shape: differing status codes, differing response
sizes, differing headers, or a redirect that only happens on one branch.

### 5. Secrets

Sweep where a secret can end up without anyone deciding to put it there:
- **the client bundle** — anything reachable from client code is published, whatever the variable is
  named and whatever the bundler claims to strip;
- **error bodies** returned to the caller, including ones the UI does not render;
- **logs**, including the request logger that prints whole bodies and the error handler that prints
  whole objects;
- **the repository** — committed `.env`, fixtures with real credentials, and the git history, which
  keeps them after the file is deleted;
- **URLs and query strings**, which land in access logs, referrers, and browser history.

A secret that was ever committed is compromised. The finding is "rotate it", not "remove the file".

### 6. Cache on shared layers

Where caching and authorization meet, and the failure is silent and severe.
- **An authenticated response must never be cached on a shared layer.** `Cache-Control: public` on a
  personalized endpoint serves user A's data to user B, through a CDN that is working exactly as
  configured. Authenticated responses are `private`, or `no-store` when they carry anything
  sensitive.
- **The cache key includes everything the response varies on** — user or tenant, role, locale,
  currency, feature flags. A key that omits the tenant is a cross-tenant leak waiting for traffic.
- **`Vary` is set correctly** for any header the response depends on.
- **Application-level caches carry the same rule:** a memoized lookup keyed only by resource id,
  shared across requests, serves the first caller's authorization decision to everyone after them.
- **Invalidation on permission change:** when access is revoked, what still serves the old answer,
  and for how long?

See `backend-guidelines/SKILL.md` for how to decide caching in the first place; this section checks
what was decided.

### 7. Rate limiting

- Anything **guessable** is limited: login, password reset, verification codes, invite lookup,
  anything that answers "does this exist?".
- Anything **expensive** is limited: report generation, export, search, upload processing, an
  endpoint that fans out to third parties.
- The limit is keyed on something the attacker cannot rotate freely — account plus IP, not IP alone.
- Hitting the limit does not itself leak (a different response for "limited on an existing account"
  versus "limited on a nonexistent one" is the section 4 oracle again).

### 8. Error surfaces and logs

The pair rule, in both directions:
- **To the user:** one short line, no stack, no internal path, no framework version, no database
  field, no indication of whether an account exists. See `frontend-guidelines/SKILL.md` section 5.
- **To the log:** enough to diagnose — correlation id, stack, context — and **never** a password, a
  token, a full card number, a session id, or personal data that the retention policy does not cover.

Check the unhandled path too: what does the framework's default error page or default JSON error
return in production?

### 9. Dependencies — always, with a web search

This step runs on **every** scan, not only when dependencies changed. A lockfile that did not change
does not mean the world did not.
1. Run the ecosystem's audit tool if present (`npm audit`, `pnpm audit`, `pip-audit`, `cargo audit`,
   `govulncheck`) and record the output.
2. **Search the web for advisories on the direct dependencies this change relies on**, and on
   anything the audit tool flagged. Record the date of the search and the sources — an audit run is
   evidence only with a date attached.
3. For anything found, state: does this project's usage actually reach the vulnerable path? A
   critical CVE in a code path this project never calls is a different decision from one on the hot
   path, and the report should say which it is.
4. New dependencies added by this change get a second look beyond CVEs: maintenance, install
   scripts, transitive weight. This repository's `SECURITY.md` records the standing position.

### 10. Cryptography and data at rest

- Passwords are hashed with a deliberate, slow, salted algorithm (argon2, scrypt, bcrypt) — never a
  general-purpose digest, never unsalted.
- No hand-rolled cryptography, no ECB, no static IV, no `Math.random()` for anything security
  bearing.
- Key material has a stated origin, scope, and rotation story.
- Personal data at rest is classified: what is stored, why, for how long, and what deletion means.

---

## Anti-patterns

- skipping the scan on a change that has a surface (dependencies, real input, third-party script or
  integration, server code);
- fixing a finding without asking the human first;
- a fix applied outside the protocol loop because "it is just a security patch";
- random delay offered as a timing mitigation;
- `===` on a token, an HMAC, or a verification code;
- treating client-side validation, a hidden route, or a disabled control as authorization;
- an audit tool run with no web search and no date;
- a critical finding left undecided at delivery;
- no `security-scan.md` produced when the scan ran.

---

## Checklist

- [ ] All ten sections swept; each either checked or explicitly marked not present
- [ ] `security-scan.md` written, even when nothing was found
- [ ] Every finding carries severity, location, exploitation path, and OWASP reference
- [ ] Dependency audit run **and** web search performed, both dated
- [ ] Every finding presented to the human, one decision each
- [ ] No critical or high finding left undecided
