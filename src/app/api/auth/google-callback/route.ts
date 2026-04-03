import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // Handle Google auth error
    if (error) {
      const redirectUrl = new URL('/', req.url);
      redirectUrl.searchParams.set('google_error', error);
      if (errorDescription) redirectUrl.searchParams.set('google_error_desc', errorDescription);
      return NextResponse.redirect(redirectUrl);
    }

    if (!code) {
      const redirectUrl = new URL('/', req.url);
      redirectUrl.searchParams.set('google_error', 'no_code');
      return NextResponse.redirect(redirectUrl);
    }

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = `${new URL(req.url).origin}/api/auth/google-callback`;

    if (!clientId || !clientSecret) {
      const redirectUrl = new URL('/', req.url);
      redirectUrl.searchParams.set('google_error', 'missing_config');
      return NextResponse.redirect(redirectUrl);
    }

    // Exchange authorization code for access token
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
      console.error('Google token exchange failed:', errData);
      const redirectUrl = new URL('/', req.url);
      redirectUrl.searchParams.set('google_error', 'token_exchange_failed');
      return NextResponse.redirect(redirectUrl);
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      const redirectUrl = new URL('/', req.url);
      redirectUrl.searchParams.set('google_error', 'no_access_token');
      return NextResponse.redirect(redirectUrl);
    }

    // Get user info from Google
    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!userInfoRes.ok) {
      const redirectUrl = new URL('/', req.url);
      redirectUrl.searchParams.set('google_error', 'userinfo_failed');
      return NextResponse.redirect(redirectUrl);
    }

    const googleUser = await userInfoRes.json();

    // Encode user data and redirect to frontend with data in URL
    const userData = encodeURIComponent(JSON.stringify({
      name: googleUser.name,
      email: googleUser.email,
      avatar: googleUser.picture,
      isGoogleAuth: true,
    }));

    const redirectUrl = new URL('/', req.url);
    redirectUrl.searchParams.set('google_data', userData);
    return NextResponse.redirect(redirectUrl);
  } catch (err) {
    console.error('Google callback error:', err);
    const redirectUrl = new URL('/', req.url);
    redirectUrl.searchParams.set('google_error', 'server_error');
    return NextResponse.redirect(redirectUrl);
  }
}
