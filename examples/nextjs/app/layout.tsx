import type { Metadata } from 'next'
import { Fraunces, IBM_Plex_Sans } from 'next/font/google'

import './globals.css'
import { cn } from '@/lib/utils'
import Script from 'next/script'

const bodyFont = IBM_Plex_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '600', '700'],
})

const displayFont = Fraunces({
  subsets: ['latin'],
  variable: '--font-heading',
})

export const metadata: Metadata = {
  title: '@lunarhue/store Next.js Example',
  description:
    'App Router example showing selector-first state with actions and persistence.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={cn(bodyFont.variable, displayFont.variable)}>
      {/* <head>
        <Script
          src="//unpkg.com/react-scan/dist/auto.global.js"
          crossOrigin="anonymous"
          strategy="beforeInteractive"
        />
      </head> */}
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  )
}
