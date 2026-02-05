/*
  Warnings:

  - You are about to drop the column `name` on the `Audit` table. All the data in the column will be lost.
  - Added the required column `data` to the `Audit` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Audit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "data" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "startedAt" DATETIME,
    "completedAt" DATETIME
);
INSERT INTO "new_Audit" ("completedAt", "createdAt", "id", "startedAt", "status", "updatedAt") SELECT "completedAt", "createdAt", "id", "startedAt", "status", "updatedAt" FROM "Audit";
DROP TABLE "Audit";
ALTER TABLE "new_Audit" RENAME TO "Audit";
CREATE UNIQUE INDEX "Audit_id_key" ON "Audit"("id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
