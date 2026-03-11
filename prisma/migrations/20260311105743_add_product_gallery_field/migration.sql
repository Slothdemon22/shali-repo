-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "gallery" TEXT[] DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "image" DROP DEFAULT;
