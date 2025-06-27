-- CreateTable
CREATE TABLE "ReceiptFile" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "file_name" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "invalid_reason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Receipt" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "purchased_at" DATETIME,
    "merchant_name" TEXT,
    "total_amount" TEXT,
    "file_path" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "receiptFileId" INTEGER NOT NULL,
    CONSTRAINT "Receipt_receiptFileId_fkey" FOREIGN KEY ("receiptFileId") REFERENCES "ReceiptFile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Receipt_receiptFileId_key" ON "Receipt"("receiptFileId");
