import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkAdminAuth, unauthorizedResponse } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  if (!checkAdminAuth(request)) return unauthorizedResponse()

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const withdrawals = await db.withdrawalRequest.findMany({
      where: status ? { status } : undefined,
      include: {
        user: {
          select: {
            phone: true,
            avatar: true,
            upiId: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const serializedWithdrawals = withdrawals.map(({ user, ...withdrawal }) => ({
      ...withdrawal,
      userPhone: user?.phone || null,
      userAvatar: user?.avatar || null,
      upiId: user?.upiId || null,
    }))

    return NextResponse.json({ success: true, withdrawals: serializedWithdrawals })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch withdrawals' },
      { status: 500 }
    )
  }
}
