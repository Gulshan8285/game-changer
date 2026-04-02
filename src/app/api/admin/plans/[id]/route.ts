import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

async function rawQuery(sql: string) {
  return db.$queryRawUnsafe(sql)
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, price, daily, monthly, totalReturn, color, iconBg, iconColor, isActive, sortOrder } = body

    const sets: string[] = []
    if (name !== undefined) sets.push(`name = '${name.replace(/'/g, "''")}'`)
    if (price !== undefined) sets.push(`price = ${price}`)
    if (daily !== undefined) sets.push(`daily = ${daily}`)
    if (monthly !== undefined) sets.push(`monthly = ${monthly}`)
    if (totalReturn !== undefined) sets.push(`totalReturn = ${totalReturn}`)
    if (color !== undefined) sets.push(`color = '${color.replace(/'/g, "''")}'`)
    if (iconBg !== undefined) sets.push(`iconBg = '${iconBg.replace(/'/g, "''")}'`)
    if (iconColor !== undefined) sets.push(`iconColor = '${iconColor.replace(/'/g, "''")}'`)
    if (isActive !== undefined) sets.push(`isActive = ${isActive ? 1 : 0}`)
    if (sortOrder !== undefined) sets.push(`sortOrder = ${sortOrder}`)
    sets.push(`updatedAt = datetime('now')`)

    if (sets.length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 })

    await rawQuery(`UPDATE InvestmentPlan SET ${sets.join(', ')} WHERE id = '${id}'`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Plan update error:', error)
    return NextResponse.json({ error: 'Failed to update plan' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await rawQuery(`DELETE FROM InvestmentPlan WHERE id = '${id}'`)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Plan delete error:', error)
    return NextResponse.json({ error: 'Failed to delete plan' }, { status: 500 })
  }
}
