/*
  Warnings:

  - You are about to drop the column `merchant_name` on the `Receipt` table. All the data in the column will be lost.
  - You are about to drop the column `purchased_at` on the `Receipt` table. All the data in the column will be lost.
  - You are about to drop the column `total_amount` on the `Receipt` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Receipt" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "Data" JSONB,
    "file_path" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "receiptFileId" INTEGER NOT NULL,
    CONSTRAINT "Receipt_receiptFileId_fkey" FOREIGN KEY ("receiptFileId") REFERENCES "ReceiptFile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Receipt" ("createdAt", "file_path", "id", "receiptFileId", "updatedAt") SELECT "createdAt", "file_path", "id", "receiptFileId", "updatedAt" FROM "Receipt";
DROP TABLE "Receipt";
ALTER TABLE "new_Receipt" RENAME TO "Receipt";
CREATE UNIQUE INDEX "Receipt_receiptFileId_key" ON "Receipt"("receiptFileId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
