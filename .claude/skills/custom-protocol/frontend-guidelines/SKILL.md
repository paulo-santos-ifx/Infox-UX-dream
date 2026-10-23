---
name: frontend-guidelines
description: Decide how a frontend behaves and what it says — rendering boundary (server vs client), separation of responsibilities, end-user copy, what a crawler sees (indexability, metadata, canonical, sitemap, structured data), data and state surfaces, what a failure reveals, and the accessibility baseline. Stack-agnostic. TRIGGER on any frontend task, loaded alongside frontend-master, which covers how the interface looks. SKIP only for pure visual work with no data, no state, and no user-facing text.
license: Complete terms in LICENSE.txt
metadata:
  version: "2.2.1"
---

# Frontend Guidelines

`frontend-master` decides **how the interface looks**. This skill decides **how it behaves and what
it says**. Both load on a frontend task; neither replaces the other.

Nothing here is tied to a framework. These are the frontend decisions that are expensive to get
wrong in any stack, and that no aesthetic direction can rescue.

---

## 1. The rendering boundary — server or client

This is the highest-cost decision on the list, because it is the hardest to reverse once components
are built around it, and because getting it wrong leaks secrets.

**Default to the server.** Move work to the client only for a reason you can name out loud:
- it needs an event handler or a browser-only API;
- it holds state that must survive interaction without a round trip;
- it must react to something the server cannot observe.

"It felt easier" is not a reason. Neither is "the whole page is already client".

**What crossing the boundary costs**, and what to weigh before crossing:

| Cost         | Why it matters                                                                                               |
| ------------ | ------------------------------------------------------------------------------------------------------------ |
| Bundle       | Client code ships to every visitor, on every device, over their network                                      |
| Hydration    | The page becomes interactive later than it becomes visible                                                   |
| **Exposure** | **Anything reachable from client code is public** — keys, tokens, internal endpoints, the shape of your data |

**The exposure line is absolute.** A secret in client code is a published secret, whatever the
variable is named and whatever the bundler is configured to strip. When the task touches keys,
tokens, or credentials, this is a Phase 2.3 concern and OWASP applies — do not decide it by feel.

**Record the boundary in the spec.** Which parts render on the server, which are interactive, and
why. A reviewer who cannot tell from the spec will not be able to tell from the diff either.

---

## 2. Separation of responsibilities

**A component either renders or decides — not both.**
- **Business rules do not live in components.** They live where a test can reach them without
  rendering anything. The check is mechanical: _can I test this rule without a DOM?_ If the answer
  is no, the rule is in the wrong file.
- **Data fetching belongs at a boundary**, not scattered through leaves. A leaf that fetches its own
  data cannot be reused, cannot be tested in isolation, and turns one screen into N requests.
- **Presentation components take data, not sources.** Pass the value, not the query.

This is what makes Phase 5 (tests before code) possible at all on a frontend task. A rule buried in
a component forces every test through the DOM, and the suite becomes slow enough that people stop
running it — which is how the protocol's whole loop quietly dies.

---

## 3. Write for the person using it, not the person who built it

The protocol already requires **screen text in one short line, for laypeople**. This section is that
rule made operational.
- **Name things the way the user names them**, not the way the schema does. They have a _payment_,
  not a `transaction_record`. They have an _account_, not a `principal`.
- **An error says what happened and what to do next.** It does not say which layer failed.
- **One short line.** If a message needs a paragraph, the design is wrong — fix the flow, not the
  wording.
- **Never put on screen:** exception text, stack traces, internal ids, database field names, HTTP
  status codes as prose, library names, or the word "invalid" with nothing after it.

| Instead of                                         | Write                                                 |
| -------------------------------------------------- | ----------------------------------------------------- |
| `Error 422: validation failed on field user_email` | Check the email address and try again                 |
| `Null reference in PaymentProvider.charge()`       | We could not complete the payment. No charge was made |
| `Session token expired (JWT exp)`                  | You have been signed out. Sign in to continue         |
| `Failed to fetch`                                  | We could not reach the server. Check your connection  |

**Risk and consequence text is the human's to approve**, never the agent's to invent — it goes in
the spec as a table for signature, per the protocol's delivery rules. Copy that tells someone their
data will be deleted, their payment is final, or their account will close is not a wording choice.

