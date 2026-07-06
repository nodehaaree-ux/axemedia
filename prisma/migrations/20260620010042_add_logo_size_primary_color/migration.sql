-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CompanySettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL DEFAULT 'AXEmedia',
    "tagline" TEXT NOT NULL DEFAULT 'Agjensi Marketingu & Dizajni',
    "address" TEXT NOT NULL DEFAULT 'Tiranë, Shqipëri',
    "phone" TEXT NOT NULL DEFAULT '+355 69 000 0000',
    "email" TEXT NOT NULL DEFAULT 'info@axemedia.al',
    "taxId" TEXT NOT NULL DEFAULT '',
    "website" TEXT NOT NULL DEFAULT 'www.axemedia.al',
    "logoUrl" TEXT NOT NULL DEFAULT '',
    "invoiceFooter" TEXT NOT NULL DEFAULT 'Faleminderit për bashkëpunimin!',
    "offerFooter" TEXT NOT NULL DEFAULT 'Kjo ofertë nuk është faturë. Pagesa nuk kërkohet deri pas konfirmimit.',
    "logoSize" INTEGER NOT NULL DEFAULT 22,
    "primaryColor" TEXT NOT NULL DEFAULT '#009ec6',
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_CompanySettings" ("address", "email", "id", "invoiceFooter", "logoUrl", "name", "offerFooter", "phone", "tagline", "taxId", "updatedAt", "website") SELECT "address", "email", "id", "invoiceFooter", "logoUrl", "name", "offerFooter", "phone", "tagline", "taxId", "updatedAt", "website" FROM "CompanySettings";
DROP TABLE "CompanySettings";
ALTER TABLE "new_CompanySettings" RENAME TO "CompanySettings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
