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
    const planName = formData.get('planName') as string;
    const amount = formData.get('amount') as string;
    const userName = formData.get('userName') as string;
    const userEmail = formData.get('userEmail') as string;
    const screenshot = formData.get('screenshot') as File | null;

    // Validate phone
    if (!phone || phone.length !== 10 || !/^\d{10}$/.test(phone)) {
      return NextResponse.json({ success: false, error: 'Invalid phone number' }, { status: 400 });
    }

    // Validate screenshot
    if (!screenshot) {
      return NextResponse.json({ success: false, error: 'Screenshot required' }, { status: 400 });
    }

    if (screenshot.size > 5 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: 'Image too large (max 5MB)' }, { status: 400 });
    }

    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'uploads', 'payment_proofs');
    await mkdir(uploadsDir, { recursive: true });

    // Save screenshot with unique filename
    const timestamp = Date.now();
    const ext = screenshot.name?.split('.').pop() || 'jpg';
    const filename = `proof_${phone}_${timestamp}.${ext}`;
    const filepath = path.join(uploadsDir, filename);

    const bytes = await screenshot.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Send tracking data to Google Sheets (async, don't block)
    const trackingData = {
      action: 'payment_proof',
      phone,
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

    // Send WhatsApp notification to admin (via wa.me click-to-chat link)
    // In production, this would use WhatsApp Business API
    const message = encodeURIComponent(
      `🆕 Payment Proof Received\n\n👤 ${userName || 'Unknown'}\n📱 ${phone}\n📧 ${userEmail || 'N/A'}\n📋 Plan: ${planName}\n💰 Amount: ₹${amount}\n📎 File: ${filename}\n⏰ ${new Date().toLocaleString('en-IN')}`
    );

    // Log the WhatsApp link for admin notification
    // In production, replace with actual WhatsApp Business API call
    console.log(`[PAYMENT PROOF] Admin notification: https://wa.me/${ADMIN_PHONE}?text=${message}`);

    return NextResponse.json({
      success: true,
      filename,
      message: 'Payment proof submitted successfully',
    });
  } catch (error) {
    console.error('[PAYMENT PROOF] Upload error:', error);
    return NextResponse.json({ success: false, error: 'Upload failed' }, { status: 500 });
  }
}
