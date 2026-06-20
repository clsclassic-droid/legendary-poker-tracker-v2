import { createClient } from '@/lib/supabase/server'
import LeaderboardClient from './LeaderboardClient'

export default async function LeaderboardPage() {
  const supabase = await createClient()

  const { data: sessions } = await supabase
    .from('sessions')
    .select('id, year, season, chip_rate, baht_rate, played_at')

  const { data: results } = await supabase
    .from('session_results')
    .select('session_id, user_id, buy_in_chips, cash_out_chips, profiles(display_name)')

  return <LeaderboardClient sessions={sessions ?? []} results={results ?? []} />
}
