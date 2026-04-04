import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
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
