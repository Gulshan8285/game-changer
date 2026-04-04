import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, amount } = body

    if (!userId || !amount) {
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

    const withdrawal = await db.withdrawalRequest.create({
      data: {
        userId: String(userId),
        userName: user.name,
        userEmail: user.email,
        amount: Number(amount),
        status: 'pending',
      },
    })

    return NextResponse.json({ success: true, withdrawal })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to create withdrawal request' },
      { status: 500 }
    )
  }
}
