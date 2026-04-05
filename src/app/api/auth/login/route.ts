import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { buildLoginSessionData } from '@/lib/user-session';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { email } });

    if (!user || !user.password) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    await db.user.update({
      where: { id: user.id },
      data: buildLoginSessionData(),
    });

    if (!user.termsAccepted) {
      return NextResponse.json({
        user: { id: user.id, name: user.name, email: user.email, termsAccepted: false },
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
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
