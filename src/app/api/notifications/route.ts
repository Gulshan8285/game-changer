import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const markRead = searchParams.get('markRead')
    const checkUserId = searchParams.get('userId')

    if (markRead) {
      await db.adminNotification.update({
        where: { id: markRead },
        data: { isRead: true },
      })
    }

    // Check if user has been force-logged-out by admin
    let forceLogout = false
    if (checkUserId) {
      const user = await db.user.findUnique({
        where: { id: checkUserId },
        select: { forceLogoutAt: true },
      })

      if (user?.forceLogoutAt) {
        // Check if forceLogoutAt is after their last login (use current session time)
        // We just return the flag — the client will handle logout
        forceLogout = true
        // Clear the flag after detecting so it doesn't keep triggering
        await db.user.update({
          where: { id: checkUserId },
          data: { forceLogoutAt: null },
        })
      }
    }

    const notifications = await db.adminNotification.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    return NextResponse.json({ success: true, notifications, forceLogout })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}
