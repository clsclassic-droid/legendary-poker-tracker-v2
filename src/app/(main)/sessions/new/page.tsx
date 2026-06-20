'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { PlusCircle, Minus, Plus } from 'lucide-react'

type Player = { id: string; display_name: string }

function getSeason(month: number) { return Math.ceil((month + 1) / 3) }

export default function NewSessionPage() {
  const supabase = createClient()
  const router = useRouter()
  const [clubId, setClubId] = useState('')
  const [players, setPlayers] = useState<Player[]>([])
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [chipRate, setChipRate] = useState(1000)
  const [bahtRate, setBahtRate] = useState(200)
  const [fee, setFee] = useState(100)
  const [sessionNo, setSessionNo] = useState(1)
  const [note, setNote] = useState('')
  const [entries, setEntries] = useState<Record<string, { buyIn: string; cashOut: string }>>({})
  const [inputMode, setInputMode] = useState<'chips' | 'baht'>('chips')
  const [saving, setSaving] = useState(false)

  const d = new Date(date)
  const year = d.getFullYear()
  const season = getSeason(d.getMonth())

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: club } = await supabase.from('clubs').select('id').single()
    if (!club) return
    setClubId(club.id)
    const { data: members } = await supabase.from('club_members').select('profiles(id, display_name)').eq('club_id', club.id)
    const ps: Player[] = (members ?? []).map((m: any) => m.profiles).filter(Boolean)
    setPlayers(ps)
    const init: Record<string, { buyIn: string; cashOut: string }> = {}
    ps.forEach(p => { init[p.id] = { buyIn: '', cashOut: '' } })
    setEntries(init)
    const { data: lastSession } = await supabase.from('sessions').select('session_number, year, season').eq('club_id', club.id).order('played_at', { ascending: false }).limit(1).single()
    if (lastSession) setSessionNo(lastSession.session_number + 1)
  }

  function toChips(val: string) {
    if (!val) return 0
    return inputMode === 'chips' ? Number(val) : Math.round((Number(val) / bahtRate) * chipRate)
  }

  const totalBuyIn = Object.values(entries).reduce((s, e) => s + toChips(e.buyIn), 0)
  const totalCashOut = Object.values(entries).reduce((s, e) => s + toChips(e.cashOut), 0)
  const balanced = totalBuyIn === totalCashOut

  async function handleSave() {
    if (!clubId || !balanced) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()

    const { data: session, error } = await supabase.from('sessions').insert({
      club_id: clubId,
      played_at: date,
      year, season,
      session_number: sessionNo,
      shared_fee: fee,
      chip_rate: chipRate,
      notes: note || null,
      created_by: user?.id,
      has_dealer: false,
      dealer_rake: 0,
    }).select('id').single()

    if (error || !session) { setSaving(false); alert('เกิดข้อผิดพลาด: ' + error?.message); return }

    const resultsToInsert = players
      .filter(p => entries[p.id]?.buyIn || entries[p.id]?.cashOut)
      .map(p => ({
        session_id: session.id,
        club_id: clubId,
        user_id: p.id,
        player_name: p.display_name,
        buy_in_chips: toChips(entries[p.id]?.buyIn ?? '0'),
        cash_out_chips: toChips(entries[p.id]?.cashOut ?? '0'),
      }))

    if (resultsToInsert.length > 0) {
      await supabase.from('session_results').insert(resultsToInsert)
    }

    // เพิ่ม pot transaction สำหรับค่าส่วนกลาง
    if (fee > 0) {
      const playersCount = resultsToInsert.length
      await supabase.from('pot_transactions').insert({
        club_id: clubId,
        type: 'income',
        amount: fee * playersCount,
        description: `ค่าส่วนกลาง ปี${year} S${season} เซส${sessionNo} (${playersCount} คน × ${fee} ฿)`,
        created_by: user?.id,
      })
    }

    router.push(`/sessions/${session.id}`)
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="font-[family-name:var(--font-cinzel)] text-2xl text-[#c9a227] font-semibold flex items-center gap-2">
        <PlusCircle size={22} /> บันทึกเซสชั่นใหม่
      </h1>

      {/* Date + Note */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-white/40 text-xs mb-1.5">วันที่เล่น</p>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="w-full bg-[#111008] border border-[#2a2010] rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-[#c9a227]/50" />
        </div>
        <div>
          <p className="text-white/40 text-xs mb-1.5">หมายเหตุ</p>
          <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="เช่น บ้านแนน..."
            className="w-full bg-[#111008] border border-[#2a2010] rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-[#c9a227]/50" />
        </div>
      </div>

      {/* Session info card */}
      <div className="bg-[#c9a227]/10 border border-[#c9a227]/30 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[#c9a227] font-semibold">ปี {year} · ซีซั่น {season}</p>
            <p className="text-white/40 text-xs mt-0.5">คำนวณจากวันที่เล่น</p>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-white/40 text-xs">เซสชั่นที่</p>
            <div className="flex items-center gap-2 bg-[#111008] border border-[#2a2010] rounded-lg px-2 py-1">
              <button onClick={() => setSessionNo(n => Math.max(1, n - 1))} className="text-white/40 hover:text-white"><Minus size={14} /></button>
              <span className="text-white font-bold w-6 text-center">{sessionNo}</span>
              <button onClick={() => setSessionNo(n => n + 1)} className="text-white/40 hover:text-white"><Plus size={14} /></button>
            </div>
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="bg-[#111008] border border-[#2a2010] rounded-xl p-5 space-y-4">
        <p className="text-white/60 text-sm font-medium">⚙️ ตั้งค่าเซสชั่นนี้</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-white/40 text-xs mb-1.5">อัตราแลกชิป</p>
            <div className="flex items-center gap-2">
              <input type="number" value={chipRate} onChange={e => setChipRate(Number(e.target.value))}
                className="flex-1 bg-[#0a0804] border border-[#2a2010] rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#c9a227]/50" />
              <span className="text-white/30 text-xs">=</span>
              <input type="number" value={bahtRate} onChange={e => setBahtRate(Number(e.target.value))}
                className="flex-1 bg-[#0a0804] border border-[#2a2010] rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#c9a227]/50" />
            </div>
            <p className="text-white/20 text-xs mt-1">1 ชิป ≈ {(bahtRate / chipRate).toFixed(4)} ฿</p>
          </div>
          <div>
            <p className="text-white/40 text-xs mb-1.5">ค่าส่วนกลาง/คน (฿)</p>
            <input type="number" value={fee} onChange={e => setFee(Number(e.target.value))}
              className="w-full bg-[#0a0804] border border-[#2a2010] rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#c9a227]/50" />
          </div>
        </div>
      </div>

      {/* Input mode */}
      <div className="flex items-center gap-3">
        <p className="text-white/40 text-sm">กรอกเป็น:</p>
        <div className="flex gap-1 p-1 bg-[#111008] border border-[#2a2010] rounded-lg">
          {(['chips', 'baht'] as const).map(m => (
            <button key={m} onClick={() => setInputMode(m)}
              className={`px-3 py-1 rounded-md text-sm transition-all ${inputMode === m ? 'bg-[#c9a227] text-black font-medium' : 'text-white/40'}`}>
              {m === 'chips' ? '🎰 ชิป' : '💵 บาท'}
            </button>
          ))}
        </div>
      </div>

      {/* Player entries */}
      <div className="bg-[#111008] border border-[#2a2010] rounded-xl overflow-hidden">
        <div className="grid grid-cols-[1fr_5rem_5rem] gap-3 px-4 py-2.5 border-b border-[#2a2010] text-white/30 text-xs">
          <span>ผู้เล่น</span>
          <span className="text-right">ซื้อ ({inputMode === 'chips' ? 'ชิป' : '฿'})</span>
          <span className="text-right">แลก ({inputMode === 'chips' ? 'ชิป' : '฿'})</span>
        </div>
        {players.map(p => (
          <div key={p.id} className="grid grid-cols-[1fr_5rem_5rem] gap-3 px-4 py-2.5 border-b border-[#2a2010]/50 last:border-0 items-center">
            <span className="text-white/80 text-sm">{p.display_name}</span>
            <input type="number" value={entries[p.id]?.buyIn ?? ''} onChange={e => setEntries(prev => ({ ...prev, [p.id]: { ...prev[p.id], buyIn: e.target.value } }))}
              placeholder="0" className="bg-[#0a0804] border border-[#2a2010] rounded-lg px-2 py-1.5 text-white text-sm text-right outline-none focus:border-[#c9a227]/50 w-full" />
            <input type="number" value={entries[p.id]?.cashOut ?? ''} onChange={e => setEntries(prev => ({ ...prev, [p.id]: { ...prev[p.id], cashOut: e.target.value } }))}
              placeholder="0" className="bg-[#0a0804] border border-[#2a2010] rounded-lg px-2 py-1.5 text-white text-sm text-right outline-none focus:border-[#c9a227]/50 w-full" />
          </div>
        ))}
        <div className={`px-4 py-2.5 flex justify-between text-xs border-t border-[#2a2010] ${balanced ? 'text-green-400' : 'text-red-400'}`}>
          <span>ซื้อรวม: {totalBuyIn.toLocaleString()}</span>
          <span>{balanced ? '✓ ยอดสมดุล' : `ต่าง: ${(totalCashOut - totalBuyIn).toLocaleString()}`}</span>
          <span>แลกรวม: {totalCashOut.toLocaleString()}</span>
        </div>
      </div>

      <button onClick={handleSave} disabled={saving || !balanced || !clubId}
        className="w-full bg-[#c9a227] text-black font-semibold py-3 rounded-xl hover:bg-[#e0b82e] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
        {saving ? 'กำลังบันทึก...' : '💾 บันทึกเซสชั่น'}
      </button>
    </div>
  )
}
