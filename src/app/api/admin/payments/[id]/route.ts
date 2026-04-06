import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkAdminAuth, unauthorizedResponse } from '@/lib/admin-auth'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAdminAuth(request)) return unauthorizedResponse()

  try {
    const { id } = await params
    const body = await request.json()
    const { status, adminNote } = body

    if (!status || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Status must be "approved" or "rejected"' },
        { status: 400 }
      )
    }

    const payment = await db.paymentRequest.update({
      where: { id },
      data: {
        status,
        adminNote: adminNote ? String(adminNote) : null,
      },
    })

    return NextResponse.json({ success: true, payment })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to update payment' },
      { status: 500 }
    )
  }
}
