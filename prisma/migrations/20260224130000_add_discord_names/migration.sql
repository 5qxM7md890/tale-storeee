-- Add Discord display name fields
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "discordUsername" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "discordGlobalName" TEXT;
