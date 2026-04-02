import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkAdminAuth, unauthorizedResponse } from '@/lib/admin-auth'

async function rawQuery(sql: string) {
  return db.$queryRawUnsafe(sql)
}

function sanitize(value: string) {
  return value.replace(/'/g, "''")
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAdminAuth(request)) return unauthorizedResponse()

  try {
    const { id } = await params
    const body = await request.json()
    const { status, adminNote } = body

    if (!status || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Status must be "approved" or "rejected"' },
        { status: 400 }
      )
    }

    const safeStatus = sanitize(status)
    const safeAdminNote = adminNote ? `'${sanitize(adminNote)}'` : 'NULL'
    const safeId = sanitize(id)

    await rawQuery(`
      UPDATE PaymentRequest
      SET status = '${safeStatus}', adminNote = ${safeAdminNote}, updatedAt = datetime('now')
      WHERE id = '${safeId}'
    `)

    const payments = await rawQuery(
      `SELECT * FROM PaymentRequest WHERE id = '${safeId}'`
    ) as any[]

    return NextResponse.json({ success: true, payment: payments[0] || null })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to update payment' },
      { status: 500 }
    )
  }
}
