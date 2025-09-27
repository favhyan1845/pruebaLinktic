'use client';

import './globals.css'; // Assuming this exists and is needed for global styles
import { AuthProvider } from '@/context/AuthContext'; // Adjust path if necessary

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
