-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ReceiptFile" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "file_name" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "invalid_reason" TEXT,
    "is_valid" BOOLEAN NOT NULL DEFAULT false,
    "is_processed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_ReceiptFile" ("createdAt", "file_name", "file_path", "id", "invalid_reason", "mime_type", "updatedAt") SELECT "createdAt", "file_name", "file_path", "id", "invalid_reason", "mime_type", "updatedAt" FROM "ReceiptFile";
DROP TABLE "ReceiptFile";
ALTER TABLE "new_ReceiptFile" RENAME TO "ReceiptFile";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
