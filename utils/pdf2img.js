// import { promises as fs } from "node:fs";
import { pdf } from "pdf-to-img";
import fs from 'fs'
let imagesDir = './images'
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}
const pdf2img = async (path,name) => {
    try{
         const document = await pdf(path,{scale: 2});
         fs.writeFile(`${imagesDir}/${name}.png`, document);
        return true
    }
    catch(error){
        console.log('error in writing file to the image director')
        return fasle
    }
    
}

export default pdf2img