import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, planId, planName, amount } = body

    if (!userId || !planId || !planName || !amount) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const user = await db.user.findUnique({
      where: { id: String(userId) },
      select: { name: true, email: true },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    const payment = await db.paymentRequest.create({
      data: {
        userId: String(userId),
        userName: user.name,
        userEmail: user.email,
        planId: String(planId),
        planName: String(planName),
        amount: Number(amount),
        status: 'pending',
      },
    })

    return NextResponse.json({ success: true, payment })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to create payment request' },
      { status: 500 }
    )
  }
}
