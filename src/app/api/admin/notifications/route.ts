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
    const notifications = await rawQuery(
      'SELECT * FROM AdminNotification ORDER BY createdAt DESC'
    ) as any[]

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

    const safeTitle = sanitize(String(title))
    const safeMessage = sanitize(String(message))
    const safeType = sanitize(String(type || 'info'))

    await rawQuery(`
      INSERT INTO AdminNotification (id, title, message, type, isRead, createdAt)
      VALUES (lower(hex(randomblob(12))), '${safeTitle}', '${safeMessage}', '${safeType}', 0, datetime('now'))
    `)

    const notifications = await rawQuery(
      'SELECT * FROM AdminNotification ORDER BY createdAt DESC LIMIT 1'
    ) as any[]

    return NextResponse.json({ success: true, notification: notifications[0] })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to create notification' },
      { status: 500 }
    )
  }
}
