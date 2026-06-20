import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default async function SessionDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const { data: session } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!session) notFound()

  const { data: results } = await supabase
    .from('session_results')
    .select('user_id, buy_in_chips, cash_out_chips, profiles(display_name)')
    .eq('session_id', params.id)

  const chipRate = session.chip_rate ?? 1000
  const bahtRate = session.baht_rate ?? 200

  const rows = (results ?? [])
    .map(r => ({
      name: r.profiles?.display_name ?? 'Unknown',
      buyIn: r.buy_in_chips,
      cashOut: r.cash_out_chips,
      buyInBaht: Math.round((r.buy_in_chips / chipRate) * bahtRate),
      cashOutBaht: Math.round((r.cash_out_chips / chipRate) * bahtRate),
      profitBaht: Math.round(((r.cash_out_chips - r.buy_in_chips) / chipRate) * bahtRate),
    }))
    .sort((a, b) => b.profitBaht - a.profitBaht)

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/sessions" className="text-white/40 hover:text-white/70 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="font-[family-name:var(--font-cinzel)] text-2xl text-[#c9a227] font-semibold">
            เซสชั่น #{session.session_number}
          </h1>
          <p className="text-white/40 text-sm">{fmtDate(session.played_at)} · S{session.season}/{session.year}</p>
        </div>
      </div>

      {/* Session info */}
      <div className="flex gap-3 flex-wrap">
        <div className="bg-[#111008] border border-[#2a2010] rounded-lg px-4 py-2.5 text-center">
          <p className="text-white/30 text-xs">อัตราแลก</p>
          <p className="text-[#c9a227] text-sm font-semibold">{chipRate.toLocaleString()} ชิป = {bahtRate} ฿</p>
        </div>
        {session.shared_fee > 0 && (
          <div className="bg-[#111008] border border-[#2a2010] rounded-lg px-4 py-2.5 text-center">
            <p className="text-white/30 text-xs">ค่าส่วนกลาง</p>
            <p className="text-white/70 text-sm font-semibold">{session.shared_fee} ฿/คน</p>
          </div>
        )}
        <div className="bg-[#111008] border border-[#2a2010] rounded-lg px-4 py-2.5 text-center">
          <p className="text-white/30 text-xs">ผู้เล่น</p>
          <p className="text-white/70 text-sm font-semibold">{rows.length} คน</p>
        </div>
        {session.notes && (
          <div className="bg-[#111008] border border-[#2a2010] rounded-lg px-4 py-2.5">
            <p className="text-white/30 text-xs">หมายเหตุ</p>
            <p className="text-white/60 text-sm">{session.notes}</p>
          </div>
        )}
      </div>

      {/* Results table */}
      <div className="bg-[#111008] border border-[#2a2010] rounded-xl overflow-hidden">
        <div className="grid grid-cols-[2rem_1fr_5rem_5rem_5rem_6rem] gap-2 px-4 py-2.5 border-b border-[#2a2010] text-white/30 text-xs">
          <span>#</span>
          <span>ผู้เล่น</span>
          <span className="text-right">ซื้อ(ชิป)</span>
          <span className="text-right">แลก(ชิป)</span>
          <span className="text-right">แลก(฿)</span>
          <span className="text-right">กำไร(฿)</span>
        </div>
        {rows.map(({ name, buyIn, cashOut, cashOutBaht, profitBaht }, i) => (
          <div key={name} className="grid grid-cols-[2rem_1fr_5rem_5rem_5rem_6rem] gap-2 px-4 py-3 items-center border-b border-[#2a2010]/50 last:border-0 hover:bg-white/5">
            <span className="text-center text-sm">
              {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : <span className="text-white/30">{i + 1}</span>}
            </span>
            <span className="text-white/80 text-sm">{name}</span>
            <span className="text-white/40 text-xs text-right">{buyIn.toLocaleString()}</span>
            <span className="text-white/40 text-xs text-right">{cashOut.toLocaleString()}</span>
            <span className="text-white/60 text-xs text-right">{cashOutBaht.toLocaleString()}</span>
            <span className={`text-sm font-semibold text-right ${profitBaht >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {profitBaht >= 0 ? '+' : ''}{profitBaht.toLocaleString()} ฿
            </span>
          </div>
        ))}
        <div className="px-4 py-2.5 border-t border-[#2a2010] flex justify-between text-xs text-white/30">
          <span>ยอดซื้อรวม: {rows.reduce((s, r) => s + r.buyInBaht, 0).toLocaleString()} ฿</span>
          <span>ยอดแลกรวม: {rows.reduce((s, r) => s + r.cashOutBaht, 0).toLocaleString()} ฿</span>
        </div>
      </div>
    </div>
  )
}
