# PRD: Brandon's Portfolio — Full Build

## Problem Statement

Brandon is a digital illustrator who needs a performant portfolio website to showcase his work to recruiters and clients. The site must load instantly, present images beautifully, gate NDA-protected work behind a password, and track visitor engagement via Microsoft Clarity heatmaps. No such site exists today — the repo is a blank Astro 6 scaffold.

## Solution

A fully static site built with Astro and Tailwind, deployed to Cloudflare Pages. Content is authored in Markdown frontmatter across four content collections (Projects, Homepage, Portfolio, Personal). Images are co-located in the repo, processed at build time into responsive WebP variants with blur-up placeholders. NDA-gated project detail pages are protected by a shared-password client-side overlay, with a planned upgrade path to Cloudflare Pages Functions edge enforcement. Performance targets: Lighthouse 95+, LCP < 1.5s.

## User Stories

1. As a recruiter, I want to browse a grid of Brandon's professional projects on `/portfolio`, so that I can quickly assess his industry experience.
2. As a recruiter, I want to click a project card and see a detailed page with a full image gallery and lightbox, so that I can inspect work quality up close.
3. As a recruiter, I want to navigate to Brandon's About page to learn his background and skills, so that I can evaluate his fit.
4. As a recruiter, I want to view Brandon's resume inline and download a PDF version, so that I can review his credentials and attach them to internal systems.
5. As a recruiter, I want to find social media links (Instagram, LinkedIn, Twitter/X) in the navbar, so that I can verify his online presence.
6. As a returning visitor, I want the navbar to disappear when I scroll down and reappear when I scroll up, so that content gets maximum screen real estate while reading.
7. As a visitor who has scrolled far down a page, I want a translucent up-arrow button to appear, so that I can quickly return to the top.
8. As a visitor on mobile, I want the entire site to be polished and usable, so that I can browse on any device.
9. As a visitor viewing a project detail page, I want to click an image to open a full-screen lightbox and close it with Esc or clicking outside, so that I can examine details.
10. As a visitor to the homepage, I want a dramatic showcase of featured pieces with subtle entrance animations, so that the experience feels premium.
11. As a visitor to `/personal`, I want a masonry gallery of Brandon's personal illustrations, so that I can explore his creative range.
12. As a visitor with a password, I want to enter it on NDA-protected project pages to reveal the content, so that I can view sensitive client work.
13. As a visitor entering a wrong password, I want to see an inline error message without leaving the page, so that I can correct my mistake immediately.
14. As an authenticated visitor, I want my password session to persist for 7 days via a cookie, so that I don't need to re-enter it during a recruitment cycle.
15. As a visitor who hits a non-existent URL, I want to see a minimal branded 404 page with a way back home, so that I'm not stranded.
16. As Brandon, I want to author project metadata in simple Markdown frontmatter files, so that adding new work requires no code changes.
17. As Brandon, I want the homepage and `/portfolio` grid driven by separate curation files, so that I can reorder and select featured pieces independently from the project catalog.
18. As Brandon, I want curation files to support both project references (with optional image overrides) and standalone images, so that I'm not constrained by project boundaries on promotional pages.
19. As Brandon, I want NDA-protected projects omitted from public curation views, so that sensitive work is only discoverable via direct link.
20. As Brandon, I want Microsoft Clarity scroll and mouse heatmap analytics on every page, so that I can understand how recruiters engage with my portfolio.
21. As a visitor, I want the site to load near-instantly even on slow connections, so that I don't bounce before seeing the work.
22. As a search engine or social platform, I want Open Graph meta tags on every page, so that sharing links generates a preview card.
23. As a keyboard-only user, I want focus rings and logical tab order, so that I can navigate the entire site without a mouse.
24. As a screen-reader user, I want descriptive alt text on every image, so that I can understand the content.

## Implementation Decisions

### Architecture

- **Framework**: Astro 6, fully static output (`output: 'static'`).
- **Styling**: Tailwind CSS via `@astrojs/tailwind` integration.
- **Typography**: System font stack. Self-hosted display font for headings as a deferred option.
- **No dark mode**: Light theme only.
- **No footer**: Content ends at the last element.

### Content Collections

Four collections, each with zod-validated schemas at build time:

- **Projects** (`src/content/projects/`): title, description, client, date, tags, ndaLocked (boolean), heroImage, images (gallery array). This is the canonical project catalog.
- **Homepage** (`src/content/homepage/`): curation list. Each entry either references a project (with optional image override) or is a standalone piece. Determines what appears on `/` and in what order.
- **Portfolio** (`src/content/portfolio/`): curation list. Same dual-mode (project reference or standalone). Determines the recruiter grid at `/portfolio`.
- **Personal** (`src/content/personal/`): title, description, date, image. One entry per personal illustration.

### Routes

