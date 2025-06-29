// import { promises as fs } from "node:fs";
import { pdf } from "pdf-to-img";
import { promises as fsPromise } from "fs"; 
import fs from 'fs'
let imagesDir = './images'
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}
const pdf2img = async (pdfPath, name) => {
  try {
    const document = await pdf(pdfPath, { scale: 2 });
    const firstImage = await document.getPage(1); // get the first page as image buffer
    fsPromise.writeFile(`${imagesDir}/${name}.png`, document);
    return true;
  } catch (error) {
    console.error("Error in writing file to the image directory:", error);
    return false; 
  }
};

export default pdf2img