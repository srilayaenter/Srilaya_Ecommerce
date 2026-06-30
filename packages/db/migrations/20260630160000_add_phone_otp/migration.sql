-- Make email optional and add phone to User
ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL;
ALTER TABLE "User" ADD COLUMN "phone" TEXT;
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- PhoneOtp table for SMS OTP login
CREATE TABLE "PhoneOtp" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "otp" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PhoneOtp_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PhoneOtp_phone_idx" ON "PhoneOtp"("phone");
