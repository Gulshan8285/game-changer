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
    const contents = await rawQuery('SELECT * FROM SiteContent') as any[]
    const contentMap: Record<string, string> = {}
    for (const item of contents) {
      contentMap[item.key] = item.value
    }
    return NextResponse.json({ success: true, content: contentMap })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch content' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  if (!checkAdminAuth(request)) return unauthorizedResponse()

  try {
    const body = await request.json()
    const { key, value } = body

    if (!key) {
      return NextResponse.json(
        { success: false, error: 'Key is required' },
        { status: 400 }
      )
    }

    const safeKey = sanitize(String(key))
    const safeValue = sanitize(String(value || ''))

    // Upsert: insert or replace
    await rawQuery(`
      INSERT INTO SiteContent (id, key, value, updatedAt)
      VALUES (lower(hex(randomblob(12))), '${safeKey}', '${safeValue}', datetime('now'))
      ON CONFLICT(key) DO UPDATE SET value = '${safeValue}', updatedAt = datetime('now')
    `)

    const results = await rawQuery(
      `SELECT * FROM SiteContent WHERE key = '${safeKey}'`
    ) as any[]

    return NextResponse.json({ success: true, content: results[0] })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to update content' },
      { status: 500 }
    )
  }
}
