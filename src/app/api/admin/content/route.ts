import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkAdminAuth, unauthorizedResponse } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  if (!checkAdminAuth(request)) return unauthorizedResponse()

  try {
    const contents = await db.siteContent.findMany({
      orderBy: { key: 'asc' },
    })
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

    const content = await db.siteContent.upsert({
      where: { key: String(key) },
      update: { value: String(value || '') },
      create: {
        key: String(key),
        value: String(value || ''),
      },
    })

    return NextResponse.json({ success: true, content })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to update content' },
      { status: 500 }
    )
  }
}
