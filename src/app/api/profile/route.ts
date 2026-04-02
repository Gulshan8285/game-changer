import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { id: userId } });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
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
    console.error('Profile fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
