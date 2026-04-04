import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkAdminAuth, unauthorizedResponse } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  if (!checkAdminAuth(request)) return unauthorizedResponse()

  try {
    const plans = await db.investmentPlan.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    })
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

    const plan = await db.investmentPlan.create({
      data: {
        name: String(name),
        price: Number(price),
        daily: Number(daily),
        monthly: Number(monthly || 0),
        totalReturn: Number(totalReturn),
        color: String(color || 'bg-emerald-500'),
        iconBg: String(iconBg || 'bg-emerald-500/20'),
        iconColor: String(iconColor || 'text-emerald-400'),
        isActive: isActive !== false,
        sortOrder: Number(sortOrder || 0),
      },
    })

    return NextResponse.json({ success: true, plan })
  } catch (error) {
    console.error('Plans POST error:', error)
    return NextResponse.json({ success: false, error: 'Failed to create plan' }, { status: 500 })
  }
}
