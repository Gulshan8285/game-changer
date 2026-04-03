import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzr5HECDqQmA40gBEzu5lfQ8BjTTVjvT3FmwticvhZlD_iOTYwTPgtVUzGO4aWVmXid/exec';

// Fire-and-forget send to Google Sheet (don't block the main response)
async function sendToSheet(data: Record<string, string>) {
  try {
    const params = new URLSearchParams(data);
    await fetch(`${GOOGLE_SCRIPT_URL}?${params.toString()}`, {
      method: 'GET',
      redirect: 'follow',
    });
  } catch (err) {
    // Silent fail — don't block user actions if Google Sheet fails
    console.error('Google Sheet tracking failed:', err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      action,       // signup | login | invest | cancel | withdraw | earning
      userId,
      userName,
      userEmail,
      userPhone,
      planName,
      amount,
      method,       // upi | google | email | bank
      deviceInfo,
    } = body;

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }

    // Build row data for Google Sheet
    const data: Record<string, string> = {
      action: action || '',
      userId: userId || '',
      userName: userName || '',
      userEmail: userEmail || '',
      userPhone: userPhone || '',
      planName: planName || '',
      amount: amount ? String(amount) : '',
      method: method || '',
      device: deviceInfo || '',
      timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      date: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      time: new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true }),
    };

    // Send to Google Sheet (fire and forget)
    sendToSheet(data);

    return NextResponse.json({ success: true, tracked: true });
  } catch (error) {
    console.error('Track error:', error);
    return NextResponse.json({ success: false, error: 'Track failed' }, { status: 500 });
  }
}
