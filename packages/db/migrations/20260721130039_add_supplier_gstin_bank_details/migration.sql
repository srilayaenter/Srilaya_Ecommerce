-- AlterTable
ALTER TABLE "Supplier" ADD COLUMN     "bankAccount" TEXT,
ADD COLUMN     "bankIfsc" TEXT,
ADD COLUMN     "bankName" TEXT,
ADD COLUMN     "gstin" TEXT,
ADD COLUMN     "leadTimeDays" INTEGER,
ADD COLUMN     "paymentTerms" TEXT,
ADD COLUMN     "rating" INTEGER;
