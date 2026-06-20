'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin() {
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง')
    } else {
      router.push('/')
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#0a0804] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <Image
            src="https://raw.githubusercontent.com/clsclassic-droid/Legendary-Poker-Tracker/main/src/f512d9a54b54e5e327ac49c65c60695a.jpeg"
            alt="Legendary Secrets"
            width={64}
            height={64}
            className="rounded-full ring-2 ring-[#c9a227]/40 mb-4"
          />
          <h1 className="font-[family-name:var(--font-cinzel)] text-[#c9a227] text-2xl font-semibold">
            Legendary
          </h1>
          <p className="text-white/30 text-sm mt-1">Poker Tracker</p>
        </div>

        {/* Card */}
        <div className="bg-[#111008] border border-[#2a2010] rounded-2xl p-6 space-y-4">
          <h2 className="text-white/70 text-sm font-medium mb-2">เข้าสู่ระบบ</h2>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-white/40 text-xs">อีเมล</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="your@email.com"
              className="w-full bg-[#0a0804] border border-[#2a2010] rounded-lg px-3 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-[#c9a227]/50 transition-colors"
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-white/40 text-xs">รหัสผ่าน</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="••••••••"
              className="w-full bg-[#0a0804] border border-[#2a2010] rounded-lg px-3 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-[#c9a227]/50 transition-colors"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-red-400 text-xs">{error}</p>
          )}

          {/* Button */}
          <button
            onClick={handleLogin}
            disabled={loading || !email || !password}
            className="w-full bg-[#c9a227] hover:bg-[#e8c547] disabled:opacity-40 disabled:cursor-not-allowed text-black font-semibold text-sm rounded-lg py-2.5 transition-colors mt-2"
          >
            {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
        </div>

        <p className="text-center text-white/20 text-xs mt-6">
          Legendary Secrets Poker Club · invite only
        </p>
      </div>
    </div>
  )
}
