import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Fetch all needed data in parallel
  const [profileRes, walletRes, tasksRes, submissionsRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('wallets').select('*').eq('user_id', user.id).single(),
    supabase.from('tasks').select('*').eq('is_active', true).order('created_at', { ascending: false }).limit(20),
    supabase.from('task_submissions').select('task_id, status').eq('user_id', user.id),
  ])

  // Redirect admin to admin panel
  if (profileRes.data?.role === 'admin') redirect('/admin/users')

  return (
    <DashboardClient
      profile={profileRes.data}
      wallet={walletRes.data}
      tasks={tasksRes.data ?? []}
      submissions={submissionsRes.data ?? []}
    />
  )
}
