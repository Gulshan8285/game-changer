import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

async function rawQuery(sql: string) {
  return db.$queryRawUnsafe(sql)
}

function sanitize(value: string) {
  return value.replace(/'/g, "''")
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const markRead = searchParams.get('markRead')
    const checkUserId = searchParams.get('userId')

    if (markRead) {
      await rawQuery(
        `UPDATE AdminNotification SET isRead = 1 WHERE id = '${sanitize(markRead)}'`
      )
    }

    // Check if user has been force-logged-out by admin
    let forceLogout = false
    if (checkUserId) {
      const users = await rawQuery(
        `SELECT forceLogoutAt FROM User WHERE id = '${sanitize(checkUserId)}'`
      ) as any[]
      if (users.length > 0 && users[0].forceLogoutAt) {
        // Check if forceLogoutAt is after their last login (use current session time)
        // We just return the flag — the client will handle logout
        forceLogout = true
        // Clear the flag after detecting so it doesn't keep triggering
        await rawQuery(
          `UPDATE User SET forceLogoutAt = NULL WHERE id = '${sanitize(checkUserId)}'`
        )
      }
    }

    const notifications = await rawQuery(
      'SELECT * FROM AdminNotification ORDER BY createdAt DESC LIMIT 20'
    ) as any[]

    return NextResponse.json({ success: true, notifications, forceLogout })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}
