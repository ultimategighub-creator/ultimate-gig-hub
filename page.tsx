import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import TaskDetailClient from './TaskDetailClient'

export default async function TaskDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [taskRes, submissionRes, profileRes] = await Promise.all([
    supabase.from('tasks').select('*').eq('id', params.id).single(),
    supabase.from('task_submissions').select('*').eq('task_id', params.id).eq('user_id', user.id).maybeSingle(),
    supabase.from('profiles').select('id').eq('id', user.id).single(),
  ])

  if (!taskRes.data) notFound()

  return (
    <TaskDetailClient
      task={taskRes.data}
      existingSubmission={submissionRes.data}
      userId={user.id}
    />
  )
}
