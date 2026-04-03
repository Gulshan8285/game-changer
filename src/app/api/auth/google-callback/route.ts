import { NextResponse } from 'next/server';

export async function GET() {
  // This page is loaded inside a Google OAuth popup after authentication.
  // It reads the access_token from the URL hash and sends it to the parent via postMessage.
  const html = `<!DOCTYPE html>
<html><head><title>Google Sign In</title></head><body>
<script>
try {
  var hash = window.location.hash.substring(1);
  var params = new URLSearchParams(hash);
  var accessToken = params.get('access_token');
  var error = params.get('error');
  var errorDesc = params.get('error_description') || '';
  if (window.opener) {
    window.opener.postMessage({
      type: 'google-oauth',
      access_token: accessToken,
      error: error,
      error_description: errorDesc
    }, window.location.origin);
  }
} catch(e) {}
window.close();
setTimeout(function(){ window.close(); }, 2000);
</script>
<p style="text-align:center;padding:40px;font-family:sans-serif;color:#666;">Completing sign-in... You can close this window.</p>
</body></html>`;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
      'Cache-Control': 'no-store',
    },
  });
}
