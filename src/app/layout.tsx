import type { Metadata } from 'next'
import { Cinzel, Sarabun } from 'next/font/google'
import './globals.css'
import Sidebar from '@/components/Sidebar'
import BottomNav from '@/components/BottomNav'

const cinzel = Cinzel({
  subsets: ['latin'],
  variable: '--font-cinzel',
})

const sarabun = Sarabun({
  subsets: ['thai', 'latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-sarabun',
})

export const metadata: Metadata = {
  title: 'Legendary Poker Tracker',
  description: 'Legendary Secrets Poker Club',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="th" className={`${cinzel.variable} ${sarabun.variable}`}>
      <body className="bg-[#0a0804] font-[family-name:var(--font-sarabun)] text-white antialiased">
        {children}
      </body>
    </html>
  )
}