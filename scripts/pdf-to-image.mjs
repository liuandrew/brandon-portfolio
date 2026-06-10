import { pdf } from "pdf-to-img";
import sharp from "sharp";
import { copyFileSync } from "fs";
import { resolve } from "path";

const pdfPath = resolve("src/assets/BrandonResume.pdf");
const pngPath = resolve("public/Resume.png");
const pdfOutputPath = resolve("public/Brandon-Resume.pdf");

console.log("Converting PDF to image...");

try {
  const doc = await pdf(pdfPath, { scale: 3 });
  const pageCount = doc.length;

  const images = [];
  for await (const image of doc) {
    images.push(image);
  }
  doc.destroy();

  if (images.length === 0) {
    throw new Error("No pages found in PDF");
  }

  await sharp(images[0]).png().toFile(pngPath);
  console.log(`Saved page 1 of ${pageCount} to public/Resume.png`);

  copyFileSync(pdfPath, pdfOutputPath);
  console.log("Copied PDF to public/Brandon-Resume.pdf");
} catch (error) {
  console.error("Error:", error.message);
  process.exit(1);
}
