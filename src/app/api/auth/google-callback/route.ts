import { NextRequest, NextResponse } from 'next/server';

function getOrigin(req: NextRequest): string {
  const forwardedProto = req.headers.get('x-forwarded-proto') || 'https';
  const forwardedHost = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'localhost';
  return `${forwardedProto}://${forwardedHost}`;
}

function errorRedirect(baseOrigin: string, errorCode: string, errorDesc?: string) {
  const url = new URL('/', `${baseOrigin}/`);
  url.searchParams.set('google_error', errorCode);
  if (errorDesc) url.searchParams.set('google_error_desc', errorDesc);
  return NextResponse.redirect(url);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // Get origin from state param (set by client) or from headers
    const stateOrigin = searchParams.get('state');
    const headerOrigin = getOrigin(req);
    const baseOrigin = stateOrigin ? decodeURIComponent(stateOrigin) : headerOrigin;

    // Handle Google auth error
    if (error) {
      return errorRedirect(baseOrigin, error, errorDescription || undefined);
    }

    if (!code) {
      return errorRedirect(baseOrigin, 'no_code');
    }

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return errorRedirect(baseOrigin, 'missing_config');
    }

    // The redirect_uri MUST match exactly what was sent in the initial auth URL
    const redirectUri = `${baseOrigin}/api/auth/google-callback`;

    // Exchange code for access token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      const errData = await tokenRes.json().catch(() => ({}));
      console.error('Google token exchange failed:', JSON.stringify(errData));
      console.error('Used redirect_uri:', redirectUri);
      return errorRedirect(baseOrigin, 'token_exchange_failed');
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      return errorRedirect(baseOrigin, 'no_access_token');
    }

    // Get user info from Google
    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!userInfoRes.ok) {
      return errorRedirect(baseOrigin, 'userinfo_failed');
    }

    const googleUser = await userInfoRes.json();

    // Encode user data and redirect to frontend
    const userData = encodeURIComponent(JSON.stringify({
      name: googleUser.name,
      email: googleUser.email,
      avatar: googleUser.picture,
      isGoogleAuth: true,
    }));

    const redirectUrl = new URL('/', `${baseOrigin}/`);
    redirectUrl.searchParams.set('google_data', userData);
    return NextResponse.redirect(redirectUrl);
  } catch (err) {
    console.error('Google callback error:', err);
    return NextResponse.redirect('/');
  }
}
