-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "color" TEXT,
ADD COLUMN     "fabric" TEXT,
ADD COLUMN     "sizes" TEXT[] DEFAULT ARRAY['XS', 'S', 'M', 'L', 'XL']::TEXT[],
ADD COLUMN     "sku" TEXT;
