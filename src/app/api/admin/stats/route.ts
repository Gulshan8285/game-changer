import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkAdminAuth, unauthorizedResponse } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  if (!checkAdminAuth(request)) return unauthorizedResponse()

  try {
    const [
      totalUsers,
      activeInvestments,
      pendingPayments,
      pendingWithdrawals,
      totalPayments,
      paymentProofs,
      approvedPaymentAggregate,
    ] = await Promise.all([
      db.user.count(),
      db.investmentPlan.count({ where: { isActive: true } }),
      db.paymentRequest.count({ where: { status: 'pending' } }),
      db.withdrawalRequest.count({ where: { status: 'pending' } }),
      db.paymentRequest.count({ where: { status: 'approved' } }),
      db.paymentProof.count({ where: { status: 'pending' } }),
      db.paymentRequest.aggregate({
        where: { status: 'approved' },
        _sum: { amount: true },
      }),
    ])

    const totalInvestedAmount = Number(approvedPaymentAggregate._sum.amount || 0)

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        activeInvestments,
        pendingPayments,
        pendingWithdrawals,
        totalInvestedAmount,
        totalPayments,
        pendingProofs: paymentProofs,
      },
    })
  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch stats' }, { status: 500 })
  }
}
