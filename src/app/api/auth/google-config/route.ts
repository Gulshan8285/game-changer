import { NextResponse } from 'next/server';

export async function GET() {
  // Server-side reads env at request time (not build time)
  // This ensures the client always gets the latest value even if .env changes
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
  const configured = !!clientId;

  return NextResponse.json({
    clientId,
    configured,
  });
}
