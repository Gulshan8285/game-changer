import { neon } from '@neondatabase/serverless'

function getConnectionString() {
  const candidates = [
    process.env.DIRECT_URL,
    process.env.DATABASE_URL,
    process.env.NEON_DATABASE_URL_UNPOOLED,
    process.env.NEON_DATABASE_URL,
    process.env.POSTGRES_URL,
  ]

  const connectionString = candidates.find(
    (value) => value && /^(postgres|postgresql):\/\//.test(value)
  )

  if (!connectionString) {
    throw new Error('No Postgres connection string found for Neon bootstrap')
  }

  return connectionString
}

async function main() {
  const sql = neon(getConnectionString())

  const statements = [
    `CREATE TABLE IF NOT EXISTS "User" (
      "id" TEXT PRIMARY KEY,
      "name" TEXT NOT NULL,
      "email" TEXT NOT NULL,
      "password" TEXT,
      "phone" TEXT,
      "avatar" TEXT,
      "accountNo" TEXT,
      "accountNo2" TEXT,
      "ifscCode" TEXT,
      "bankName" TEXT,
      "upiId" TEXT,
      "address" TEXT,
      "city" TEXT,
      "state" TEXT,
      "pincode" TEXT,
      "termsAccepted" BOOLEAN NOT NULL DEFAULT FALSE,
      "isGoogleAuth" BOOLEAN NOT NULL DEFAULT FALSE,
      "forceLogoutAt" TIMESTAMPTZ,
      "sessionStatus" TEXT NOT NULL DEFAULT 'logged_out',
      "lastLoginAt" TIMESTAMPTZ,
      "lastSeenAt" TIMESTAMPTZ,
      "loggedOutAt" TIMESTAMPTZ,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "sessionStatus" TEXT NOT NULL DEFAULT 'logged_out'`,
    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMPTZ`,
    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastSeenAt" TIMESTAMPTZ`,
    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "loggedOutAt" TIMESTAMPTZ`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User" ("email")`,
    `CREATE TABLE IF NOT EXISTS "InvestmentPlan" (
      "id" TEXT PRIMARY KEY,
      "name" TEXT NOT NULL,
      "price" INTEGER NOT NULL,
      "daily" INTEGER NOT NULL,
      "monthly" INTEGER NOT NULL,
      "totalReturn" INTEGER NOT NULL,
      "color" TEXT NOT NULL DEFAULT 'bg-emerald-500',
      "iconBg" TEXT NOT NULL DEFAULT 'bg-emerald-500/20',
      "iconColor" TEXT NOT NULL DEFAULT 'text-emerald-400',
      "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
      "sortOrder" INTEGER NOT NULL DEFAULT 0,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS "PaymentRequest" (
      "id" TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "userName" TEXT NOT NULL,
      "userEmail" TEXT NOT NULL,
      "planId" TEXT NOT NULL,
      "planName" TEXT NOT NULL,
      "amount" INTEGER NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'pending',
      "adminNote" TEXT,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "PaymentRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS "WithdrawalRequest" (
      "id" TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "userName" TEXT NOT NULL,
      "userEmail" TEXT NOT NULL,
      "amount" INTEGER NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'pending',
      "adminNote" TEXT,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "WithdrawalRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS "AdminNotification" (
      "id" TEXT PRIMARY KEY,
      "title" TEXT NOT NULL,
      "message" TEXT NOT NULL,
      "type" TEXT NOT NULL DEFAULT 'info',
      "isRead" BOOLEAN NOT NULL DEFAULT FALSE,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS "SiteContent" (
      "id" TEXT PRIMARY KEY,
      "key" TEXT NOT NULL,
      "value" TEXT NOT NULL,
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "SiteContent_key_key" ON "SiteContent" ("key")`,
    `CREATE TABLE IF NOT EXISTS "AdminAuth" (
      "id" TEXT PRIMARY KEY,
      "username" TEXT NOT NULL,
      "password" TEXT NOT NULL
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "AdminAuth_username_key" ON "AdminAuth" ("username")`,
    `CREATE TABLE IF NOT EXISTS "PaymentProof" (
      "id" TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "userName" TEXT NOT NULL,
      "userEmail" TEXT NOT NULL,
      "userPhone" TEXT,
      "utr" TEXT NOT NULL,
      "planName" TEXT NOT NULL,
      "amount" INTEGER NOT NULL,
      "screenshotFilename" TEXT NOT NULL,
      "screenshotMimeType" TEXT,
      "screenshotBase64" TEXT,
      "status" TEXT NOT NULL DEFAULT 'pending',
      "adminNote" TEXT,
      "planData" TEXT NOT NULL,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `ALTER TABLE "PaymentProof" ADD COLUMN IF NOT EXISTS "screenshotMimeType" TEXT`,
    `ALTER TABLE "PaymentProof" ADD COLUMN IF NOT EXISTS "screenshotBase64" TEXT`,
  ]

  for (const statement of statements) {
    await sql.query(statement)
  }

  console.log('Neon bootstrap complete')
}

main().catch((error) => {
  console.error('Neon bootstrap failed:', error)
  process.exit(1)
})
