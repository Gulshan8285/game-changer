import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkAdminAuth, unauthorizedResponse } from '@/lib/admin-auth'

async function rawQuery(sql: string) {
  return db.$queryRawUnsafe(sql)
}

export async function GET(request: NextRequest) {
  if (!checkAdminAuth(request)) return unauthorizedResponse()

  try {
    const plans = await rawQuery('SELECT * FROM InvestmentPlan ORDER BY sortOrder ASC, createdAt ASC') as any[]
    return NextResponse.json({ success: true, plans })
  } catch (error) {
    console.error('Plans GET error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch plans' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  if (!checkAdminAuth(request)) return unauthorizedResponse()

  try {
    const body = await request.json()
    const { name, price, daily, monthly, totalReturn, color, iconBg, iconColor, isActive, sortOrder } = body

    if (!name || !price || !daily || !totalReturn) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }

    await rawQuery(
      `INSERT INTO InvestmentPlan (id, name, price, daily, monthly, totalReturn, color, iconBg, iconColor, isActive, sortOrder, createdAt, updatedAt)
       VALUES (lower(hex(randomblob(12))), '${name.replace(/'/g, "''")}', ${price}, ${daily}, ${monthly || 0}, ${totalReturn}, '${(color || 'bg-emerald-500').replace(/'/g, "''")}', '${(iconBg || 'bg-emerald-500/20').replace(/'/g, "''")}', '${(iconColor || 'text-emerald-400').replace(/'/g, "''")}', ${isActive !== false ? 1 : 0}, ${sortOrder || 0}, datetime('now'), datetime('now'))`
    )

    return NextResponse.json({ success: true, plan: body })
  } catch (error) {
    console.error('Plans POST error:', error)
    return NextResponse.json({ success: false, error: 'Failed to create plan' }, { status: 500 })
  }
}
