import './globals.css'; // Assuming this exists and is needed for global styles
import { AuthProvider } from '@/context/AuthContext'; // Adjust path if necessary
import { Providers } from './providers'; // Import the new Providers component

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  console.log('RootLayout rendering');
  return (
    <html lang="en">
      <body>
        <Providers> {/* Wrap AuthProvider with Providers */}
          <AuthProvider>
            {children}
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
