import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkAdminAuth, unauthorizedResponse } from '@/lib/admin-auth'

async function rawQuery(sql: string) {
  return db.$queryRawUnsafe(sql)
}

export async function GET(request: NextRequest) {
  if (!checkAdminAuth(request)) return unauthorizedResponse()

  try {
    const rows = await rawQuery(`
      SELECT
        (SELECT count(*) FROM User) as totalUsers,
        (SELECT count(*) FROM InvestmentPlan WHERE isActive = 1) as activeInvestments,
        (SELECT count(*) FROM PaymentRequest WHERE status = 'pending') as pendingPayments,
        (SELECT count(*) FROM WithdrawalRequest WHERE status = 'pending') as pendingWithdrawals,
        (SELECT count(*) FROM PaymentRequest WHERE status = 'approved') as totalPayments,
        (SELECT count(*) FROM PaymentProof WHERE status = 'pending') as pendingProofs
    `) as any[]

    let totalInvestedAmount = 0
    try {
      const ti = await rawQuery("SELECT total(amount) as t FROM PaymentRequest WHERE status = 'approved'") as any[]
      totalInvestedAmount = Number(ti[0]?.t || 0)
    } catch { /* table might not have data */ }

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers: Number(rows[0]?.totalUsers || 0),
        activeInvestments: Number(rows[0]?.activeInvestments || 0),
        pendingPayments: Number(rows[0]?.pendingPayments || 0),
        pendingWithdrawals: Number(rows[0]?.pendingWithdrawals || 0),
        totalInvestedAmount,
        totalPayments: Number(rows[0]?.totalPayments || 0),
      },
    })
  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch stats' }, { status: 500 })
  }
}
