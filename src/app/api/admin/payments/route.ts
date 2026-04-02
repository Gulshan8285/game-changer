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
      SELECT pr.*, u.phone as userPhone
      FROM PaymentRequest pr
      LEFT JOIN User u ON pr.userId = u.id
    `
    if (status) {
      sql += ` WHERE pr.status = '${sanitize(status)}'`
    }
    sql += ' ORDER BY pr.createdAt DESC'

    const payments = await rawQuery(sql) as any[]

    return NextResponse.json({ success: true, payments })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payments' },
      { status: 500 }
    )
  }
}
