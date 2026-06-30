-- Add photo URL to product reviews
ALTER TABLE "ProductReview" ADD COLUMN "photoUrl" TEXT;

-- Add referral code to loyalty accounts
ALTER TABLE "LoyaltyAccount" ADD COLUMN "referralCode" TEXT;
CREATE UNIQUE INDEX "LoyaltyAccount_referralCode_key" ON "LoyaltyAccount"("referralCode");

-- Add referral code tracking to orders
ALTER TABLE "Order" ADD COLUMN "referralCode" TEXT;