---

## 4. What the crawler sees

This is not a separate discipline bolted on at the end. It is a consequence of section 1: **what a
crawler indexes is what arrives in the initial HTML.** A page rendered entirely on the client ships
an empty shell, and the decision that produced it was the rendering boundary, not a missing meta tag.

Every major framework states this in its own docs — SvelteKit renders on the server by default and
calls disabling it discouraged; Nuxt describes server rendering as what makes content immediately
indexable. Treat client-only rendering of indexable content as a decision that has to be argued for.

### Use the framework's head API, never hand-written tags

Do not write `<title>` and `<meta>` into the document head by hand when the framework offers an API
for it. Next.js says this outright: the Metadata API exists because it handles **streaming and
de-duplication of head elements**, which hand-written tags break. The same reasoning applies to
`useHead`/`useSeoMeta` in Nuxt and `<svelte:head>` in Svelte.

Hand-written tags produce the failure that is hardest to notice: two `<title>` elements, or a title
that is correct in development and empty under streaming.

### The minimum every indexable page owes

- **A unique title and a unique description.** Not the site name repeated on forty pages. If two
  pages cannot be told apart by their title, the information architecture is the problem.
- **A canonical URL built from a configured origin**, never from the incoming request. Building it
  from the request gives you a different canonical per preview deployment, per proxy, and per
  hostname the app answers on — all pointing at the wrong place.
- **An Open Graph image at a stable URL.** A content-hashed or query-generated asset URL changes on
  every build, so anything that cached the preview now points at nothing.
- **Language and direction** declared on the document.

### Generated, not hand-maintained

`sitemap` and `robots` belong to the route layer, generated from the same source of truth as the
routes themselves. A hand-maintained sitemap drifts from the site within one sprint, and the drift
is silent.

Say explicitly which routes must **not** be indexed — authenticated areas, staging hosts, search
result pages, paginated duplicates. "We forgot to exclude it" is how an internal admin route ends up
in a search index.

### Structured data has a security edge

Structured data (JSON-LD) is serialized into a `<script>` tag, so a value that reaches it from user
content can close the tag and inject script. Escape `<` when serializing — Next.js documents this
precisely, replacing it with `\u003c`. This is the same input-trust concern as section 1 of
`security-scan/SKILL.md`, arriving through a channel nobody thinks of as an input.

### Partial hydration changes what is visible

In an islands architecture, or with any client-only boundary, content inside a client component may
not exist in the initial HTML at all. Before assuming a section is indexable, check the **rendered
HTML**, not the browser DOM — the DOM shows what the page became, not what the crawler received.

### Anti-patterns

- indexable content that only exists after client-side rendering, with no reason stated;
- `<title>` and `<meta>` written by hand where the framework offers a head API;
- one title reused across many pages;
- a canonical URL derived from the incoming request;
- an Open Graph image at a hashed or generated URL that changes each build;
- a hand-maintained sitemap;
- no explicit list of what must not be indexed;
- user content interpolated into JSON-LD without escaping `<`;
- verifying indexability in the browser DOM instead of the served HTML.

---

## 5. Data and state surfaces

**Every screen that loads data has four states, not one.** Design all four, or state in the spec why
one cannot happen:
1. **Loading** — and whether it blocks the screen or a region of it.
2. **Empty** — the result came back and there is nothing. This is a design surface, not a blank div;
   it is also the first thing a new user sees, so it is the highest-leverage screen in the product.
3. **Error** — see section 6 for what it may say.
4. **Partial or stale** — some of it arrived, or what is shown is older than it looks. Say so.

**An optimistic update needs a rollback path** before it is written, not after it is reported. If
the failure path was not designed, the update is not optimistic — it is a lie with good timing.

**Stale is usually decided elsewhere.** How long data may be wrong, what invalidates it, and what a
revoked permission still serves are caching decisions — see `backend-guidelines/SKILL.md` section 2.
What belongs here is the consequence on screen: if the value can be stale, the screen says so, and
the action that would be wrong against stale data is not offered.

---

## 6. What the screen reveals when it fails

