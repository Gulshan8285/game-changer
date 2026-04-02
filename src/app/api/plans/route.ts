import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

async function rawQuery(sql: string) {
  return db.$queryRawUnsafe(sql)
}

export async function GET() {
  try {
    const plans = await rawQuery(
      "SELECT * FROM InvestmentPlan WHERE isActive = 1 ORDER BY sortOrder ASC"
    ) as any[]

    return NextResponse.json({ success: true, plans })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch plans' },
      { status: 500 }
    )
  }
}
