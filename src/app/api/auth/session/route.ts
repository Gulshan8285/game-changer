import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { buildHeartbeatSessionData, buildLogoutSessionData } from '@/lib/user-session';

export async function POST(req: NextRequest) {
  try {
    const { userId, action } = await req.json();

    if (!userId || !action) {
      return NextResponse.json({ success: false, error: 'userId and action are required' }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, forceLogoutAt: true },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    if (action === 'heartbeat') {
      if (user.forceLogoutAt) {
        await db.user.update({
          where: { id: userId },
          data: {
            ...buildLogoutSessionData(new Date(), false),
            forceLogoutAt: null,
          },
        });

        return NextResponse.json({ success: true, forceLogout: true });
      }

      await db.user.update({
        where: { id: userId },
        data: buildHeartbeatSessionData(),
      });

      return NextResponse.json({ success: true, forceLogout: false });
    }

    if (action === 'logout') {
      await db.user.update({
        where: { id: userId },
        data: {
          ...buildLogoutSessionData(),
          forceLogoutAt: null,
        },
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('[AUTH SESSION] Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update session' }, { status: 500 });
  }
}
