import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Users } from 'lucide-react'

async function fetchAllResults(supabase: any) {
  const pageSize = 1000
  let page = 0
  let allResults: any[] = []
  while (true) {
    const { data } = await supabase
      .from('session_results')
      .select('session_id, user_id, buy_in_chips, cash_out_chips, profiles(display_name)')
      .range(page * pageSize, (page + 1) * pageSize - 1)
    if (!data || data.length === 0) break
    allResults = [...allResults, ...data]
    if (data.length < pageSize) break
    page++
  }
  return allResults
}

export default async function PlayersPage() {
  const supabase = await createClient()

  const { data: sessions } = await supabase
    .from('sessions')
    .select('id, chip_rate, baht_rate')
    .range(0, 999)

  const results = await fetchAllResults(supabase)

  // session rate map
  const sessionRateMap = new Map<string, { chipRate: number; bahtRate: number }>()
  for (const s of (sessions ?? [])) {
    sessionRateMap.set(s.id, { chipRate: s.chip_rate ?? 1000, bahtRate: s.baht_rate ?? 200 })
  }

  // คำนวณ profit ต่อ session
  const map = new Map<string, { name: string; sessions: number; profitBaht: number; wins: number; losses: number }>()
  for (const r of results) {
    const name = r.profiles?.display_name ?? 'Unknown'
    const { chipRate, bahtRate } = sessionRateMap.get(r.session_id) ?? { chipRate: 1000, bahtRate: 200 }
    const profitChips = r.cash_out_chips - r.buy_in_chips
    const profitBaht = Math.round((profitChips / chipRate) * bahtRate)
    const prev = map.get(r.user_id) ?? { name, sessions: 0, profitBaht: 0, wins: 0, losses: 0 }
    map.set(r.user_id, {
      ...prev,
      sessions: prev.sessions + 1,
      profitBaht: prev.profitBaht + profitBaht,
      wins: prev.wins + (profitChips > 0 ? 1 : 0),
      losses: prev.losses + (profitChips < 0 ? 1 : 0),
    })
  }

  // medals per session
  const sessionResults = new Map<string, { userId: string; profitChips: number }[]>()
  for (const r of results) {
    const arr = sessionResults.get(r.session_id) ?? []
    arr.push({ userId: r.user_id, profitChips: r.cash_out_chips - r.buy_in_chips })
    sessionResults.set(r.session_id, arr)
  }
  const medalMap = new Map<string, { gold: number; silver: number; bronze: number }>()
  for (const [, arr] of sessionResults) {
    const sorted = [...arr].sort((a, b) => b.profitChips - a.profitChips)
    sorted.forEach(({ userId }, i) => {
      const prev = medalMap.get(userId) ?? { gold: 0, silver: 0, bronze: 0 }
      if (i === 0) medalMap.set(userId, { ...prev, gold: prev.gold + 1 })
      else if (i === 1) medalMap.set(userId, { ...prev, silver: prev.silver + 1 })
      else if (i === 2) medalMap.set(userId, { ...prev, bronze: prev.bronze + 1 })
    })
  }

  const players = Array.from(map.entries())
    .map(([id, p]) => ({
      id, ...p,
      winRate: p.sessions > 0 ? Math.round((p.wins / p.sessions) * 100) : 0,
      medals: medalMap.get(id) ?? { gold: 0, silver: 0, bronze: 0 },
    }))
    .sort((a, b) => b.profitBaht - a.profitBaht)

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="font-[family-name:var(--font-cinzel)] text-2xl text-[#c9a227] font-semibold flex items-center gap-2">
        <Users size={22} /> Players
      </h1>
      <div className="space-y-2">
        {players.map(({ id, name, sessions, winRate, profitBaht, medals: m }, i) => (
          <Link key={id} href={`/players/${id}`}
            className="flex items-center gap-4 bg-[#111008] border border-[#2a2010] rounded-xl px-4 py-3.5 hover:border-[#c9a227]/30 transition-colors">
            <div className="w-10 h-10 rounded-full bg-[#2a2010] flex items-center justify-center text-lg">
              {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : <span className="text-white/30 text-sm">{i + 1}</span>}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white/90 font-medium">{name}</p>
              <p className="text-white/30 text-xs">{sessions} เซสชั่น · Win rate {winRate}%</p>
            </div>
            <div className="flex gap-1.5 items-center">
              {m.gold > 0 && <span className="text-xs bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded-full">🥇{m.gold}</span>}
              {m.silver > 0 && <span className="text-xs bg-gray-400/20 text-gray-300 px-1.5 py-0.5 rounded-full">🥈{m.silver}</span>}
              {m.bronze > 0 && <span className="text-xs bg-orange-700/20 text-orange-400 px-1.5 py-0.5 rounded-full">🥉{m.bronze}</span>}
            </div>
            <span className={`text-sm font-semibold min-w-[80px] text-right ${profitBaht >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {profitBaht >= 0 ? '+' : ''}{profitBaht.toLocaleString('th-TH')} ฿
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
