'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Trophy, CalendarDays, Coins, Settings } from 'lucide-react'

const navItems = [
  { href: '/',            label: 'หน้าหลัก', icon: LayoutDashboard },
  { href: '/leaderboard', label: 'อันดับ',   icon: Trophy },
  { href: '/sessions',    label: 'Sessions', icon: CalendarDays },
  { href: '/pot',         label: 'กองกลาง', icon: Coins },
  { href: '/settings',    label: 'ตั้งค่า',  icon: Settings },
]

export default function BottomNav() {
  const pathname = usePathname()
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#111008] border-t border-[#2a2010]">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href))
          return (
            <Link key={href} href={href} className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-all duration-150 min-w-[52px] ${active ? 'text-[#c9a227]' : 'text-white/40'}`}>
              <Icon size={20} strokeWidth={active ? 2 : 1.5} />
              <span className="text-[10px] leading-none">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
