-- CreateTable
CREATE TABLE "CompanySettings" (
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
    "updatedAt" DATETIME NOT NULL
);
