# ADR 0001: Phased Password Gate — Client-Side First, Edge Later

## Status

Accepted

## Context

NDA-protected projects must be gated behind a shared password. The site is hosted on Cloudflare Pages as a fully static build. The build output is flat HTML files served from a CDN — there is no server runtime to check authentication before serving content.

Two implementation paths exist:

- **Client-side gate (courtesy lock)**: the page HTML loads in the browser, a JS overlay hides content behind a password prompt. The raw HTML content is technically visible in View Source / network tab. Password verification happens in the browser, and a cookie tracks authentication. Immediate to implement.
- **Edge gate (Cloudflare Pages Functions)**: a Cloudflare Pages Function middleware checks the authentication cookie at the edge before the static HTML is served. Unauthenticated requests are redirected to `/login`. The page bytes never reach the browser. Requires writing a `functions/` middleware, which the free tier supports.

## Decision

We will implement the client-side gate first and upgrade to a Cloudflare Pages Function edge gate later. Both phases are in the same repository — the edge function will be additive, not a rewrite.

### Phase 1 — Client-side courtesy lock
- NDA project detail pages load normally in the browser
- A JS component checks for the presence of a password cookie
- If absent, an overlay covers the page content with a password form
- On correct password entry, a cookie is set (7-day expiry) and the overlay is removed
- **Authenticated reveals the page instantly** (no navigation)

### Phase 2 — Cloudflare Pages Function edge gate
- A `functions/projects/[slug].ts` middleware checks the password cookie at the edge
- Valid cookie → serve the page as normal
- Invalid/missing cookie → HTTP 302 redirect to `/login`
- The client-side overlay remains as a fallback for JS-disabled edge cases

## Consequences

- **In Phase 1, NDA page content is technically public** at the URL. Any visitor who inspects the page source or disables JS can see the raw HTML and image references. This is acceptable because the password is a courtesy barrier, not a legal access control for actual NDA content (which would not be hosted statically).
- The phased approach allows the full site to ship and the visual design to stabilize before adding edge function complexity.
- The `/login` page, password hashing logic, and cookie mechanism are the same across both phases — the upgrade is additive.
- If a more rigorous access control is ever needed (e.g., per-client passwords, expiry dates), this pattern naturally scales to a Cloudflare Worker with KV storage.
