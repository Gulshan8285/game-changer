import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkAdminAuth, unauthorizedResponse } from '@/lib/admin-auth'

async function rawQuery(sql: string) {
  return db.$queryRawUnsafe(sql)
}

export async function GET(request: NextRequest) {
  if (!checkAdminAuth(request)) return unauthorizedResponse()

  try {
    const users = await rawQuery(
      'SELECT id, name, email, phone, avatar, createdAt FROM User ORDER BY createdAt DESC'
    ) as any[]

    return NextResponse.json({ success: true, users })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  if (!checkAdminAuth(request)) return unauthorizedResponse()

  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('id')
    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID required' }, { status: 400 })
    }

    const safeId = userId.replace(/'/g, "''")

    // Reset user data — delete their proofs, requests, withdrawals
    // User account stays so they can login again
    await rawQuery(`DELETE FROM PaymentProof WHERE userId = '${safeId}'`)
    await rawQuery(`DELETE FROM PaymentRequest WHERE userId = '${safeId}'`)
    await rawQuery(`DELETE FROM WithdrawalRequest WHERE userId = '${safeId}'`)

    return NextResponse.json({ success: true, message: 'User data reset successfully' })
  } catch (error: any) {
    console.error('Reset user error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to reset user: ' + (error?.message || 'Unknown error') },
      { status: 500 }
    )
  }
}
