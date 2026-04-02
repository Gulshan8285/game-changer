import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

async function rawQuery(sql: string) {
  return db.$queryRawUnsafe(sql)
}

function sanitize(value: string) {
  return value.replace(/'/g, "''")
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, planId, planName, amount } = body

    if (!userId || !planId || !planName || !amount) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const safeUserId = sanitize(String(userId))
    const users = await rawQuery(
      `SELECT name, email FROM User WHERE id = '${safeUserId}'`
    ) as any[]

    if (!users || users.length === 0) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    const user = users[0]
    const safeUserName = sanitize(user.name)
    const safeUserEmail = sanitize(user.email)
    const safePlanId = sanitize(String(planId))
    const safePlanName = sanitize(String(planName))
    const safeAmount = Number(amount)

    await rawQuery(`
      INSERT INTO PaymentRequest (id, userId, userName, userEmail, planId, planName, amount, status, createdAt, updatedAt)
      VALUES (
        lower(hex(randomblob(12))),
        '${safeUserId}',
        '${safeUserName}',
        '${safeUserEmail}',
        '${safePlanId}',
        '${safePlanName}',
        ${safeAmount},
        'pending',
        datetime('now'),
        datetime('now')
      )
    `)

    const payments = await rawQuery(
      `SELECT * FROM PaymentRequest ORDER BY createdAt DESC LIMIT 1`
    ) as any[]

    return NextResponse.json({ success: true, payment: payments[0] })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to create payment request' },
      { status: 500 }
    )
  }
}
