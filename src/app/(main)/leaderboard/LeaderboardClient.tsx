'use client'

import { useState, useMemo } from 'react'
import { Trophy } from 'lucide-react'

type Session = { id: string; year: number; season: number; chip_rate: number; baht_rate: number; played_at: string }
type Result = { session_id: string; user_id: string; buy_in_chips: number; cash_out_chips: number; profiles: { display_name: string } | null }
type Filter = 'season' | 'year' | 'all'

const medals = ['🥇', '🥈', '🥉']
function fmt(n: number) { return (n >= 0 ? '+' : '') + n.toLocaleString('th-TH') + ' ฿' }

export default function LeaderboardClient({ sessions, results }: { sessions: Session[]; results: Result[] }) {
  const [filter, setFilter] = useState<Filter>('season')
  const latest = sessions.slice().sort((a, b) => new Date(b.played_at).getTime() - new Date(a.played_at).getTime())[0]
  const currentYear = latest?.year ?? new Date().getFullYear()
  const currentSeason = latest?.season ?? 1

  // session rate map
  const sessionRateMap = useMemo(() => {
    const m = new Map<string, { chipRate: number; bahtRate: number }>()
    for (const s of sessions) m.set(s.id, { chipRate: s.chip_rate ?? 1000, bahtRate: s.baht_rate ?? 200 })
    return m
  }, [sessions])

  const filteredIds = useMemo(() => {
    const s = filter === 'season' ? sessions.filter(s => s.year === currentYear && s.season === currentSeason)
            : filter === 'year'   ? sessions.filter(s => s.year === currentYear)
            : sessions
    return new Set(s.map(s => s.id))
  }, [sessions, filter, currentYear, currentSeason])

  const leaderboard = useMemo(() => {
    const map = new Map<string, { name: string; sessions: number; profitBaht: number; wins: number; losses: number }>()
    for (const r of results.filter(r => filteredIds.has(r.session_id))) {
      const name = r.profiles?.display_name ?? 'Unknown'
      const { chipRate, bahtRate } = sessionRateMap.get(r.session_id) ?? { chipRate: 1000, bahtRate: 200 }
      const profitChips = r.cash_out_chips - r.buy_in_chips
      const profitBaht = Math.round((profitChips / chipRate) * bahtRate)
      const prev = map.get(r.user_id) ?? { name, sessions: 0, profitBaht: 0, wins: 0, losses: 0 }
      map.set(r.user_id, {
        name,
        sessions: prev.sessions + 1,
        profitBaht: prev.profitBaht + profitBaht,
        wins: prev.wins + (profitChips > 0 ? 1 : 0),
        losses: prev.losses + (profitChips < 0 ? 1 : 0),
      })
    }
    return Array.from(map.values())
      .map(p => ({ ...p, winRate: p.sessions > 0 ? Math.round((p.wins / p.sessions) * 100) : 0 }))
      .sort((a, b) => b.profitBaht - a.profitBaht)
  }, [results, filteredIds, sessionRateMap])

  const filterLabel = { season: `ซีซั่น ${currentSeason} ปี ${currentYear}`, year: `ปี ${currentYear}`, all: 'ตลอดกาล' }[filter]

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-cinzel)] text-2xl text-[#c9a227] font-semibold flex items-center gap-2">
            <Trophy size={22} /> Leaderboard
          </h1>
          <p className="text-white/40 text-sm mt-0.5">{filterLabel}</p>
        </div>
      </div>

      <div className="flex gap-1 p-1 bg-[#111008] border border-[#2a2010] rounded-xl w-fit">
        {(['season', 'year', 'all'] as Filter[]).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${filter === f ? 'bg-[#c9a227] text-black' : 'text-white/40 hover:text-white/70'}`}>
            {{ season: 'ซีซั่นนี้', year: 'ปีนี้', all: 'ตลอดกาล' }[f]}
          </button>
        ))}
      </div>

      <div className="bg-[#111008] border border-[#2a2010] rounded-xl overflow-hidden">
        <div className="grid grid-cols-[2rem_1fr_5rem_5rem_6rem] gap-2 px-4 py-2.5 border-b border-[#2a2010] text-white/30 text-xs">
          <span>#</span><span>ผู้เล่น</span><span className="text-right">เซส</span><span className="text-right">Win%</span><span className="text-right">กำไร</span>
        </div>
        {leaderboard.length === 0 ? (
          <p className="text-white/30 text-sm text-center py-8">ไม่มีข้อมูล</p>
        ) : leaderboard.map(({ name, sessions, winRate, profitBaht }, i) => (
          <div key={name} className={`grid grid-cols-[2rem_1fr_5rem_5rem_6rem] gap-2 px-4 py-3 items-center border-b border-[#2a2010]/50 last:border-0 hover:bg-white/5 transition-colors ${i === 0 ? 'bg-[#c9a227]/5' : ''}`}>
            <span className="text-center">{i < 3 ? medals[i] : <span className="text-white/30 text-sm">{i + 1}</span>}</span>
            <span className={`text-sm font-medium ${i === 0 ? 'text-[#c9a227]' : 'text-white/80'}`}>{name}</span>
            <span className="text-white/40 text-xs text-right">{sessions}</span>
            <span className="text-white/50 text-xs text-right">{winRate}%</span>
            <span className={`text-sm font-semibold text-right ${profitBaht >= 0 ? 'text-green-400' : 'text-red-400'}`}>{fmt(profitBaht)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
