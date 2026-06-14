import type { Metadata } from 'next'
import { Toaster } from 'react-hot-toast'
import './globals.css'

export const metadata: Metadata = {
  title: 'Ultimate Gig Hub',
  description: 'Earn rewards by completing social media tasks',
  manifest: '/manifest.json',
  themeColor: '#0d1117',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3500,
            style: {
              background: '#161d27',
              color: '#f0f4f8',
              border: '1px solid #232c38',
              borderRadius: '0.75rem',
              fontSize: '0.875rem',
              fontFamily: 'Inter, sans-serif',
            },
            success: {
              iconTheme: { primary: '#22c55e', secondary: '#161d27' },
            },
            error: {
              iconTheme: { primary: '#e53935', secondary: '#161d27' },
            },
          }}
        />
      </body>
    </html>
  )
}