| Route | Page | Source |
|-------|------|--------|
| `/` | Dramatic hero showcase | Homepage collection + `index.astro` |
| `/portfolio` | 2–3 column project card grid | Portfolio collection |
| `/projects/[slug]` | Project detail with lightbox gallery | Projects collection |
| `/personal` | Masonry gallery | Personal collection |
| `/about` | Bio, skills, self-portrait | Hardcoded in page |
| `/resume` | Inline resume + PDF download link | Hardcoded in page, PDF at `public/Brandon-Resume.pdf` |
| `/login` | Password form with inline error | Standalone page |
| `/*` | 404 | Minimal branded error page |

### Image Processing

- **Source**: High-res originals (up to 4000px, ~1MB each) committed to `src/assets/` or co-located with collections.
- **Build output**: Astro `<Image />` generates responsive WebP variants at multiple widths, a blur-up base64 placeholder, and a proper `srcset`.
- **Above-fold**: `fetchpriority="high"`, no lazy loading.
- **Below-fold**: `loading="lazy"`.
- **Blur-up placeholder**: Tiny blurred base64 inlined in HTML, full image crossfades on top via CSS opacity transition. To be evaluated in prototyping before final commitment.

### Password Gate

- **Phase 1 (current)**: Client-side overlay on NDA project detail pages. JS checks cookie; if absent, renders password form overlay over hidden page content. Correct password sets a 7-day cookie and instantly reveals the page. Wrong password shows inline error.
- **Password hash**: Stored at build time (hardcoded hash, not plaintext).
- **Phase 2 (future)**: Cloudflare Pages Function middleware checks cookie at the edge before serving NDA page HTML. Unauthenticated requests get a 302 to `/login`.
- **`/login` page**: Standalone password form. Present in both phases.
- **NDA projects**: Never appear in Homepage or Portfolio curation views. Only reachable by direct link.

### Navigation & UX

- **Headroom navbar**: CSS + JS island. Disappears on scroll down, reappears on any scroll up. Contains: Home, Portfolio, Personal, About, Resume links + social icons (Instagram, LinkedIn, Twitter/X) + `mailto:` link.
- **Scroll-to-top button**: Translucent up-arrow. Appears after scroll threshold, smoothly scrolls to top on click.
- **Single scroll listener island**: One shared JS handler drives both navbar and scroll-to-top behaviors.

### Integrations

- **Microsoft Clarity**: `<script>` tag in base `Layout.astro` `<head>`, active on all pages.
- **Social links**: Instagram, LinkedIn, Twitter/X — icon links in navbar. Plus `mailto:` contact link. No contact form.

### Performance Targets

- Lighthouse performance score ≥ 95
- Largest Contentful Paint < 1.5s
- Build output: fully static HTML + assets

### Accessibility

- Semantic HTML throughout
- Alt text on all images (provided via content collection frontmatter)
- Focus rings and keyboard-navigable interactive elements (lightbox, password form, scroll-to-top)

### Open Design Decisions (to be resolved by prototyping)

- Homepage layout: full-bleed carousel vs canvas-style vs other
- Blur-up placeholder: commit or remove based on visual quality of blur→sharp transition
- `/personal` gallery: masonry (requires JS) vs uniform grid (CSS-only)
- Homepage entrance animations: specific style and scope
- `/portfolio` grid: exact column count and whether multiple images per project card appear

## Testing Decisions

- **Primary seam**: Astro content collection zod schemas. Build fails if any `.md` frontmatter is malformed or references a missing image. This catches the overwhelming majority of bugs.
- **Secondary seam**: Lighthouse CI for performance regression. Assert 95+ score and < 1.5s LCP on every build.
- **Manual visual checklist**: Layout decisions deferred to prototyping are verified by eye, not automation.
- **No E2E tests**: The three JS islands (lightbox, password overlay, scroll behavior) are small and stable — authoring and maintaining Playwright tests exceeds the bug surface they protect.

## Out of Scope

- Dark mode
- Contact form (deferred; `mailto:` suffices)
- Tag-based filtering on `/portfolio`
- PWA / web manifest / "Add to Home Screen"
- Per-project Open Graph images (single site-wide card only)
- Animated page transitions or complex animation library
- Footer content
- Dynamic or server-rendered pages (everything is static)
- Per-client or per-project passwords (single shared password only)
- Admin/dashboard for content management (content is edited in code)

## Further Notes

- The deploy trigger is push to `main` on GitHub, which triggers Cloudflare Pages `npm run build`. Branch pushes generate preview deployments.
- The resume PDF (`public/Brandon-Resume.pdf`) is a pre-built export from a design tool, committed to the repo. It is independent of the inline `/resume` page.
- The favicon needs a logo design — can be Brandon's initials or mark. SVG + ICO fallback.
- The password gate upgrade to Cloudflare Pages Functions (Phase 2) is documented in `docs/adr/0001-client-side-password-gate-then-edge.md`.
