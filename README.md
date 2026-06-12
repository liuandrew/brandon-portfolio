# Brandon Portfolio

Digital illustrator portfolio site built with Astro.

## Prerequisites

- [Node.js](https://nodejs.org/) v22.12.0 or higher

### Installing Node.js on Windows

1. Download the **LTS** installer from [nodejs.org](https://nodejs.org/)
2. Run the installer, accept the license agreement, and click through the defaults
3. Verify installation by opening PowerShell and running:

```powershell
node -v
```

This should print `v22.x.x` or higher. `npm` is included automatically.

## Quick Setup (Windows)

1. Run `setup.ps1` from the repo root. It will:
   - Download the repo from GitHub
   - Install dependencies
   - Create a desktop shortcut for the admin

```powershell
.\setup.ps1
```

The script reads a `GITHUB_PAT` from `.env` in the repo root (see [Admin Token Setup](#admin-token-setup) below).

## Manual Setup

```sh
npm install
npm run dev
```

The site runs at `http://localhost:4321`.

## Commands

| Command           | Action                                       |
| :---------------- | :------------------------------------------- |
| `npm install`     | Install dependencies                         |
| `npm run dev`     | Start dev server at `localhost:4321`         |
| `npm run build`   | Build production site to `./dist/`           |
| `npm run preview` | Preview build locally                        |
| `npm run admin`   | Start admin server (dev server + admin UI)   |

## Admin Token Setup

The admin page uses the GitHub API to commit and push changes. No git CLI required.

1. Go to **GitHub > Settings > Developer settings > Personal access tokens > Fine-grained tokens**
2. Click **Generate new token**
   - **Token name**: `portfolio-admin`
   - **Repository access**: Only `brandon-portfolio`
   - **Repository permissions**: Set **Contents** to **Read and Write**
3. Generate and copy the token
4. Create a `.env` file in the project root:

```
GITHUB_PAT=ghp_your_token_here
```

The `.env` file is gitignored and will not be committed.
