import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkAdminAuth, unauthorizedResponse } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  if (!checkAdminAuth(request)) return unauthorizedResponse()

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const payments = await db.paymentRequest.findMany({
      where: status ? { status } : undefined,
      include: {
        user: {
          select: { phone: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const serializedPayments = payments.map(({ user, ...payment }) => ({
      ...payment,
      userPhone: user?.phone || null,
    }))

    return NextResponse.json({ success: true, payments: serializedPayments })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payments' },
      { status: 500 }
    )
  }
}
