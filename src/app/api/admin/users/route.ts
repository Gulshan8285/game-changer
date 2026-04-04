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
      'SELECT id, name, email, phone, avatar, createdAt, forceLogoutAt FROM User ORDER BY createdAt DESC'
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

    // Set forceLogoutAt to NOW — user will be kicked out on next poll
    // All their data stays intact, they just need to login again
    await rawQuery(
      `UPDATE User SET forceLogoutAt = datetime('now') WHERE id = '${safeId}'`
    )

    return NextResponse.json({ success: true, message: 'User will be logged out. They need to login again.' })
  } catch (error: any) {
    console.error('Force logout error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to logout user: ' + (error?.message || 'Unknown error') },
      { status: 500 }
    )
  }
}
