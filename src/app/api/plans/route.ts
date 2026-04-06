import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const plans = await db.investmentPlan.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    })

    return NextResponse.json({ success: true, plans })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch plans' },
      { status: 500 }
    )
  }
}
