import { createClient } from '@/lib/supabase/server'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: sessions } = await supabase
    .from('sessions')
    .select('id, session_number, year, season, played_at, shared_fee, chip_rate, baht_rate')
    .order('played_at', { ascending: false })
    .range(0, 999)

  const { data: results } = await supabase
    .from('session_results')
    .select('session_id, user_id, buy_in_chips, cash_out_chips, profiles(display_name)')
    .range(0, 9999)

  const { data: pot } = await supabase
    .from('pot_transactions')
    .select('type, amount')

  const potBalance = (pot ?? []).reduce((sum, t) =>
    sum + (t.type === 'income' ? t.amount : -t.amount), 0)

  return (
    <DashboardClient
      sessions={sessions ?? []}
      results={results ?? []}
      potBalance={potBalance}
    />
  )
}
