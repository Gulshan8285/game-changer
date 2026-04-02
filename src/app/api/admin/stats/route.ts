import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

async function rawQuery(sql: string) {
  return db.$queryRawUnsafe(sql)
}

export async function GET() {
  try {
    const rows = await rawQuery(`
      SELECT 
        (SELECT count(*) FROM User) as totalUsers,
        (SELECT count(*) FROM InvestmentPlan WHERE isActive = 1) as activePlans,
        (SELECT count(*) FROM PaymentRequest WHERE status = 'pending') as pendingPayments,
        (SELECT count(*) FROM WithdrawalRequest WHERE status = 'pending') as pendingWithdrawals
    `) as any[]

    let totalInvested = 0
    try {
      const ti = await rawQuery("SELECT total(amount) as t FROM PaymentRequest WHERE status = 'approved'") as any[]
      totalInvested = Number(ti[0]?.t || 0)
    } catch { /* table might not have data */ }

    return NextResponse.json({
      totalUsers: Number(rows[0]?.totalUsers || 0),
      activePlans: Number(rows[0]?.activePlans || 0),
      pendingPayments: Number(rows[0]?.pendingPayments || 0),
      pendingWithdrawals: Number(rows[0]?.pendingWithdrawals || 0),
      totalInvested,
    })
  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
