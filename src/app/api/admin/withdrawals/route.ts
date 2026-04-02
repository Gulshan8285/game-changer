import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkAdminAuth, unauthorizedResponse } from '@/lib/admin-auth'

async function rawQuery(sql: string) {
  return db.$queryRawUnsafe(sql)
}

function sanitize(value: string) {
  return value.replace(/'/g, "''")
}

export async function GET(request: NextRequest) {
  if (!checkAdminAuth(request)) return unauthorizedResponse()

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    let sql = `
      SELECT wr.*, u.phone as userPhone
      FROM WithdrawalRequest wr
      LEFT JOIN User u ON wr.userId = u.id
    `
    if (status) {
      sql += ` WHERE wr.status = '${sanitize(status)}'`
    }
    sql += ' ORDER BY wr.createdAt DESC'

    const withdrawals = await rawQuery(sql) as any[]

    return NextResponse.json({ success: true, withdrawals })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch withdrawals' },
      { status: 500 }
    )
  }
}
