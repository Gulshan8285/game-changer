import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Admin WhatsApp number for notification
const ADMIN_PHONE = '918810381949';
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzr5HECDqQmA40gBEzu5lfQ8BjTTVjvT3FmwticvhZlD_iOTYwTPgtVUzGO4aWVmXid/exec';

// GET: Check approved proofs for a user (used by Dashboard to auto-add plans)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ success: false, error: 'userId required' }, { status: 400 });
    }

    // Get approved proofs that haven't been consumed yet
    const proofs = await db.paymentProof.findMany({
      where: { userId, status: 'approved' },
      select: {
        id: true,
        planName: true,
        amount: true,
        status: true,
        planData: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, proofs });
  } catch (error) {
    console.error('[PAYMENT PROOF GET] Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch proofs' }, { status: 500 });
  }
}

// POST: Submit payment proof (UTR + screenshot) — saves to database
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const userId = formData.get('userId') as string;
    const phone = formData.get('phone') as string;
    const utr = formData.get('utr') as string;
    const planName = formData.get('planName') as string;
    const amount = formData.get('amount') as string;
    const userName = formData.get('userName') as string;
    const userEmail = formData.get('userEmail') as string;
    const planDaily = formData.get('planDaily') as string;
    const planMonthly = formData.get('planMonthly') as string;
    const planTotalReturn = formData.get('planTotalReturn') as string;
    const planColor = formData.get('planColor') as string;
    const planIconBg = formData.get('planIconBg') as string;
    const planIconColor = formData.get('planIconColor') as string;
    const screenshot = formData.get('screenshot') as File | null;

    // Validate UTR
    if (!utr || utr.trim().length < 4) {
      return NextResponse.json({ success: false, error: 'UTR number is required (min 4 characters)' }, { status: 400 });
    }

    // Validate screenshot
    if (!screenshot) {
      return NextResponse.json({ success: false, error: 'Screenshot is required' }, { status: 400 });
    }

    if (screenshot.size > 5 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: 'Image too large (max 5MB)' }, { status: 400 });
    }

    // Keep a human-readable filename, but persist image data in the database.
    const timestamp = Date.now();
    const ext = screenshot.name?.split('.').pop() || 'jpg';
    const safeUtr = utr.trim().replace(/[^a-zA-Z0-9]/g, '');
    const filename = `proof_${safeUtr}_${timestamp}.${ext}`;

    const bytes = await screenshot.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const screenshotMimeType = screenshot.type || 'image/jpeg';
    const screenshotBase64 = buffer.toString('base64');

    // Store plan data as JSON for later use on approval
    const planData = JSON.stringify({
      name: planName,
      investment: parseInt(amount) || 0,
      daily: parseInt(planDaily) || 0,
      monthly: parseInt(planMonthly) || 0,
      totalReturn: parseInt(planTotalReturn) || 0,
      color: planColor || 'bg-emerald-500',
      iconBg: planIconBg || 'bg-emerald-500/20',
      iconColor: planIconColor || 'text-emerald-400',
    });

    // Save to database
    const proof = await db.paymentProof.create({
      data: {
        userId: userId || '',
        userName: userName || 'Unknown',
        userEmail: userEmail || '',
        userPhone: phone || '',
        utr: utr.trim(),
        planName: planName || '',
        amount: parseInt(amount) || 0,
        screenshotFilename: filename,
        screenshotMimeType,
        screenshotBase64,
        planData,
        status: 'pending',
      },
    });

    // Build WhatsApp message with ALL user info for admin verification
    const waMessage = `🆕 *Payment Proof Submitted*\n\n👤 Name: ${userName || 'Unknown'}\n📱 Phone: ${phone || 'N/A'}\n📧 Email: ${userEmail || 'N/A'}\n📋 Plan: ${planName}\n💰 Amount: ₹${amount}\n🔑 UTR: ${utr.trim()}\n📎 File: ${filename}\n⏰ Time: ${new Date().toLocaleString('en-IN')}`;

    // Send tracking data to Google Sheets (async, don't block)
    const trackingData = {
      action: 'payment_proof',
      phone: phone || '',
      utr: utr.trim(),
      planName,
      amount,
      userName,
      userEmail,
      filename,
      timestamp: new Date().toLocaleString('en-IN'),
    };

    fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(trackingData),
    }).catch(() => {});

    console.log(`[PAYMENT PROOF] Created proof ID: ${proof.id}, UTR: ${utr.trim()}`);
    console.log(`[PAYMENT PROOF] Stored screenshot in database: ${filename}`);

    return NextResponse.json({
      success: true,
      proofId: proof.id,
      filename,
      whatsappLink: `https://wa.me/${ADMIN_PHONE}?text=${encodeURIComponent(waMessage)}`,
      message: 'Payment proof submitted successfully. Admin will verify shortly.',
    });
  } catch (error) {
    console.error('[PAYMENT PROOF] Upload error:', error);
    return NextResponse.json({ success: false, error: 'Upload failed' }, { status: 500 });
  }
}
