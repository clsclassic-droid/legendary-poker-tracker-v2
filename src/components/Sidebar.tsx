'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  LayoutDashboard, Trophy, Users, CalendarDays,
  PlusCircle, Coins, Settings, LogOut, Swords,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const navItems = [
  { href: '/',            label: 'Dashboard',   icon: LayoutDashboard },
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/players',     label: 'Players',     icon: Users },
  { href: '/sessions',    label: 'Sessions',    icon: CalendarDays },
  { href: '/sessions/new',label: 'บันทึกเซส',  icon: PlusCircle },
  { href: '/pot',         label: 'กองกลาง',     icon: Coins },
  { href: '/race',        label: 'Ranking Race', icon: Swords },
  { href: '/settings',   label: 'ตั้งค่า',      icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="hidden md:flex flex-col w-60 min-h-screen bg-[#111008] border-r border-[#2a2010] fixed left-0 top-0 z-40">
      <div className="flex items-center gap-3 px-5 py-6 border-b border-[#2a2010]">
        <Image
          src="https://raw.githubusercontent.com/clsclassic-droid/Legendary-Poker-Tracker/main/src/f512d9a54b54e5e327ac49c65c60695a.jpeg"
          alt="Legendary Secrets" width={36} height={36}
          className="rounded-full ring-1 ring-[#c9a227]/40"
        />
        <div>
          <p className="font-[family-name:var(--font-cinzel)] text-[#c9a227] text-sm font-semibold leading-tight">Legendary</p>
          <p className="text-white/40 text-xs leading-tight">Poker Tracker</p>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href))
          return (
            <Link key={href} href={href} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 ${active ? 'bg-[#c9a227]/15 text-[#c9a227] font-medium' : 'text-white/50 hover:text-white/80 hover:bg-white/5'}`}>
              <Icon size={18} strokeWidth={active ? 2 : 1.5} />
              <span>{label}</span>
              {active && <span className="ml-auto w-1 h-4 rounded-full bg-[#c9a227]" />}
            </Link>
          )
        })}
      </nav>
      <div className="px-3 py-4 border-t border-[#2a2010] space-y-1">
        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/40 hover:text-red-400 hover:bg-red-400/5 transition-all duration-150">
          <LogOut size={18} strokeWidth={1.5} />
          <span>ออกจากระบบ</span>
        </button>
        <p className="text-white/20 text-xs px-3">v2.0 · Legendary Secrets</p>
      </div>
    </aside>
  )
}
