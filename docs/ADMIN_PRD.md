# PRD: Local Admin Content Editor

## Problem Statement

Brandon is a digital illustrator who maintains his portfolio website by hand-editing Markdown YAML frontmatter files and manually placing images in asset subdirectories, then committing and pushing via git. He wants to avoid using git and the terminal entirely, and needs a simple visual interface to manage his content — uploading images, assigning them to pages, reordering curation lists, and creating new Project records — without touching `.md` files or running git commands.

The site is fully static, hosted on Cloudflare Pages, with updates triggered by pushes to the GitHub `main` branch. The admin tool is local-only, intended for Brandon's Windows machine.

## Solution

A local admin web UI that piggybacks on Astro's dev server. Brandon runs a single command (`npm run admin`) which starts a development server, auto-opens his browser to the admin interface, and provides tabbed editors for each content collection. He can upload images to a media library, assign them to pages, reorder curation lists with drag-and-drop, and create or edit Projects. Clicking "Publish" commits and pushes all changes to GitHub via a fine-grained API token — no git CLI involvement. Cloudflare Pages then builds and deploys automatically.

## User Stories

1. As Brandon, I want to double-click a shortcut on my Windows desktop to launch the admin, so that I don't need to open a terminal or remember commands.
2. As Brandon, I want the admin to auto-open in my browser, so that I'm immediately in the editing interface.
3. As Brandon, I want to upload illustration images to a media library, so that I can store them before deciding where they'll appear.
4. As Brandon, I want uploaded images to be automatically organized into the correct `src/assets/` subdirectory based on which project or collection they belong to, so that I don't need to know the folder structure.
5. As Brandon, I want to browse and delete images in my media library, so that I can manage unused or outdated assets.
6. As Brandon, I want a "Publish" button that commits and pushes all my changes to GitHub in one click, so that I never touch git or the terminal.
7. As Brandon, I want to receive clear success or error feedback after publishing, so that I know whether my changes went live.
8. As Brandon, I want to manage the Homepage carousel — adding, removing, and reordering images — through a drag-and-drop grid, so that I can control which Pieces appear at `/`.
9. As Brandon, I want to manage the Personal gallery — adding, removing, and reordering images with optional titles and descriptions — through a drag-and-drop grid, so that I can curate my `/personal` page.
10. As Brandon, I want to manage the Portfolio grid — toggling which Projects appear and dragging to reorder them, with optional per-project image overrides — so that I can curate the recruiter-facing `/portfolio` page.
11. As Brandon, I want to create a new Project with title, description, client, date, tags, a heroImage, and gallery images, so that I can add new professional work to my portfolio.
12. As Brandon, I want to edit an existing Project's metadata and images, so that I can update client information or swap out artwork.
13. As Brandon, I want to set whether a Project is NDA-locked or portfolio-locked via checkboxes, so that I can control visibility without editing YAML.
14. As Brandon, I want to assign a logo image to a Project, so that it displays on the Portfolio grid card.
15. As Brandon, I want to choose between "Standard" and "Masonry" layout for a Project's gallery, so that certain Projects (like Studies) display with their intended layout.
16. As Brandon, I want to add optional tags to a Project, so that I can categorize my work for future use.
17. As Brandon, I want the admin to validate my inputs before publishing (e.g., required fields, image references), so that I don't push broken content.
18. As Brandon, I want to manage the navigation dropdown sections (Professional, Personal) and assign Projects to them, so that new Projects appear in the site navigation.
19. As Brandon, I want to reorder Projects within the navigation dropdown sections, so that I can control the order shown to visitors.
20. As Brandon, I want the admin to prevent me from publishing if a required field is empty or an image path is invalid, so that the site doesn't break.
21. As Brandon, I want the admin interface to be simple and visual — showing image thumbnails, drag handles, and clear labels — so that I can manage my portfolio without reading documentation.
22. As Brandon, I want the admin page to load fast and respond instantly to my actions, so that editing feels smooth and productive.
23. As Brandon, I want to revert changes I haven't published yet (reset to the last published state), so that I can experiment without fear.

## Implementation Decisions

### Architecture

- **Local admin server**: The admin UI and API are served by Astro's development server. A new script (`scripts/admin-server.mjs`) adds an admin route and API endpoints. `npm run admin` starts the dev server, which also serves the portfolio site for live preview.
- **No third-party CMS services**: No Tina CMS, Decap CMS, Netlify, or CloudCannon. Everything runs locally in the existing Astro project.
- **No git CLI dependency**: All git operations (read, commit, push) use the GitHub REST API (Contents endpoint). A fine-grained PAT with `Contents: Read & Write` scope on the single repo is stored in `.env` (gitignored) and provided by the developer at initial setup.

### Admin Page Structure

