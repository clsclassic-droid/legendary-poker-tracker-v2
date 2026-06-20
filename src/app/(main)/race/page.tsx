'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Play, RotateCcw } from 'lucide-react'

type Session = { id: string; session_number: number; played_at: string; chip_rate: number; baht_rate: number }
type Result = { session_id: string; user_id: string; buy_in_chips: number; cash_out_chips: number; profiles: { display_name: string } | null }

const COLORS = ['#c9a227','#22c55e','#3b82f6','#f97316','#a855f7','#ec4899','#14b8a6','#f59e0b','#64748b','#ef4444','#84cc16','#06b6d4']

export default function RacePage() {
  const supabase = createClient()
  const [sessions, setSessions] = useState<Session[]>([])
  const [results, setResults] = useState<Result[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    loadData()
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [])

  async function loadData() {
    const { data: s } = await supabase
      .from('sessions')
      .select('id, session_number, played_at, chip_rate, baht_rate')
      .order('played_at', { ascending: true })
      .range(0, 999)
    const { data: r } = await supabase
      .from('session_results')
      .select('session_id, user_id, buy_in_chips, cash_out_chips, profiles(display_name)')
      .range(0, 9999)
    setSessions(s ?? [])
    setResults(r ?? [])
  }

  // session rate map
  const sessionRateMap = useRef(new Map<string, { chipRate: number; bahtRate: number }>())
  useEffect(() => {
    const m = new Map<string, { chipRate: number; bahtRate: number }>()
    for (const s of sessions) m.set(s.id, { chipRate: s.chip_rate ?? 1000, bahtRate: s.baht_rate ?? 200 })
    sessionRateMap.current = m
  }, [sessions])

  const getStandings = useCallback((upToIdx: number) => {
    const visibleIds = new Set(sessions.slice(0, upToIdx + 1).map(s => s.id))
    const map = new Map<string, { name: string; profitBaht: number; color: string }>()
    const playerOrder: string[] = []

    for (const r of results.filter(r => visibleIds.has(r.session_id))) {
      if (!map.has(r.user_id)) {
        const name = r.profiles?.display_name ?? 'Unknown'
        map.set(r.user_id, { name, profitBaht: 0, color: COLORS[playerOrder.length % COLORS.length] })
        playerOrder.push(r.user_id)
      }
      const prev = map.get(r.user_id)!
      // ใช้ rate ของ session นั้นๆ ในการแปลง chips → บาท
      const { chipRate, bahtRate } = sessionRateMap.current.get(r.session_id) ?? { chipRate: 1000, bahtRate: 200 }
      const profitChips = r.cash_out_chips - r.buy_in_chips
      const profitBaht = Math.round((profitChips / chipRate) * bahtRate)
      map.set(r.user_id, { ...prev, profitBaht: prev.profitBaht + profitBaht })
    }

    return Array.from(map.entries())
      .map(([id, p]) => ({ id, ...p }))
      .sort((a, b) => b.profitBaht - a.profitBaht)
  }, [sessions, results])

  const standings = getStandings(currentIdx)
  const maxAbs = Math.max(...standings.map(s => Math.abs(s.profitBaht)), 1)

  function togglePlay() {
    if (playing) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      setPlaying(false)
    } else {
      if (currentIdx >= sessions.length - 1) setCurrentIdx(0)
      setPlaying(true)
      intervalRef.current = setInterval(() => {
        setCurrentIdx(prev => {
          if (prev >= sessions.length - 1) {
            clearInterval(intervalRef.current!)
            setPlaying(false)
            return prev
          }
          return prev + 1
        })
      }, 1000 / speed)
    }
  }

  function handleReset() {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setPlaying(false)
    setCurrentIdx(0)
  }

  function handleSpeedChange(s: number) {
    setSpeed(s)
    if (playing && intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = setInterval(() => {
        setCurrentIdx(prev => {
          if (prev >= sessions.length - 1) { clearInterval(intervalRef.current!); setPlaying(false); return prev }
          return prev + 1
        })
      }, 1000 / s)
    }
  }

  const currentSession = sessions[currentIdx]

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-cinzel)] text-2xl text-[#c9a227] font-semibold">🏎️ Ranking Race</h1>
          <p className="text-white/40 text-sm mt-0.5">กำไรสะสมแต่ละเซส</p>
        </div>
        <div className="bg-[#c9a227]/10 border border-[#c9a227]/30 rounded-lg px-3 py-1.5 text-[#c9a227] text-sm font-semibold">
          เซส {currentSession?.session_number ?? 0} / {sessions.length}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <button onClick={togglePlay}
          className="flex items-center gap-2 bg-[#c9a227] text-black font-semibold px-5 py-2 rounded-lg hover:bg-[#e0b82e] transition-colors">
          {playing ? '⏸ Pause' : <><Play size={16} /> Play</>}
        </button>
        <button onClick={handleReset}
          className="flex items-center gap-2 bg-[#2a2010] text-white/60 px-4 py-2 rounded-lg hover:text-white transition-colors">
          <RotateCcw size={16} /> Reset
        </button>
        <div className="ml-auto flex items-center gap-2 text-white/40 text-sm">
          ความเร็ว:
          {[1, 2, 4].map(s => (
            <button key={s} onClick={() => handleSpeedChange(s)}
              className={`px-3 py-1 rounded-lg text-sm transition-all ${speed === s ? 'bg-[#c9a227]/20 text-[#c9a227]' : 'hover:text-white/70'}`}>
              {s}×
            </button>
          ))}
        </div>
      </div>

      {/* Slider */}
      <div className="flex items-center gap-3">
        <span className="text-white/30 text-xs">เซส 1</span>
        <input type="range" min={0} max={Math.max(0, sessions.length - 1)} value={currentIdx}
          onChange={e => { if (!playing) setCurrentIdx(Number(e.target.value)) }}
          className="flex-1 accent-[#c9a227]" />
        <span className="text-white/30 text-xs">เซส {sessions.length}</span>
      </div>

      {/* Bars */}
      <div className="bg-[#111008] border border-[#2a2010] rounded-xl p-5 space-y-3">
        {standings.map(({ id, name, profitBaht, color }) => {
          const pct = Math.abs(profitBaht) / maxAbs * 100
          const positive = profitBaht >= 0
          return (
            <div key={id} className="flex items-center gap-3">
              <span className="w-16 text-right text-sm font-medium shrink-0" style={{ color }}>{name}</span>
              <div className="flex-1 relative h-8 flex items-center">
                <div className="absolute inset-y-0 left-1/2 w-px bg-[#2a2010]" />
                {positive ? (
                  <div className="absolute left-1/2 h-6 rounded-r-full transition-all duration-500"
                    style={{ width: `${pct / 2}%`, backgroundColor: color + '80', borderLeft: `2px solid ${color}` }} />
                ) : (
                  <div className="absolute right-1/2 h-6 rounded-l-full transition-all duration-500"
                    style={{ width: `${pct / 2}%`, backgroundColor: '#ef444440', borderRight: '2px solid #ef4444' }} />
                )}
                <span className={`absolute text-xs font-semibold transition-all duration-500 ${positive ? 'left-1/2 ml-1 pl-1' : 'right-1/2 mr-1 pr-1 text-right'}`}
                  style={{ color: positive ? color : '#ef4444' }}>
                  {positive ? '+' : ''}{profitBaht.toLocaleString()} ฿
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {currentSession && (
        <p className="text-white/20 text-xs text-center">
          {new Date(currentSession.played_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      )}
    </div>
  )
}
