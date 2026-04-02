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

    if (markRead) {
      await rawQuery(
        `UPDATE AdminNotification SET isRead = 1 WHERE id = '${sanitize(markRead)}'`
      )
    }

    const notifications = await rawQuery(
      'SELECT * FROM AdminNotification ORDER BY createdAt DESC LIMIT 20'
    ) as any[]

    return NextResponse.json({ success: true, notifications })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}
