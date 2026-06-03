# Context — Brandon's Portfolio

A glossary of canonical terms for this codebase. No implementation details.

## Art Domain

- **Illustration** — the art medium; digital raster images, up to 4000px source dimensions.
- **Piece** — a single finished illustration.
- **Project** — a body of work with a title, description, client, date, tags, and one or more images. May relate to professional or personal work.
- **NDA work** — a project whose content is gated behind a shared password. Only linked directly, never surfaced in public curation views.

## Content Collections

- **Projects collection** — the canonical record of every project. Contains all metadata (title, description, client, date, tags, ndaLocked flag, heroImage, image gallery). Lives at `src/content/projects/`.
- **Homepage collection** — a curation list that determines which pieces appear on the dramatic homepage showcase and how. May reference projects or stand alone. Lives at `src/content/homepage/`.
- **Portfolio collection** — a curation list that determines which projects appear on the recruiter-facing `/portfolio` grid and in what order. May reference projects or stand alone. Lives at `src/content/portfolio/`.
- **Personal collection** — metadata for pieces shown on the `/personal` gallery. Each entry is a single piece (title, description, date, image). Lives at `src/content/personal/`.

## Pages & Routes

- **Homepage** (`/`) — dramatic showcase of featured pieces. Layout TBD via prototyping (full-bleed carousel vs canvas-style). Subtle entrance animations in scope.
- **Portfolio** (`/portfolio`) — recruiter-facing grid of project cards (2–3 columns). Source of truth is the Portfolio collection. No tag filtering; order defined by the curation file.
- **Project detail** (`/projects/[slug]`) — full detail page for a project. Contains image gallery with lightbox. NDA projects gate access behind a password overlay (to be upgraded to edge check later).
- **Personal gallery** (`/personal`) — flat masonry gallery of personal pieces. Source of truth is the Personal collection.
- **Login** (`/login`) — password form page. Redirect target for unauthenticated visitors to NDA pages. Inline error message on wrong password.
- **About** (`/about`) — bio text, skills/tools list, optional self-portrait. Hardcoded content.
- **Resume** (`/resume`) — inline resume page with a "Download PDF" link to a pre-built PDF at `public/Brandon-Resume.pdf`.
- **404** — minimal branded error page.

## Authentication

- **Shared password** — a single password that gates all NDA-protected pages. Hash stored at build time.
- **Password cookie** — a browser cookie set on successful authentication. Expires after 7 days.
- **Client-side gate** — the initial implementation: NDA pages load with a password overlay that hides content. Intended to be upgraded to a Cloudflare Pages Function edge-gate later. At that point, the edge function checks the cookie before serving NDA pages.

## UX Patterns

- **Headroom navbar** — disappears on scroll down, reappears on any scroll up. Sticky behavior.
- **Scroll-to-top** — translucent up-arrow button that appears after scrolling past a threshold. Clicks smoothly scroll to top.
- **Lightbox** — full-screen image viewer on project detail pages. Click an image to open, close with Esc or click-outside.
- **Blur-up placeholder** — at build time, a tiny blurred version of each image is inlined as base64. Full image crossfades on top once loaded. (To be tested in prototyping before commitment.)

## Design System

- **Tailwind** via `@astrojs/tailwind` integration.
- **No dark mode** — light theme only.
- **Typography** — system font stack. Self-hosted display font for headings considered as future option.
- **No footer**.
- **Mobile** — polished responsive layout, desktop-primary orientation.

## Integrations

- **Microsoft Clarity** — scroll and mouse heatmap analytics. Injected in base `<Layout>` via `<script>`, active on all pages.
- **Social links** — Instagram, LinkedIn, Twitter/X. Displayed as icon links in the navbar.
- **Contact** — `mailto:` link alongside social icons. No contact form (deferred).

## Deployment

- **Cloudflare Pages** — static build via `npm run build`. Push to `main` triggers production deploy. Branch pushes generate preview deployments.
- **Repo** — GitHub, connected to Cloudflare Pages.

## Performance

- **Lighthouse** — target 95+ performance score.
- **LCP** — target < 1.5s Largest Contentful Paint.
- **Image strategy** — responsive `srcset` via Astro `<Image />`, WebP output, `fetchpriority="high"` on above-fold, `loading="lazy"` below-fold.
- **Build output** — fully static HTML + assets. No runtime JS except for interactive islands (navbar scroll behavior, lightbox, password gate, masonry layout, minor animations).

## Accessibility

- Semantic HTML, alt text on all images, focus rings, keyboard-navigable interactive elements.
