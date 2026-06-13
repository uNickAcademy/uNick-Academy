-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Referral" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "referrerId" TEXT NOT NULL,
    "referredId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "flagged" BOOLEAN NOT NULL DEFAULT false,
    "flagReason" TEXT,
    "adminNote" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "qualifiedAt" DATETIME,
    "rewardedAt" DATETIME,
    "cancelledAt" DATETIME,
    "qualifyingPurchaseId" TEXT,
    CONSTRAINT "Referral_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Referral_referredId_fkey" FOREIGN KEY ("referredId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Referral_qualifyingPurchaseId_fkey" FOREIGN KEY ("qualifyingPurchaseId") REFERENCES "Purchase" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Referral" ("adminNote", "cancelledAt", "code", "createdAt", "flagReason", "flagged", "id", "qualifiedAt", "referredId", "referrerId", "rewardedAt", "status", "updatedAt") SELECT "adminNote", "cancelledAt", "code", "createdAt", "flagReason", "flagged", "id", "qualifiedAt", "referredId", "referrerId", "rewardedAt", "status", "updatedAt" FROM "Referral";
DROP TABLE "Referral";
ALTER TABLE "new_Referral" RENAME TO "Referral";
CREATE UNIQUE INDEX "Referral_referredId_key" ON "Referral"("referredId");
CREATE UNIQUE INDEX "Referral_qualifyingPurchaseId_key" ON "Referral"("qualifyingPurchaseId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