- **Tabbed interface**: Five tabs — Homepage, Portfolio, Personal, Projects, Library.
- **Homepage tab**: Drag-and-drop reorderable image grid. Adding an image opens the Library picker. Deleting removes from the list. Changes affect `src/content/homepage/homepage.md`.
- **Personal tab**: Drag-and-drop reorderable image grid with optional per-image title and description fields. Adding an image opens the Library picker. Changes affect `src/content/personal/personal.md`.
- **Portfolio tab**: Drag-to-reorder list of all Projects with toggles to include/exclude, plus optional per-project image overrides (picked from Library). Changes affect `src/content/portfolio/portfolio.md`.
- **Projects tab**: A list of existing Projects with "Edit" and "New Project" actions. The edit form exposes all Project fields: title, description, client, date (defaults to today), tags (tag input), ndaLocked (checkbox), portfolioLocked (checkbox), portfolioTitle (optional, shown when different from title), logo (image picker), heroImage (required, image picker), gallery images (multi-select from Library), layout (dropdown, Standard/Masonry), footer text (optional). Changes affect individual `src/content/projects/*.md` files.
- **Library tab**: Grid of all images, organized by subdirectory (matching the existing folder structure). "Upload" button adds new images to the appropriate folder (`src/assets/general/` by default, `src/assets/{project-slug}/` when uploading within a Project context). Delete removes images from disk.

### Image File Management

- **Auto-organized folders**: Images uploaded in the context of a specific Project go to `src/assets/{project-slug}/`. Images uploaded in the Library tab or for Homepage/Personal go to `src/assets/general/`. Existing folder conventions are preserved.
- **Image references in `.md` files**: The admin autogenerates the correct relative path from the `.md` file's location to the asset. Brandon never sees or edits paths.

### Data Flow on Publish

1. Brandon edits content through the admin UI (images saved to disk immediately on upload, `.md` files written on "Save" within a session).
2. Brandon clicks "Publish".
3. Admin collects all changed files (new/modified images + modified `.md` files).
4. Admin calls GitHub Contents API: get latest `main` branch SHA, create blobs for each changed file, create a tree, create a commit, update the `main` ref.
5. Success/error message displayed. On success, Cloudflare Pages auto-deploys.

### Content Validation

- **Schema validation**: Before writing any `.md` file, the admin validates the generated frontmatter against the Astro content collection zod schemas (reusing `src/content.config.ts` schemas). Malformed content is rejected with a clear error before it reaches disk.
- **Image existence check**: The admin verifies referenced image files exist on disk before accepting a publish.

### GitHub Token Setup

- **Token creation**: The developer creates a fine-grained PAT on GitHub, scoped to the single repo, with `Contents: Read & Write` permission only.
- **Token storage**: The PAT is placed in the project `.env` file, which is already `.gitignore`d. The admin reads it at startup.
- **Brandon never sees the token**: Pre-seeded by the developer before handing off the machine or repo.

### Windows Setup Experience

- **One-time setup**: A PowerShell script (`setup.ps1`) that downloads the repo ZIP (using the PAT), extracts it, runs `npm install`, and creates a desktop shortcut.
- **Desktop shortcut**: Double-clicking the shortcut runs `npm run admin`, which starts the server and auto-opens the browser to `http://localhost:4321/admin`.
- **Prerequisites**: Node.js (one-time manual install by Brandon or the developer).

## Testing Decisions

### Seams

- **Highest seam — `npm run build` succeeds after admin publish**: The admin writes `.md` and image files compatible with the existing Astro build. Running the full build after a publish is the integration test for correctness. If build fails, Cloudflare Pages catches it before deployment (the deploy doesn't replace production).
- **Content collection zod schemas** (existing): The same schemas in `src/content.config.ts` that validate content at build time are reused for runtime validation in the admin. This is the primary unit-testable seam.
- **GitHub API calls**: The admin's publish function is testable by mocking the GitHub REST API responses (get ref, create blob, create tree, create commit, update ref).

### What makes a good test

- Test that admin-generated `.md` frontmatter passes `astro build` without errors.
- Test that invalid frontmatter (missing required fields, invalid field types) is rejected by the admin before write.
- Test the publish pipeline against a mock GitHub API.
- Do not test UI layout or drag-and-drop behavior — those are verified visually.

### Prior art

- The existing `content.config.ts` zod schemas are the canonical validation source.
- The existing `scripts/generate-lightbox-images.mjs` parses `.md` frontmatter at build time — the admin's `.md` writer should produce output compatible with this script's parser.

## Out of Scope

- Password hash management (manual, infrequent)
- Resume PDF updates (manual, infrequent)
- Social link management (manual, infrequent)
- Site-wide configuration changes (manual, infrequent)
- Live preview of changes before publish (the dev server shows the portfolio, but no side-by-side diff)
- Multi-user or collaborative editing
- Any third-party CMS service or hosted admin
- Image editing, cropping, or resizing within the admin (images are uploaded as-is)
- Lightbox image generation (handled by the existing Cloudflare Pages `prebuild` step)
- Mobile-responsive admin UI (desktop-only)
- Undo/redo history beyond "revert to last published"
