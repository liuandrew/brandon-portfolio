import { pdf } from "pdf-to-img";
import sharp from "sharp";
import { resolve } from "path";

const pdfPath = resolve("src/assets/BrandonResume_v1.pdf");
const outputPath = resolve("public/Resume.png");

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

  await sharp(images[0]).png().toFile(outputPath);
  console.log(`Saved page 1 of ${pageCount} to public/Resume.png`);
} catch (error) {
  console.error("Error:", error.message);
  process.exit(1);
}
