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
    const { userId, amount } = body

    if (!userId || !amount) {
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
    const safeAmount = Number(amount)

    await rawQuery(`
      INSERT INTO WithdrawalRequest (id, userId, userName, userEmail, amount, status, createdAt, updatedAt)
      VALUES (
        lower(hex(randomblob(12))),
        '${safeUserId}',
        '${safeUserName}',
        '${safeUserEmail}',
        ${safeAmount},
        'pending',
        datetime('now'),
        datetime('now')
      )
    `)

    const withdrawals = await rawQuery(
      `SELECT * FROM WithdrawalRequest ORDER BY createdAt DESC LIMIT 1`
    ) as any[]

    return NextResponse.json({ success: true, withdrawal: withdrawals[0] })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to create withdrawal request' },
      { status: 500 }
    )
  }
}
