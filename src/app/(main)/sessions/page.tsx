import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { CalendarDays, Plus } from 'lucide-react'

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default async function SessionsPage() {
  const supabase = await createClient()

  const { data: sessions } = await supabase
    .from('sessions')
    .select('id, session_number, year, season, played_at, shared_fee, chip_rate, baht_rate')
    .order('played_at', { ascending: false })

  const { data: results } = await supabase
    .from('session_results')
    .select('session_id, user_id, buy_in_chips, cash_out_chips, profiles(display_name)')

  const resultsBySession = new Map<string, typeof results>()
  for (const r of (results ?? [])) {
    const arr = resultsBySession.get(r.session_id) ?? []
    arr.push(r)
    resultsBySession.set(r.session_id, arr)
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-[family-name:var(--font-cinzel)] text-2xl text-[#c9a227] font-semibold flex items-center gap-2">
          <CalendarDays size={22} /> Sessions
        </h1>
        <Link href="/sessions/new"
          className="flex items-center gap-2 bg-[#c9a227] text-black text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#e0b82e] transition-colors">
          <Plus size={16} /> บันทึกเซส
        </Link>
      </div>

      <div className="space-y-2">
        {(sessions ?? []).map(s => {
          const sResults = resultsBySession.get(s.id) ?? []
          const chipRate = s.chip_rate ?? 1000
          const bahtRate = s.baht_rate ?? 200
          const winner = [...sResults].sort((a, b) => (b.cash_out_chips - b.buy_in_chips) - (a.cash_out_chips - a.buy_in_chips))[0]
          const winnerProfit = winner ? Math.round(((winner.cash_out_chips - winner.buy_in_chips) / chipRate) * bahtRate) : 0

          return (
            <Link key={s.id} href={`/sessions/${s.id}`}
              className="flex items-center gap-4 bg-[#111008] border border-[#2a2010] rounded-xl px-4 py-3.5 hover:border-[#c9a227]/30 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-[#2a2010] flex items-center justify-center shrink-0">
                <span className="text-[#c9a227] text-xs font-semibold">#{s.session_number}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white/80 text-sm font-medium">{fmtDate(s.played_at)}</p>
                <p className="text-white/30 text-xs">S{s.season}/{s.year} · {sResults.length} ผู้เล่น{s.shared_fee > 0 ? ` · ส่วนกลาง ฿${s.shared_fee}` : ''}</p>
              </div>
              {winner && (
                <div className="text-right shrink-0">
                  <p className="text-[#c9a227] text-xs">🥇 {winner.profiles?.display_name}</p>
                  <p className="text-green-400 text-sm font-semibold">+{winnerProfit.toLocaleString()} ฿</p>
                </div>
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
