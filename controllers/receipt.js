import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import * as pathModule from "path";
import { Router } from "express";
import { createWorker } from "tesseract.js";
import multer from "multer";
import path from "path";
import { promises as fs } from "fs";
import storage from "../middlewares/multer.js";
import checkFile from "../utils/checkFile.js";
import pdf2img from "../utils/pdf2img.js";
import extractInfo from "../utils/extractInfo.js";

const upload = multer({ storage: storage });
const router = Router();

router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const file = req?.file;
    if (!file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const { originalname, path: filePath, mimetype } = file;

    const relativePath = pathModule.relative(process.cwd(), filePath);
    const now = new Date();

    try {
      await prisma.receiptFile.create({
        data: {
          file_path: relativePath,
          mime_type: mimetype,
          file_name: originalname,
          createdAt: now,
          updatedAt: now,
        },
      });

      return res.status(200).json({
        success: true,
        message: "File uploaded successfully",
      });
    } catch (dbError) {
      // Remove the file on DB failure
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error(" Error unlinking file:", err.message);
        } else {
          console.log(" File deleted after DB failure");
        }
      });

      console.error(" DB insert error:", dbError.message);
      return res.status(500).json({
        success: false,
        message: "Error inserting receipt",
      });
    }
  } catch (error) {
    console.error(" Unexpected error:", error);
    return res.status(500).json({
      success: false,
      message: "Error uploading file",
    });
  }
});

router.post("/validate/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid receipt ID",
    });
  }

  try {
    const receiptFile = await prisma.receiptFile.findUnique({
      where: { id },
    });

    if (!receiptFile) {
      return res.status(404).json({
        success: false,
        message: "Receipt not found",
      });
    }
    const { is_validated } = receiptFile;
    if (is_validated) {
      return res.status(400).json({
        success: false,
        message: "Receipt is already validated",
      });
    }
    let invalid_reason = null;

    // Check file type
    if (receiptFile.mime_type !== "application/pdf") {
      invalid_reason = `File is of ${receiptFile.mime_type} type instead of application/pdf`;
    }

    // Check file integrity (custom)
    const fileCheckPassed = checkFile(receiptFile.file_path);
    if (!fileCheckPassed) {
      invalid_reason = `File failed custom check: ${receiptFile.mime_type}`;
    }

    if (invalid_reason) {
      await prisma.receiptFile.update({
        where: { id },
        data: {
          invalid_reason,
          updatedAt: new Date(),
          is_validated: true,
        },
      });
    } else {
      await prisma.receiptFile.update({
        where: { id },
        data: {
          is_valid: true,
          updatedAt: new Date(),
          is_validated: true,
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Receipt validation complete",
      invalid_reason: invalid_reason || "Valid PDF",
    });
  } catch (error) {
    console.error("Validation error:", error);
    return res.status(500).json({
      success: false,
      message: "Error validating receipt",
    });
  }
});

router.get("/receipts/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid receipt ID",
      });
    }

    const receipt = await prisma.receiptFile.findUnique({ where: { id } });

    if (!receipt) {
      return res.status(404).json({
        success: false,
        message: "Receipt not found",
      });
    }
    return res.status(200).json({
      message: "receipt fetched",
      success: true,
      data: receipt,
    });
  } catch (error) {
    console.error("error in fetching receipt:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching receipt",
    });
  }
});

router.get("/receipts", async (req, res) => {
  try {
    const { skip, limit } = req.query;

    const parsedSkip = parseInt(skip) || 0;
    const parsedLimit = parseInt(limit) || 5;
    const receipts = await prisma.receiptFile.findMany({
      skip: parsedSkip,
      take: parsedLimit,
    });

    if (!receipts) {
      return res.status(404).json({
        success: false,
        message: "Receipt not found",
      });
    }
    return res.status(200).json({
      message: "receipts fetched",
      success: true,
      data: receipts,
    });
  } catch (error) {
    console.error("error in fetching receipts:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching receipt",
    });
  }
});

router.post("/process/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid receipt ID",
    });
  }

  try {
    const receipt = await prisma.receiptFile.findUnique({ where: { id } });
    if (!receipt) {
      return res.status(404).json({
        success: false,
        message: "Receipt not found",
      });
    }

    const { file_path, file_name, is_processed, mime_type } = receipt;
    if (mime_type !== "application/pdf") {
      return res.status(400).json({
        success: false,
        message: "Receipt can't be processed due to invalid format ",
      });
    }
    if (is_processed) {
      return res.status(400).json({
        success: false,
        message: "Receipt is already processed",
      });
    }

    const imagePath = path.join("images", `${file_name}.png`);

    const converted = await pdf2img(file_path, file_name);
    if (!converted) {
      return res.status(500).json({
        success: false,
        message: "Error in file conversion",
      });
    }

    const worker = await createWorker(["eng"]);
    const {
      data: { text },
    } = await worker.recognize(imagePath);
    await worker.terminate();

    const info = extractInfo(text);
    delete info.rawText;

    try {
      await prisma.receipt.create({
        data: {
          data: info,
          file_path,
          receiptFileId: id,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      await prisma.receiptFile.update({
        where: { id },
        data: {
          is_processed: true,
          updatedAt: new Date(),
        },
      });

      return res.status(200).json({
        success: true,
        info,
      });
    } catch (dbError) {
      console.error("Database error:", dbError.message || dbError);
      // Cleanup: delete the generated image
      try {
        await fs.unlink(imagePath);
        console.log(`Image ${imagePath} deleted due to DB failure`);
      } catch (unlinkErr) {
        console.error(
          `Failed to delete image ${imagePath}:`,
          unlinkErr.message || unlinkErr
        );
      }

      return res.status(500).json({
        success: false,
        message: "Database operation failed",
      });
    }
  } catch (error) {
    console.error("Error in processing receipt:", error);
    return res.status(500).json({
      success: false,
      message: "Error processing receipt",
    });
  }
});

router.get("/processed", async (req, res) => {
  try {
    const { skip, limit } = req.query;

    const parsedSkip = parseInt(skip) || 0;
    const parsedLimit = parseInt(limit) || 5;
    const processed = await prisma.receipt.findMany({
      skip: parsedSkip,
      take: parsedLimit,
    });

    if (!processed) {
      return res.status(404).json({
        success: false,
        message: "Receipt not found",
      });
    }
    return res.status(200).json({
      message: "receipts fetched",
      success: true,
      data: processed,
    });
  } catch (error) {
    console.error("error in fetching processed receipts:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching processed receipt",
    });
  }
});

export default router;
