'use client';

import { ReactNode } from 'react';
import { GoogleOAuthProvider } from "@react-oauth/google";
import { ThemeProvider } from 'next-themes';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
      <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''}>
        {children}
      </GoogleOAuthProvider>
    </ThemeProvider>
  );
}
