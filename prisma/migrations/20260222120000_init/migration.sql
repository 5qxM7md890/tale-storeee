-- Initial migration for Fate Store MVP
-- This file is intentionally kept simple; Prisma will manage drift checks.

CREATE TYPE "SlotStatus" AS ENUM ('UNASSIGNED', 'ASSIGNED', 'DISABLED');
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE','PAST_DUE','CANCELED','INCOMPLETE','INCOMPLETE_EXPIRED','TRIALING','UNPAID');
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT','OPEN','PAID','VOID','UNCOLLECTIBLE');

CREATE TABLE "User" (
  "id" TEXT PRIMARY KEY,
  "discordId" TEXT NOT NULL UNIQUE,
  "email" TEXT,
  "avatar" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "Session" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "discordAccessToken" TEXT NOT NULL,
  "discordTokenType" TEXT NOT NULL,
  "discordExpiresAt" TIMESTAMP(3) NOT NULL,
  "discordRefreshToken" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

CREATE TABLE "Product" (
  "id" TEXT PRIMARY KEY,
  "slug" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "stripeProductId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "PricingOption" (
  "id" TEXT PRIMARY KEY,
  "productId" TEXT NOT NULL,
  "periodMonths" INTEGER NOT NULL,
  "unitMonthlyCents" INTEGER NOT NULL,
  "stripePriceId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PricingOption_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX "PricingOption_productId_periodMonths_key" ON "PricingOption"("productId","periodMonths");
CREATE INDEX "PricingOption_productId_idx" ON "PricingOption"("productId");

CREATE TABLE "Subscription" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "stripeSubscriptionId" TEXT NOT NULL UNIQUE,
  "stripeCustomerId" TEXT NOT NULL,
  "status" "SubscriptionStatus" NOT NULL,
  "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);
CREATE INDEX "Subscription_userId_idx" ON "Subscription"("userId");
CREATE INDEX "Subscription_stripeCustomerId_idx" ON "Subscription"("stripeCustomerId");

CREATE TABLE "SubscriptionItem" (
  "id" TEXT PRIMARY KEY,
  "subscriptionId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "pricingOptionId" TEXT NOT NULL,
  "qtySlots" INTEGER NOT NULL,
  "stripeSubscriptionItemId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SubscriptionItem_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE CASCADE,
  CONSTRAINT "SubscriptionItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT,
  CONSTRAINT "SubscriptionItem_pricingOptionId_fkey" FOREIGN KEY ("pricingOptionId") REFERENCES "PricingOption"("id") ON DELETE RESTRICT
);
CREATE INDEX "SubscriptionItem_subscriptionId_idx" ON "SubscriptionItem"("subscriptionId");
CREATE INDEX "SubscriptionItem_productId_idx" ON "SubscriptionItem"("productId");
CREATE INDEX "SubscriptionItem_pricingOptionId_idx" ON "SubscriptionItem"("pricingOptionId");

CREATE TABLE "SubscriptionSlot" (
  "id" TEXT PRIMARY KEY,
  "subscriptionItemId" TEXT NOT NULL,
  "slotNo" INTEGER NOT NULL,
  "guildId" TEXT,
  "status" "SlotStatus" NOT NULL DEFAULT 'UNASSIGNED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SubscriptionSlot_subscriptionItemId_fkey" FOREIGN KEY ("subscriptionItemId") REFERENCES "SubscriptionItem"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX "SubscriptionSlot_subscriptionItemId_slotNo_key" ON "SubscriptionSlot"("subscriptionItemId","slotNo");
CREATE INDEX "SubscriptionSlot_guildId_idx" ON "SubscriptionSlot"("guildId");

CREATE TABLE "Invoice" (
  "id" TEXT PRIMARY KEY,
  "subscriptionId" TEXT NOT NULL,
  "stripeInvoiceId" TEXT NOT NULL UNIQUE,
  "status" "InvoiceStatus" NOT NULL,
  "amountPaid" INTEGER NOT NULL,
  "hostedInvoiceUrl" TEXT,
  "pdfUrl" TEXT,
  "invoiceCreated" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Invoice_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE CASCADE
);
CREATE INDEX "Invoice_subscriptionId_idx" ON "Invoice"("subscriptionId");
CREATE INDEX "Invoice_invoiceCreated_idx" ON "Invoice"("invoiceCreated");

CREATE TABLE "WebhookEvent" (
  "id" TEXT PRIMARY KEY,
  "processed" BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
