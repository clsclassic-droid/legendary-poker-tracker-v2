'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Coins, Plus, Trash2, X } from 'lucide-react'

type Transaction = { id: string; type: string; amount: number; description: string | null; created_at: string }

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function PotPage() {
  const supabase = createClient()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [clubId, setClubId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ type: 'income', amount: '', description: '' })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    const { data: club } = await supabase.from('clubs').select('id').single()
    if (club) {
      setClubId(club.id)
      const { data } = await supabase.from('pot_transactions').select('*').eq('club_id', club.id).order('created_at', { ascending: false })
      setTransactions(data ?? [])
    }
    setLoading(false)
  }

  const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const balance = income - expense

  async function handleAdd() {
    if (!form.amount || !clubId) return
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('pot_transactions').insert({
      club_id: clubId,
      type: form.type,
      amount: Number(form.amount),
      description: form.description || null,
      created_by: user?.id,
    })
    setShowModal(false)
    setForm({ type: 'income', amount: '', description: '' })
    loadData()
  }

  async function handleDelete(id: string) {
    if (!confirm('ลบรายการนี้?')) return
    await supabase.from('pot_transactions').delete().eq('id', id)
    loadData()
  }

  if (loading) return <div className="p-6 text-white/30 text-sm">กำลังโหลด...</div>

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-[family-name:var(--font-cinzel)] text-2xl text-[#c9a227] font-semibold flex items-center gap-2">
          <Coins size={22} /> กองกลาง
        </h1>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-[#c9a227] text-black text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#e0b82e] transition-colors">
          <Plus size={16} /> เพิ่มรายการ
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-green-900/20 border border-green-800/30 rounded-xl p-4 text-center">
          <p className="text-green-400/60 text-xs mb-1">รายรับรวม</p>
          <p className="text-green-400 text-xl font-bold">+{income.toLocaleString('th-TH')}</p>
          <p className="text-green-400/40 text-xs">฿</p>
        </div>
        <div className="bg-red-900/20 border border-red-800/30 rounded-xl p-4 text-center">
          <p className="text-red-400/60 text-xs mb-1">รายจ่ายรวม</p>
          <p className="text-red-400 text-xl font-bold">-{expense.toLocaleString('th-TH')}</p>
          <p className="text-red-400/40 text-xs">฿</p>
        </div>
        <div className="bg-[#c9a227]/10 border border-[#c9a227]/30 rounded-xl p-4 text-center">
          <p className="text-[#c9a227]/60 text-xs mb-1">คงเหลือ</p>
          <p className="text-[#c9a227] text-xl font-bold">{balance.toLocaleString('th-TH')}</p>
          <p className="text-[#c9a227]/40 text-xs">฿</p>
        </div>
      </div>

      {/* Transaction list */}
      <div className="bg-[#111008] border border-[#2a2010] rounded-xl overflow-hidden">
        <p className="px-4 py-3 text-white/40 text-xs border-b border-[#2a2010]">ประวัติรายการ ({transactions.length})</p>
        {transactions.length === 0 ? (
          <p className="text-white/30 text-sm text-center py-8">ยังไม่มีรายการ</p>
        ) : transactions.map(t => (
          <div key={t.id} className="flex items-center gap-4 px-4 py-3.5 border-b border-[#2a2010]/50 last:border-0 hover:bg-white/5 group">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${t.type === 'income' ? 'bg-green-900/30' : 'bg-red-900/30'}`}>
              {t.type === 'income' ? '+' : '−'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white/80 text-sm">{t.description ?? (t.type === 'income' ? 'รายรับ' : 'รายจ่าย')}</p>
              <p className="text-white/30 text-xs">{fmtDate(t.created_at)}</p>
            </div>
            <span className={`text-sm font-semibold ${t.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
              {t.type === 'income' ? '+' : '-'}{t.amount.toLocaleString('th-TH')} ฿
            </span>
            <button onClick={() => handleDelete(t.id)}
              className="text-white/20 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[#111008] border border-[#2a2010] rounded-2xl p-6 w-full max-w-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-white/80 font-medium">เพิ่มรายการ</h2>
              <button onClick={() => setShowModal(false)} className="text-white/40 hover:text-white/70"><X size={18} /></button>
            </div>
            <div className="flex gap-2">
              {(['income', 'expense'] as const).map(t => (
                <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${form.type === t ? (t === 'income' ? 'bg-green-700/40 text-green-400' : 'bg-red-700/40 text-red-400') : 'bg-[#2a2010] text-white/40'}`}>
                  {t === 'income' ? '+ รายรับ' : '− รายจ่าย'}
                </button>
              ))}
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-white/40 text-xs mb-1.5">จำนวน (฿)</p>
                <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  placeholder="0" className="w-full bg-[#0a0804] border border-[#2a2010] rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-[#c9a227]/50" />
              </div>
              <div>
                <p className="text-white/40 text-xs mb-1.5">หมายเหตุ</p>
                <input type="text" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="เช่น ค่าบ้าน, ค่าส่วนกลาง..." className="w-full bg-[#0a0804] border border-[#2a2010] rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-[#c9a227]/50" />
              </div>
            </div>
            <button onClick={handleAdd} className="w-full bg-[#c9a227] text-black font-semibold py-2.5 rounded-lg hover:bg-[#e0b82e] transition-colors">
              บันทึก
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
