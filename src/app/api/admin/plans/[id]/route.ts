import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkAdminAuth, unauthorizedResponse } from '@/lib/admin-auth'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!checkAdminAuth(request)) return unauthorizedResponse()

  try {
    const { id } = await params
    const body = await request.json()
    const { name, price, daily, monthly, totalReturn, color, iconBg, iconColor, isActive, sortOrder } = body

    const data: Record<string, string | number | boolean> = {}
    if (name !== undefined) data.name = String(name)
    if (price !== undefined) data.price = Number(price)
    if (daily !== undefined) data.daily = Number(daily)
    if (monthly !== undefined) data.monthly = Number(monthly)
    if (totalReturn !== undefined) data.totalReturn = Number(totalReturn)
    if (color !== undefined) data.color = String(color)
    if (iconBg !== undefined) data.iconBg = String(iconBg)
    if (iconColor !== undefined) data.iconColor = String(iconColor)
    if (isActive !== undefined) data.isActive = Boolean(isActive)
    if (sortOrder !== undefined) data.sortOrder = Number(sortOrder)

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ success: false, error: 'No fields to update' }, { status: 400 })
    }

    await db.investmentPlan.update({
      where: { id },
      data,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Plan update error:', error)
    return NextResponse.json({ success: false, error: 'Failed to update plan' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!checkAdminAuth(request)) return unauthorizedResponse()

  try {
    const { id } = await params
    await db.investmentPlan.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Plan delete error:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete plan' }, { status: 500 })
  }
}
