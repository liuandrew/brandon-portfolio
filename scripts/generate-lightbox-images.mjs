#!/usr/bin/env node

import { readFileSync, readdirSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname, basename } from 'path';
import sharp from 'sharp';

function escapeXml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function addFooter(inputPath, outputPath, title) {
  const image = sharp(inputPath);
  const { width, height } = await image.metadata();

  const footerHeight = Math.max(36, Math.round(width * 0.04));
  const fontSize = Math.max(11, Math.round(width * 0.016));

  const text = `Brandon Liu | brandonliuart@gmail.com | ${title}`;
  const escaped = escapeXml(text);

  const footerSvg = Buffer.from(
    `<svg width="${width}" height="${footerHeight}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="rgba(0,0,0,0.85)"/>
      <text x="${Math.round(width * 0.025)}" y="50%" text-anchor="start" dominant-baseline="central"
            font-family="system-ui, -apple-system, sans-serif"
            font-size="${fontSize}" fill="white" font-weight="500">
        ${escaped}
      </text>
    </svg>`
  );

  await image
    .extend({ bottom: footerHeight, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .composite([{ input: footerSvg, top: height, left: 0 }])
    .webp({ quality: 90 })
    .toFile(outputPath);

  console.log(`  ✓ ${basename(outputPath)}`);
}

function parseFrontmatter(filePath) {
  const content = readFileSync(filePath, 'utf-8').replace(/\r\n/g, '\n');
  const fm = content.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '';
  const nonCommentFm = fm.replace(/^#.*$/gm, '');

  const title = nonCommentFm.match(/^title:\s*"([^"]+)"/m)?.[1] ?? "Background Painting · Illustration · Visual Development · Prop Design";
  const footer = nonCommentFm.match(/^footer:\s*"([^"]+)"/m)?.[1] ?? null;
  const heroImage = nonCommentFm.match(/^heroImage:\s*"([^"]+)"/m)?.[1] ?? null;

  const images = [];
  const imagesSection = nonCommentFm.match(/^images:\s*\n((?:\s*-\s*[^\n]+\n?(?:\s+[^\-\s][^\n]*\n?)*)+)/m);
  if (imagesSection) {
    const lines = imagesSection[1].split('\n').filter(l => l.trim());
    for (let i = 0; i < lines.length; i++) {
      const srcMatch = lines[i].match(/^\s*-\s+src:\s*"([^"]+)"/);
      if (srcMatch) {
        let description = null;
        const nextLine = lines[i + 1];
        if (nextLine) {
          const descMatch = nextLine.match(/^\s+description:\s*"([^"]*)"/);
          if (descMatch) {
            description = descMatch[1];
            i++;
          }
        }
        images.push({ path: srcMatch[1], description });
        continue;
      }
      const stringMatch = lines[i].match(/^\s*-\s+"([^"]+)"/);
      if (stringMatch) {
        images.push({ path: stringMatch[1], description: null });
      }
    }
  }

  return { title, footer, heroImage, images };
}

function parsePersonalFrontmatter(filePath) {
  const content = readFileSync(filePath, 'utf-8').replace(/\r\n/g, '\n');
  const fm = content.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '';
  const title = fm.match(/^title:\s*"([^"]+)"/m)?.[1] ?? basename(filePath, '.md');

  const images = [];
  const imagesSection = fm.match(/^images:\s*\n((?:\s*-\s*[^\n]+\n?(?:\s+[^\-\s][^\n]*\n?)*)+)/m);
  if (imagesSection) {
    const lines = imagesSection[1].split('\n').filter(l => l.trim());
    for (let i = 0; i < lines.length; i++) {
      const srcMatch = lines[i].match(/^\s*-\s+src:\s*"?([^"\n]+)"?/);
      if (srcMatch) {
        let description = null;
        const nextLine = lines[i + 1];
        if (nextLine) {
          const descMatch = nextLine.match(/^\s+description:\s*"([^"]*)"/);
          if (descMatch) {
            description = descMatch[1];
            i++;
          }
        }
        images.push({ path: srcMatch[1], description });
        continue;
      }
      const stringMatch = lines[i].match(/^\s*-\s+"?([^"\n]+)"?$/);
      if (stringMatch) {
        images.push({ path: stringMatch[1], description: null });
      }
    }
  }

  return { title, images };
}

async function processProjects() {
  const files = readdirSync('src/content/projects').filter(f => f.endsWith('.md')).map(f => resolve('src/content/projects', f));

  for (const file of files) {
    const { title, footer, heroImage, images } = parseFrontmatter(file);
    const slug = basename(file, '.md');
    const projectDir = dirname(resolve(file));
    const outputDir = resolve(`public/lightbox/${slug}`);

    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    console.log(`\nProject: ${title}`);

    if (heroImage) {
      const inputPath = resolve(projectDir, heroImage);
      if (existsSync(inputPath)) {
        await addFooter(inputPath, resolve(outputDir, 'hero.webp'), footer ?? title);
      } else {
        console.log(`  ⚠ hero image not found: ${inputPath}`);
      }
    }

    for (const { path: imgPath } of images) {
      const inputPath = resolve(projectDir, imgPath);
      if (existsSync(inputPath)) {
        const outName = basename(imgPath).replace(/\.[^.]+$/, '.webp');
        await addFooter(inputPath, resolve(outputDir, outName), footer ?? title);
      } else {
        console.log(`  ⚠ gallery image not found: ${inputPath}`);
      }
    }
  }
}

async function processPersonal() {
  const files = readdirSync('src/content/personal').filter(f => f.endsWith('.md')).map(f => resolve('src/content/personal', f));

  for (const file of files) {
    const { title, images } = parsePersonalFrontmatter(file);

    if (images.length === 0) continue;

    const slug = basename(file, '.md');
    const pieceDir = dirname(resolve(file));
    const outputDir = resolve('public/lightbox/personal');

    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    console.log(`\nPersonal: ${title}`);

    for (const { path: imgPath } of images) {
      const inputPath = resolve(pieceDir, imgPath);
      if (existsSync(inputPath)) {
        const outName = basename(imgPath).replace(/\.[^.]+$/, '.webp');
        await addFooter(inputPath, resolve(outputDir, outName), 'Background Painting · Illustration · Visual Development · Prop Design');
      } else {
        console.log(`  ⚠ image not found: ${inputPath}`);
      }
    }
  }
}

async function main() {
  console.log('=== Generating lightbox images ===\n');

  await processProjects();
  await processPersonal();

  console.log('\n=== Done ===');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
