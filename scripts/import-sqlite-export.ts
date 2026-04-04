import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'

function resolveDatabaseUrl() {
  const candidates = [
    process.env.DATABASE_URL,
    process.env.NEON_DATABASE_URL,
    process.env.POSTGRES_URL,
  ]

  return (
    candidates.find((value) => value && /^(postgres|postgresql):\/\//.test(value)) || ''
  )
}

const databaseUrl = resolveDatabaseUrl()
const db = databaseUrl
  ? new PrismaClient({
      adapter: new PrismaNeon({ connectionString: databaseUrl }),
    })
  : new PrismaClient()
const exportDir = process.env.SQLITE_EXPORT_DIR || '/tmp/game-changer-export'

type NullableString = string | null

type UserRecord = {
  id: string
  name: string
  email: string
  password: NullableString
  phone: NullableString
  avatar: NullableString
  accountNo: NullableString
  accountNo2: NullableString
  ifscCode: NullableString
  bankName: NullableString
  upiId: NullableString
  address: NullableString
  city: NullableString
  state: NullableString
  pincode: NullableString
  termsAccepted: number | boolean
  isGoogleAuth: number | boolean
  forceLogoutAt: NullableString
  createdAt: number | string
  updatedAt: number | string
}

type AdminAuthRecord = {
  id: string
  username: string
  password: string
}

type InvestmentPlanRecord = {
  id: string
  name: string
  price: number
  daily: number
  monthly: number
  totalReturn: number
  color: string
  iconBg: string
  iconColor: string
  isActive: number | boolean
  sortOrder: number
  createdAt: number | string
  updatedAt: number | string
}

type SiteContentRecord = {
  id: string
  key: string
  value: string
  updatedAt: number | string
}

type PaymentRequestRecord = {
  id: string
  userId: string
  userName: string
  userEmail: string
  planId: string
  planName: string
  amount: number
  status: string
  adminNote: NullableString
  createdAt: number | string
  updatedAt: number | string
}

type WithdrawalRequestRecord = {
  id: string
  userId: string
  userName: string
  userEmail: string
  amount: number
  status: string
  adminNote: NullableString
  createdAt: number | string
  updatedAt: number | string
}

type PaymentProofRecord = {
  id: string
  userId: string
  userName: string
  userEmail: string
  userPhone: NullableString
  utr: string
  planName: string
  amount: number
  screenshotFilename: string
  status: string
  adminNote: NullableString
  planData: string
  createdAt: number | string
  updatedAt: number | string
}

type AdminNotificationRecord = {
  id: string
  title: string
  message: string
  type: string
  isRead: number | boolean
  createdAt: number | string
}

async function readExport<T>(fileName: string): Promise<T[]> {
  const filePath = path.join(exportDir, fileName)
  const raw = await readFile(filePath, 'utf8').catch((error: NodeJS.ErrnoException) => {
    if (error.code === 'ENOENT') return ''
    throw error
  })

  if (!raw.trim()) {
    return []
  }

  return JSON.parse(raw) as T[]
}

function toDate(value: number | string | null | undefined): Date {
  if (typeof value === 'number') {
    return new Date(value)
  }

  if (typeof value === 'string') {
    const numericValue = Number(value)
    if (!Number.isNaN(numericValue)) {
      return new Date(numericValue)
    }

    return new Date(value.includes('T') ? value : `${value.replace(' ', 'T')}Z`)
  }

  return new Date()
}

function toNullableDate(value: number | string | null | undefined): Date | null {
  if (value === null || value === undefined || value === '') {
    return null
  }

  return toDate(value)
}

function toBoolean(value: number | boolean): boolean {
  return value === true || value === 1
}

async function main() {
  console.log(`Importing SQLite export from ${exportDir}`)

  const [
    users,
    admins,
    plans,
    contents,
    paymentRequests,
    withdrawalRequests,
    paymentProofs,
    notifications,
  ] = await Promise.all([
    readExport<UserRecord>('users.json'),
    readExport<AdminAuthRecord>('admin-auth.json'),
    readExport<InvestmentPlanRecord>('investment-plans.json'),
    readExport<SiteContentRecord>('site-content.json'),
    readExport<PaymentRequestRecord>('payment-requests.json'),
    readExport<WithdrawalRequestRecord>('withdrawal-requests.json'),
    readExport<PaymentProofRecord>('payment-proofs.json'),
    readExport<AdminNotificationRecord>('admin-notifications.json'),
  ])

  if (users.length > 0) {
    await db.user.createMany({
      data: users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        password: user.password,
        phone: user.phone,
        avatar: user.avatar,
        accountNo: user.accountNo,
        accountNo2: user.accountNo2,
        ifscCode: user.ifscCode,
        bankName: user.bankName,
        upiId: user.upiId,
        address: user.address,
        city: user.city,
        state: user.state,
        pincode: user.pincode,
        termsAccepted: toBoolean(user.termsAccepted),
        isGoogleAuth: toBoolean(user.isGoogleAuth),
        forceLogoutAt: toNullableDate(user.forceLogoutAt),
        createdAt: toDate(user.createdAt),
        updatedAt: toDate(user.updatedAt),
      })),
      skipDuplicates: true,
    })
  }

  if (admins.length > 0) {
    await db.adminAuth.createMany({
      data: admins,
      skipDuplicates: true,
    })
  }

  if (plans.length > 0) {
    await db.investmentPlan.createMany({
      data: plans.map((plan) => ({
        id: plan.id,
        name: plan.name,
        price: plan.price,
        daily: plan.daily,
        monthly: plan.monthly,
        totalReturn: plan.totalReturn,
        color: plan.color,
        iconBg: plan.iconBg,
        iconColor: plan.iconColor,
        isActive: toBoolean(plan.isActive),
        sortOrder: plan.sortOrder,
        createdAt: toDate(plan.createdAt),
        updatedAt: toDate(plan.updatedAt),
      })),
      skipDuplicates: true,
    })
  }

  if (contents.length > 0) {
    await db.siteContent.createMany({
      data: contents.map((content) => ({
        id: content.id,
        key: content.key,
        value: content.value,
        updatedAt: toDate(content.updatedAt),
      })),
      skipDuplicates: true,
    })
  }

  if (paymentRequests.length > 0) {
    await db.paymentRequest.createMany({
      data: paymentRequests.map((payment) => ({
        id: payment.id,
        userId: payment.userId,
        userName: payment.userName,
        userEmail: payment.userEmail,
        planId: payment.planId,
        planName: payment.planName,
        amount: payment.amount,
        status: payment.status,
        adminNote: payment.adminNote,
        createdAt: toDate(payment.createdAt),
        updatedAt: toDate(payment.updatedAt),
      })),
      skipDuplicates: true,
    })
  }

  if (withdrawalRequests.length > 0) {
    await db.withdrawalRequest.createMany({
      data: withdrawalRequests.map((withdrawal) => ({
        id: withdrawal.id,
        userId: withdrawal.userId,
        userName: withdrawal.userName,
        userEmail: withdrawal.userEmail,
        amount: withdrawal.amount,
        status: withdrawal.status,
        adminNote: withdrawal.adminNote,
        createdAt: toDate(withdrawal.createdAt),
        updatedAt: toDate(withdrawal.updatedAt),
      })),
      skipDuplicates: true,
    })
  }

  if (paymentProofs.length > 0) {
    await db.paymentProof.createMany({
      data: paymentProofs.map((proof) => ({
        id: proof.id,
        userId: proof.userId,
        userName: proof.userName,
        userEmail: proof.userEmail,
        userPhone: proof.userPhone,
        utr: proof.utr,
        planName: proof.planName,
        amount: proof.amount,
        screenshotFilename: proof.screenshotFilename,
        status: proof.status,
        adminNote: proof.adminNote,
        planData: proof.planData,
        createdAt: toDate(proof.createdAt),
        updatedAt: toDate(proof.updatedAt),
      })),
      skipDuplicates: true,
    })
  }

  if (notifications.length > 0) {
    await db.adminNotification.createMany({
      data: notifications.map((notification) => ({
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        isRead: toBoolean(notification.isRead),
        createdAt: toDate(notification.createdAt),
      })),
      skipDuplicates: true,
    })
  }

  console.log('SQLite export imported successfully')
}

main()
  .catch((error) => {
    console.error('SQLite export import failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
