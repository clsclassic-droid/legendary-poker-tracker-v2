'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Settings, Plus, X } from 'lucide-react'

type Profile = { id: string; display_name: string }

export default function SettingsPage() {
  const supabase = createClient()
  const [clubId, setClubId] = useState('')
  const [chipRate, setChipRate] = useState(1000)
  const [bahtRate, setBahtRate] = useState(200)
  const [defaultFee, setDefaultFee] = useState(100)
  const [players, setPlayers] = useState<Profile[]>([])
  const [newPlayer, setNewPlayer] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: club } = await supabase.from('clubs').select('id').single()
    if (!club) return
    setClubId(club.id)
    const { data: latestSession } = await supabase.from('sessions').select('chip_rate, shared_fee').order('played_at', { ascending: false }).limit(1).single()
    if (latestSession) { setChipRate(latestSession.chip_rate ?? 1000); setDefaultFee(latestSession.shared_fee ?? 100) }
    const { data: members } = await supabase.from('club_members').select('profiles(id, display_name)').eq('club_id', club.id)
    setPlayers((members ?? []).map((m: any) => m.profiles).filter(Boolean))
  }

  async function handleSave() {
    setSaving(true)
    // ตั้งค่าเซฟลง clubs table (สำหรับ future use)
    await supabase.from('clubs').update({ default_chip_rate: chipRate, default_baht_rate: bahtRate, default_fee: defaultFee }).eq('id', clubId)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleAddPlayer() {
    if (!newPlayer.trim() || !clubId) return
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('profiles').insert({ display_name: newPlayer.trim() }).select('id, display_name').single()
    if (profile) {
      await supabase.from('club_members').insert({ club_id: clubId, user_id: profile.id, role: 'member' })
      setPlayers(p => [...p, profile])
      setNewPlayer('')
    }
  }

  async function handleRemovePlayer(id: string) {
    if (!confirm('ลบผู้เล่นนี้ออกจาก club?')) return
    await supabase.from('club_members').delete().eq('club_id', clubId).eq('user_id', id)
    setPlayers(p => p.filter(p => p.id !== id))
  }

  const seasons = [
    { no: 1, label: 'ซีซั่น 1', months: 'มกราคม–มีนาคม' },
    { no: 2, label: 'ซีซั่น 2', months: 'เมษายน–มิถุนายน' },
    { no: 3, label: 'ซีซั่น 3', months: 'กรกฎาคม–กันยายน' },
    { no: 4, label: 'ซีซั่น 4', months: 'ตุลาคม–ธันวาคม' },
  ]

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="font-[family-name:var(--font-cinzel)] text-2xl text-[#c9a227] font-semibold flex items-center gap-2">
        <Settings size={22} /> ตั้งค่า
      </h1>

      {/* Chip rate */}
      <div className="bg-[#111008] border border-[#2a2010] rounded-xl p-5 space-y-4">
        <p className="text-[#c9a227] text-sm font-medium">🎰 อัตราแลกชิป (ค่าเริ่มต้น)</p>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <p className="text-white/40 text-xs mb-1.5">ชิป</p>
            <input type="number" value={chipRate} onChange={e => setChipRate(Number(e.target.value))}
              className="w-full bg-[#0a0804] border border-[#2a2010] rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-[#c9a227]/50" />
          </div>
          <span className="text-white/30 mt-5">=</span>
          <div className="flex-1">
            <p className="text-white/40 text-xs mb-1.5">บาท</p>
            <input type="number" value={bahtRate} onChange={e => setBahtRate(Number(e.target.value))}
              className="w-full bg-[#0a0804] border border-[#2a2010] rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-[#c9a227]/50" />
          </div>
        </div>
        <div className="bg-[#c9a227]/10 border border-[#c9a227]/20 rounded-lg px-3 py-2 text-[#c9a227] text-xs">
          {chipRate.toLocaleString()} ชิป = {bahtRate} ฿ · 1 ชิป ≈ {(bahtRate / chipRate).toFixed(4)} ฿
        </div>
      </div>

      {/* Default fee */}
      <div className="bg-[#111008] border border-[#2a2010] rounded-xl p-5 space-y-3">
        <p className="text-[#c9a227] text-sm font-medium">🧾 ค่าส่วนกลางต่อคน (ค่าเริ่มต้น)</p>
        <input type="number" value={defaultFee} onChange={e => setDefaultFee(Number(e.target.value))}
          className="w-full bg-[#0a0804] border border-[#2a2010] rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-[#c9a227]/50" />
        <p className="text-white/30 text-xs">ทุกคนจ่าย {defaultFee} ฿/เซสชั่น</p>
      </div>

      {/* Players */}
      <div className="bg-[#111008] border border-[#2a2010] rounded-xl p-5 space-y-3">
        <p className="text-[#c9a227] text-sm font-medium">👥 ผู้เล่น</p>
        <div className="flex gap-2">
          <input type="text" value={newPlayer} onChange={e => setNewPlayer(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddPlayer()}
            placeholder="ชื่อผู้เล่นใหม่..."
            className="flex-1 bg-[#0a0804] border border-[#2a2010] rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-[#c9a227]/50" />
          <button onClick={handleAddPlayer}
            className="bg-[#c9a227] text-black px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#e0b82e] transition-colors flex items-center gap-1">
            <Plus size={16} /> เพิ่ม
          </button>
        </div>
        <div className="space-y-2">
          {players.map(p => (
            <div key={p.id} className="flex items-center justify-between bg-[#0a0804] border border-[#2a2010] rounded-lg px-3 py-2.5">
              <span className="text-white/80 text-sm">{p.display_name}</span>
              <button onClick={() => handleRemovePlayer(p.id)} className="text-white/30 hover:text-red-400 transition-colors">
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Season info */}
      <div className="bg-[#111008] border border-[#2a2010] rounded-xl p-5 space-y-3">
        <p className="text-[#c9a227] text-sm font-medium">📅 ช่วงซีซั่น</p>
        <div className="grid grid-cols-2 gap-2">
          {seasons.map(s => (
            <div key={s.no} className="flex items-center gap-2 bg-[#0a0804] rounded-lg px-3 py-2">
              <span className="bg-[#c9a227]/20 text-[#c9a227] text-xs px-2 py-0.5 rounded-full font-medium">S{s.no}</span>
              <span className="text-white/50 text-xs">{s.months}</span>
            </div>
          ))}
        </div>
      </div>

      <button onClick={handleSave} disabled={saving}
        className="w-full bg-[#c9a227] text-black font-semibold py-3 rounded-xl hover:bg-[#e0b82e] transition-colors disabled:opacity-50">
        {saved ? '✓ บันทึกแล้ว' : saving ? 'กำลังบันทึก...' : '💾 บันทึกการตั้งค่า'}
      </button>
    </div>
  )
}
