import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkAdminAuth, unauthorizedResponse } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  if (!checkAdminAuth(request)) return unauthorizedResponse()

  try {
    const notifications = await db.adminNotification.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, notifications })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  if (!checkAdminAuth(request)) return unauthorizedResponse()

  try {
    const body = await request.json()
    const { title, message, type } = body

    if (!title || !message) {
      return NextResponse.json(
        { success: false, error: 'Title and message are required' },
        { status: 400 }
      )
    }

    const notification = await db.adminNotification.create({
      data: {
        title: String(title),
        message: String(message),
        type: String(type || 'info'),
        isRead: false,
      },
    })

    return NextResponse.json({ success: true, notification })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to create notification' },
      { status: 500 }
    )
  }
}
