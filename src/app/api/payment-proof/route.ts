import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

// Admin WhatsApp number for notification
const ADMIN_PHONE = '918810381949';
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzr5HECDqQmA40gBEzu5lfQ8BjTTVjvT3FmwticvhZlD_iOTYwTPgtVUzGO4aWVmXid/exec';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const phone = formData.get('phone') as string;
    const utr = formData.get('utr') as string;
    const planName = formData.get('planName') as string;
    const amount = formData.get('amount') as string;
    const userName = formData.get('userName') as string;
    const userEmail = formData.get('userEmail') as string;
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

    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'uploads', 'payment_proofs');
    await mkdir(uploadsDir, { recursive: true });

    // Save screenshot with unique filename including UTR
    const timestamp = Date.now();
    const ext = screenshot.name?.split('.').pop() || 'jpg';
    const safeUtr = utr.trim().replace(/[^a-zA-Z0-9]/g, '');
    const filename = `proof_${safeUtr}_${timestamp}.${ext}`;
    const filepath = path.join(uploadsDir, filename);

    const bytes = await screenshot.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

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

    // Fire and forget — send to Google Sheets
    fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(trackingData),
    }).catch(() => {});

    // Log the WhatsApp link for admin notification
    console.log(`[PAYMENT PROOF] Admin notification: https://wa.me/${ADMIN_PHONE}?text=${encodeURIComponent(waMessage)}`);
    console.log(`[PAYMENT PROOF] Saved: ${filepath}`);

    return NextResponse.json({
      success: true,
      filename,
      whatsappLink: `https://wa.me/${ADMIN_PHONE}?text=${encodeURIComponent(waMessage)}`,
      message: 'Payment proof submitted successfully',
    });
  } catch (error) {
    console.error('[PAYMENT PROOF] Upload error:', error);
    return NextResponse.json({ success: false, error: 'Upload failed' }, { status: 500 });
  }
}
