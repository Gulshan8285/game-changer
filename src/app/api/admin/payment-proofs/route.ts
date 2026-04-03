import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

const ADMIN_TOKEN = 'btc-admin-2024';

function verifyAdmin(request: Request): boolean {
  const auth = request.headers.get('Authorization');
  return auth === `Bearer ${ADMIN_TOKEN}`;
}

// GET: List all payment proofs (with optional status filter)
export async function GET(request: Request) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const where: any = {};
    if (status && status !== 'all') {
      where.status = status;
    }

    const proofs = await db.paymentProof.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    // Count pending
    const pendingCount = await db.paymentProof.count({ where: { status: 'pending' } });

    return NextResponse.json({ success: true, proofs, pendingCount });
  } catch (error) {
    console.error('[ADMIN PAYMENT PROOFS] Fetch error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch' }, { status: 500 });
  }
}
