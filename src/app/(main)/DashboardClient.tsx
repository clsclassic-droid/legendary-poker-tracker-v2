'use client'

import { useState, useMemo } from 'react'
import { Trophy, CalendarDays, Coins, Users } from 'lucide-react'

type Session = {
  id: string
  session_number: number
  year: number
  season: number
  played_at: string
  shared_fee: number
  chip_rate: number
  baht_rate: number
}

type Result = {
  session_id: string
  user_id: string
  buy_in_chips: number
  cash_out_chips: number
  profiles: { display_name: string } | null
}

type Props = {
  sessions: Session[]
  results: Result[]
  potBalance: number
}

type Filter = 'season' | 'year' | 'all'

const medals = ['🥇', '🥈', '🥉']

function fmt(n: number) {
  return (n >= 0 ? '+' : '') + n.toLocaleString('th-TH') + ' ฿'
}

function fmtDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })
}

// แปลง chips → บาท โดยใช้ rate ของแต่ละ session
function chipsToBaht(chips: number, chipRate: number, bahtRate: number): number {
  if (!chipRate) return 0
  return Math.round((chips / chipRate) * bahtRate)
}

export default function DashboardClient({ sessions, results, potBalance }: Props) {
  const [filter, setFilter] = useState<Filter>('season')

  // session map สำหรับ lookup rate
  const sessionMap = useMemo(() => {
    const m = new Map<string, Session>()
    for (const s of sessions) m.set(s.id, s)
    return m
  }, [sessions])

  const latestSession = sessions[0]
  const currentYear = latestSession?.year ?? new Date().getFullYear()
  const currentSeason = latestSession?.season ?? Math.ceil((new Date().getMonth() + 1) / 3)

  const filteredSessions = useMemo(() => {
    if (filter === 'season') return sessions.filter(s => s.year === currentYear && s.season === currentSeason)
    if (filter === 'year')   return sessions.filter(s => s.year === currentYear)
    return sessions
  }, [sessions, filter, currentYear, currentSeason])

  const filteredSessionIds = useMemo(
    () => new Set(filteredSessions.map(s => s.id)),
    [filteredSessions]
  )

  const filteredResults = useMemo(
    () => results.filter(r => filteredSessionIds.has(r.session_id)),
    [results, filteredSessionIds]
  )

  const leaderboard = useMemo(() => {
    const map = new Map<string, { name: string; sessions: number; profitBaht: number; profitChips: number }>()
    for (const r of filteredResults) {
      const session = sessionMap.get(r.session_id)
      const chipRate = session?.chip_rate ?? 1000
      const bahtRate = session?.baht_rate ?? 200
      const profitChips = r.cash_out_chips - r.buy_in_chips
      const profitBaht = chipsToBaht(profitChips, chipRate, bahtRate)
      const name = r.profiles?.display_name ?? 'Unknown'
      const prev = map.get(r.user_id) ?? { name, sessions: 0, profitBaht: 0, profitChips: 0 }
      map.set(r.user_id, {
        name,
        sessions: prev.sessions + 1,
        profitBaht: prev.profitBaht + profitBaht,
        profitChips: prev.profitChips + profitChips,
      })
    }
    return Array.from(map.values()).sort((a, b) => b.profitBaht - a.profitBaht)
  }, [filteredResults, sessionMap])

  const leader = leaderboard[0]
  const top5 = leaderboard.slice(0, 5)

  const uniquePlayers = useMemo(
    () => new Set(filteredResults.map(r => r.user_id)).size,
    [filteredResults]
  )

  const recentSessions = useMemo(() => {
    return filteredSessions.slice(0, 5).map(s => ({
      ...s,
      players: results.filter(r => r.session_id === s.id).length,
    }))
  }, [filteredSessions, results])

  const filterLabel = {
    season: `ซีซั่น ${currentSeason} ปี ${currentYear}`,
    year:   `ปี ${currentYear}`,
    all:    'ตลอดกาล',
  }[filter]

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-cinzel)] text-2xl text-[#c9a227] font-semibold">Dashboard</h1>
          <p className="text-white/40 text-sm mt-0.5">Legendary Secrets Poker Club · {filterLabel}</p>
        </div>
        {latestSession && (
          <div className="text-right">
            <p className="text-white/30 text-xs">เซสชั่นล่าสุด</p>
            <p className="text-white/70 text-sm font-medium">#{latestSession.session_number} · {fmtDate(latestSession.played_at)}</p>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 p-1 bg-[#111008] border border-[#2a2010] rounded-xl w-fit">
        {(['season', 'year', 'all'] as Filter[]).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${filter === f ? 'bg-[#c9a227] text-black' : 'text-white/40 hover:text-white/70'}`}>
            {{ season: 'ซีซั่นนี้', year: 'ปีนี้', all: 'ตลอดกาล' }[f]}
          </button>
        ))}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'เซสชั่น',  value: filteredSessions.length.toString(),          icon: CalendarDays },
          { label: 'ผู้เล่น',  value: uniquePlayers.toString(),                     icon: Users },
          { label: 'กองกลาง', value: `฿${potBalance.toLocaleString('th-TH')}`,     icon: Coins },
          { label: 'อันดับ 1', value: leader?.name ?? '-',                          icon: Trophy },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-[#111008] border border-[#2a2010] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon size={14} className="text-[#c9a227]/60" />
              <p className="text-white/40 text-xs">{label}</p>
            </div>
            <p className="text-white font-semibold text-lg leading-none">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {/* Leader card */}
        {leader && (
          <div className="md:col-span-1 bg-[#111008] border border-[#c9a227]/30 rounded-xl p-5 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#c9a227]/5 to-transparent pointer-events-none" />
            <p className="text-[#c9a227]/60 text-xs mb-3 font-medium tracking-wider uppercase">อันดับ 1 · {filterLabel}</p>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-[#c9a227]/20 flex items-center justify-center text-xl">🥇</div>
              <div>
                <p className="font-[family-name:var(--font-cinzel)] text-white text-lg font-semibold">{leader.name}</p>
                <p className="text-white/40 text-xs">{leader.sessions} เซสชั่น</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-white/40 text-sm">กำไรรวม</span>
                <span className={leader.profitBaht >= 0 ? 'text-green-400 font-semibold' : 'text-red-400 font-semibold'}>{fmt(leader.profitBaht)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/40 text-sm">Chips</span>
                <span className="text-white/60 font-medium">{leader.profitChips >= 0 ? '+' : ''}{leader.profitChips.toLocaleString('th-TH')}</span>
              </div>
            </div>
          </div>
        )}

        {/* Leaderboard top 5 */}
        <div className={`${leader ? 'md:col-span-2' : 'md:col-span-3'} bg-[#111008] border border-[#2a2010] rounded-xl p-5`}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-white/70 text-sm font-medium">อันดับผู้เล่น</p>
            <a href="/leaderboard" className="text-[#c9a227]/60 text-xs hover:text-[#c9a227] transition-colors">ดูทั้งหมด →</a>
          </div>
          {top5.length === 0 ? (
            <p className="text-white/30 text-sm text-center py-4">ไม่มีข้อมูล</p>
          ) : (
            <div className="space-y-2">
              {top5.map(({ name, sessions, profitBaht }, i) => (
                <div key={name} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-white/5 transition-colors">
                  <span className="w-6 text-center text-sm">{i < 3 ? medals[i] : <span className="text-white/30">{i + 1}</span>}</span>
                  <span className="flex-1 text-white/80 text-sm">{name}</span>
                  <span className="text-white/30 text-xs">{sessions} เซส</span>
                  <span className={`text-sm font-medium min-w-[80px] text-right ${profitBaht >= 0 ? 'text-green-400' : 'text-red-400'}`}>{fmt(profitBaht)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent sessions */}
      <div className="bg-[#111008] border border-[#2a2010] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-white/70 text-sm font-medium">เซสชั่นล่าสุด</p>
          <a href="/sessions" className="text-[#c9a227]/60 text-xs hover:text-[#c9a227] transition-colors">ดูทั้งหมด →</a>
        </div>
        {recentSessions.length === 0 ? (
          <p className="text-white/30 text-sm text-center py-4">ไม่มีข้อมูล</p>
        ) : (
          <div className="space-y-2">
            {recentSessions.map(s => (
              <div key={s.id} className="flex items-center gap-4 py-2.5 px-3 rounded-lg hover:bg-white/5 transition-colors cursor-pointer">
                <div className="w-10 h-10 rounded-lg bg-[#2a2010] flex items-center justify-center">
                  <span className="text-[#c9a227] text-xs font-semibold">#{s.session_number}</span>
                </div>
                <div className="flex-1">
                  <p className="text-white/70 text-sm">{fmtDate(s.played_at)}</p>
                  <p className="text-white/30 text-xs">S{s.season} · {s.players} ผู้เล่น</p>
                </div>
                <div className="text-right">
                  <p className="text-white/30 text-xs">ค่าส่วนกลาง</p>
                  <p className="text-[#c9a227] text-sm font-medium">{s.shared_fee > 0 ? `฿${s.shared_fee.toLocaleString()}` : '-'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