An error surface is an information disclosure surface. This connects directly to Phase 2.3 (OWASP
Top 10 and ASVS) and is checked again in Phase 13.
- **Never disclose whether an account exists.** "No user with that email" hands an attacker a
  membership oracle. The sign-in and the password-reset responses must be indistinguishable.
- **Never expose internal paths, framework versions, or stack traces**, including in a collapsed
  "details" section and including in a response body the UI does not render.
- **Separate what the user may know from what the log records.** The person gets one short line; the
  log gets the correlation id, the stack, and the context. Put the id on screen only if support will
  actually ask for it.

---

## 7. Accessibility baseline

This is the floor that applies to every frontend task, not the full audit — the audit is
`web-design-guidelines` during Phase 13.
- **Semantic elements before ARIA.** A `<button>` that is a `<div>` with a click handler is broken
  for keyboards, screen readers, and the browser's own behavior. ARIA patches; semantics prevent.
- **Everything reachable by keyboard**, in an order that matches the visual one, with a focus state
  that is visible against the actual background.
- **Contrast checked on the real palette**, not assumed from the design direction.
- **Motion respects `prefers-reduced-motion`.** Vestibular disorders are not an edge case.
- **Every input has a label** — placeholder text is not a label, and it disappears exactly when the
  person needs it.

---

## Cascade

This skill is one stop in the frontend chain. Load the others when their condition holds:

| Skill                                  | When                                                         | Relationship                                                                                                             |
| -------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| `frontend-master/SKILL.md`             | **Always**, on any frontend task                             | Decides how it _looks_ — aesthetic direction, typography, color, composition. Load it with this one                      |
| `design-motion-principles/SKILL.md`    | The task creates or changes motion                           | Transitions, hover states, micro-interactions, enter/exit. Mandatory when motion is touched                              |
| `generating-end-to-end-tests/SKILL.md` | Phase 7, when the change is exercised through a browser flow | Multi-step user workflows rather than unit boundaries                                                                    |
| `web-design-guidelines/SKILL.md`       | Phase 13, critical code review                               | The full interface audit. This skill's section 7 is the floor; that one is the ceiling                                   |
| `backend-guidelines/SKILL.md`          | The change has a server side                                 | The other half of the same contract — including **caching**, whose staleness lands on the screens described in section 4 |
| `security-scan/SKILL.md`               | **Phase 13, always**                                         | Verifies the exposure and disclosure rules in sections 1 and 6                                                           |

Order on a typical frontend task: `frontend-master` + this skill while deciding →
`design-motion-principles` if motion enters → `generating-end-to-end-tests` at Phase 7 →
`web-design-guidelines` at Phase 13.

---

## Anti-patterns

- moving a component to the client without a reason you can state in one sentence;
- any secret, key, token, or internal endpoint reachable from client code;
- a business rule that can only be tested by rendering something;
- a leaf component that fetches its own data;
- screen text that names a table, a field, a layer, a library, or an exception;
- an error message that reveals whether an account exists;
- shipping a data screen with only the success state designed;
- an optimistic update with no rollback path;
- an interactive element that is a `<div>`;
- inventing risk or consequence copy instead of putting it in the spec for the human to approve;
- treating section 7 as the accessibility review — it is the floor, not the audit.

---

## Checklist

Before calling a frontend task done:
- [ ] The rendering boundary is decided and written in the spec, with the reason
- [ ] Nothing secret is reachable from client code
- [ ] Business rules are testable without rendering
- [ ] Data is fetched at a boundary, not in leaves
- [ ] Every user-facing string is one short line, in the user's vocabulary
- [ ] Indexable content is in the served HTML, checked there and not in the browser DOM
- [ ] Title, description and canonical are unique and produced by the framework's head API
- [ ] Sitemap and robots are generated, and what must not be indexed is named
- [ ] Risk and consequence copy is in the spec, awaiting the human's signature
- [ ] Loading, empty, error, and partial states all exist or are explicitly ruled out
- [ ] Error surfaces disclose nothing about accounts, paths, versions, or stack
- [ ] Keyboard reachable, focus visible, labels present, contrast checked
- [ ] `prefers-reduced-motion` respected wherever motion was added
