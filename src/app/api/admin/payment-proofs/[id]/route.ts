import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

const ADMIN_TOKEN = 'btc-admin-2024';

function verifyAdmin(request: Request): boolean {
  const auth = request.headers.get('Authorization');
  return auth === `Bearer ${ADMIN_TOKEN}`;
}

// PUT: Approve or reject a payment proof
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { status, adminNote } = body;

    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ success: false, error: 'Invalid status. Use approved or rejected.' }, { status: 400 });
    }

    // Get the proof first
    const proof = await db.paymentProof.findUnique({ where: { id } });
    if (!proof) {
      return NextResponse.json({ success: false, error: 'Proof not found' }, { status: 404 });
    }

    if (proof.status !== 'pending') {
      return NextResponse.json({ success: false, error: `Proof already ${proof.status}` }, { status: 400 });
    }

    // Update status
    const updated = await db.paymentProof.update({
      where: { id },
      data: { status, adminNote: adminNote || null },
    });

    console.log(`[ADMIN] Payment proof ${id} ${status} by admin. UTR: ${proof.utr}, User: ${proof.userName}`);

    return NextResponse.json({
      success: true,
      proof: updated,
      message: `Payment proof ${status} successfully`,
    });
  } catch (error) {
    console.error('[ADMIN PAYMENT PROOF PUT] Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update' }, { status: 500 });
  }
}
