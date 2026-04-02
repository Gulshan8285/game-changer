'use client';

import { ReactNode } from 'react';
import { GoogleOAuthProvider } from "@react-oauth/google";
import { ThemeProvider } from 'next-themes';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
      <GoogleOAuthProvider clientId="743589348670-mpst3nvgpns0pf1fbbso248gbkuv98ie.apps.googleusercontent.com">
        {children}
      </GoogleOAuthProvider>
    </ThemeProvider>
  );
}
