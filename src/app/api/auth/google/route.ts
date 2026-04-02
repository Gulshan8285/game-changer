import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { name, email, avatar, isGoogleAuth } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Check if user exists
    let user = await db.user.findUnique({ where: { email } });

    if (user) {
      // Update existing user
      user = await db.user.update({
        where: { email },
        data: {
          name: name || user.name,
          avatar: avatar || user.avatar,
          isGoogleAuth: true,
        }
      });
    } else {
      // Create new user
      user = await db.user.create({
        data: {
          name: name || email.split('@')[0],
          email,
          avatar: avatar || null,
          isGoogleAuth: true,
        }
      });
    }

    if (!user.termsAccepted) {
      return NextResponse.json({
        user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar, termsAccepted: false },
        needsTermsAcceptance: true
      });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        accountNo: user.accountNo,
        accountNo2: user.accountNo2,
        ifscCode: user.ifscCode,
        bankName: user.bankName,
        upiId: user.upiId,
        address: user.address,
        city: user.city,
        state: user.state,
        pincode: user.pincode,
        termsAccepted: user.termsAccepted,
        isGoogleAuth: user.isGoogleAuth,
      }
    });
  } catch (error) {
    console.error('Google auth error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
