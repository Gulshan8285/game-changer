import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

async function rawQuery(sql: string) {
  return db.$queryRawUnsafe(sql)
}

export async function GET() {
  try {
    const plans = await rawQuery('SELECT * FROM InvestmentPlan ORDER BY sortOrder ASC, createdAt ASC') as any[]
    return NextResponse.json(plans)
  } catch (error) {
    console.error('Plans GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch plans' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, price, daily, monthly, totalReturn, color, iconBg, iconColor, isActive, sortOrder } = body

    if (!name || !price || !daily || !totalReturn) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    await rawQuery(
      `INSERT INTO InvestmentPlan (id, name, price, daily, monthly, totalReturn, color, iconBg, iconColor, isActive, sortOrder, createdAt, updatedAt)
       VALUES (lower(hex(randomblob(12))), '${name.replace(/'/g, "''")}', ${price}, ${daily}, ${monthly || 0}, ${totalReturn}, '${(color || 'bg-emerald-500').replace(/'/g, "''")}', '${(iconBg || 'bg-emerald-500/20').replace(/'/g, "''")}', '${(iconColor || 'text-emerald-400').replace(/'/g, "''")}', ${isActive !== false ? 1 : 0}, ${sortOrder || 0}, datetime('now'), datetime('now'))`
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Plans POST error:', error)
    return NextResponse.json({ error: 'Failed to create plan' }, { status: 500 })
  }
}
