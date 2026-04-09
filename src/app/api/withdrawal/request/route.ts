import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      )
    }

    const withdrawals = await db.withdrawalRequest.findMany({
      where: { userId: String(userId) },
      include: {
        user: {
          select: { upiId: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      withdrawals: withdrawals.map(({ user, ...withdrawal }) => ({
        ...withdrawal,
        upiId: user?.upiId || null,
      })),
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch withdrawals' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, amount, upiId } = body

    if (!userId || !amount || !upiId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const parsedAmount = Number(amount)
    const normalizedUpiId = String(upiId).trim().toLowerCase()

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid amount' },
        { status: 400 }
      )
    }

    if (!normalizedUpiId.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid UPI ID' },
        { status: 400 }
      )
    }

    const user = await db.user.findUnique({
      where: { id: String(userId) },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        upiId: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    const { withdrawal, savedUpiId } = await db.$transaction(async (tx) => {
      const savedUser =
        user.upiId === normalizedUpiId
          ? user
          : await tx.user.update({
              where: { id: user.id },
              data: { upiId: normalizedUpiId },
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                avatar: true,
                upiId: true,
              },
            })

      const withdrawal = await tx.withdrawalRequest.create({
        data: {
          userId: savedUser.id,
          userName: savedUser.name,
          userEmail: savedUser.email,
          amount: parsedAmount,
          status: 'pending',
        },
      })

      return {
        withdrawal,
        savedUpiId: savedUser.upiId || normalizedUpiId,
      }
    })

    return NextResponse.json({ success: true, withdrawal, savedUpiId })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to create withdrawal request' },
      { status: 500 }
    )
  }
}
