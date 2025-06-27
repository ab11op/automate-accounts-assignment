import multer from 'multer'
import fs from 'fs'
import path from 'path'
const uploadDir = path.resolve('./uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null,uploadDir)
  },
  filename: function (req, file, cb) {
    cb(null,file.originalname)
  }
})


export default storage

