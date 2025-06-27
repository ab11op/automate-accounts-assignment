import fs from "fs";
const checkFile = function (path) {
  try {
     const fd = fs.openSync(path, 'r');
    const buffer = Buffer.alloc(5); // allocate 5 bytes
    fs.readSync(fd, buffer, 0, 5, 0);
    fs.closeSync(fd);
    return buffer.toString() === '%PDF-'; // check for pdf file
  } catch (error) {
    console.log('error in checking file type',error.message || error)
    return false
  }
};

export default checkFile;
