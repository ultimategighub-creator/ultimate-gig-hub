import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import TasksClient from './TasksClient'

export default async function TasksPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [tasksRes, submissionsRes] = await Promise.all([
    supabase.from('tasks').select('*').eq('is_active', true).order('reward_amount', { ascending: false }),
    supabase.from('task_submissions').select('task_id, status').eq('user_id', user.id),
  ])

  return (
    <TasksClient
      tasks={tasksRes.data ?? []}
      submissions={submissionsRes.data ?? []}
    />
  )
}
