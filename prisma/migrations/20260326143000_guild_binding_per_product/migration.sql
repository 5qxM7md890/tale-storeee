-- Make GuildBinding uniqueness scoped to guild + product instead of guild globally.
ALTER TABLE "GuildBinding"
  ADD COLUMN IF NOT EXISTS "productId" TEXT;

UPDATE "GuildBinding" AS gb
SET "productId" = bi."productId"
FROM "BotInstance" AS bi
WHERE gb."botInstanceId" = bi."id"
  AND gb."productId" IS NULL;

ALTER TABLE "GuildBinding"
  ALTER COLUMN "productId" SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'GuildBinding_productId_fkey'
  ) THEN
    ALTER TABLE "GuildBinding"
      ADD CONSTRAINT "GuildBinding_productId_fkey"
      FOREIGN KEY ("productId") REFERENCES "Product"("id")
      ON DELETE CASCADE
      ON UPDATE NO ACTION;
  END IF;
END $$;

DROP INDEX IF EXISTS "GuildBinding_guildId_key";
CREATE INDEX IF NOT EXISTS "GuildBinding_guildId_idx" ON "GuildBinding"("guildId");
CREATE INDEX IF NOT EXISTS "GuildBinding_productId_idx" ON "GuildBinding"("productId");
CREATE UNIQUE INDEX IF NOT EXISTS "GuildBinding_guildId_productId_key" ON "GuildBinding"("guildId", "productId");
