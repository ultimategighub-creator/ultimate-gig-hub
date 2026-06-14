'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Search, Bell, ChevronRight, Zap, Star, TrendingUp } from 'lucide-react'
import { formatNaira, getPlatformEmoji, cn } from '@/lib/utils'
import BalanceCard from '@/components/earner/BalanceCard'
import TaskCard from '@/components/earner/TaskCard'
import type { Profile, Wallet, Task, TaskSubmission } from '@/types'

const PLATFORMS = ['All', 'Instagram', 'YouTube', 'TikTok', 'Twitter/X', 'Facebook', 'Telegram', 'WhatsApp']

interface Props {
  profile: Profile | null
  wallet: Wallet | null
  tasks: Task[]
  submissions: Pick<TaskSubmission, 'task_id' | 'status'>[]
}

export default function DashboardClient({ profile, wallet, tasks, submissions }: Props) {
  const router = useRouter()
  const [search, setSearch]         = useState('')
  const [platform, setPlatform]     = useState('All')

  // Map of task_id → submission status for quick lookup
  const submissionMap = useMemo(() => {
    const map: Record<string, string> = {}
    submissions.forEach(s => { map[s.task_id] = s.status })
    return map
  }, [submissions])

  const filtered = useMemo(() => tasks.filter(t => {
    const matchPlatform = platform === 'All' || t.platform.toLowerCase() === platform.toLowerCase()
    const matchSearch   = !search || t.title.toLowerCase().includes(search.toLowerCase())
    return matchPlatform && matchSearch
  }), [tasks, platform, search])

  const completedCount = submissions.filter(s => s.status === 'approved').length
  const pendingCount   = submissions.filter(s => s.status === 'pending').length

  const firstName = profile?.full_name?.split(' ')[0] ?? 'Earner'

  return (
    <div className="min-h-screen bg-navy-700">
      {/* Header */}
      <div className="px-5 pt-12 pb-4 bg-gradient-to-b from-navy-600 to-navy-700">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-navy-200 text-sm">Good day,</p>
            <h1 className="text-xl font-bold text-white">
              {firstName} <span className="wave">👋</span>
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/alerts')}
              className="relative w-10 h-10 rounded-xl bg-navy-500 border border-navy-border
                         flex items-center justify-center text-navy-200 hover:text-gold
                         hover:border-gold/30 transition-all"
            >
              <Bell className="w-4 h-4" />
            </button>
            <div
              onClick={() => router.push('/profile')}
              className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/30
                         flex items-center justify-center cursor-pointer overflow-hidden"
            >
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-gold font-bold text-sm">
                  {profile?.full_name?.[0]?.toUpperCase() ?? 'U'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Balance card */}
        <BalanceCard
          wallet={wallet}
          onWithdraw={() => router.push('/wallet?tab=withdraw')}
        />
      </div>

      {/* Quick stats */}
      <div className="px-5 py-4">
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Zap,       label: 'Available',  value: tasks.filter(t => !submissionMap[t.id] && t.filled_spots < t.total_spots).length, color: 'text-gold' },
            { icon: Star,      label: 'Completed',  value: completedCount, color: 'text-success' },
            { icon: TrendingUp,label: 'Pending',    value: pendingCount,   color: 'text-warning' },
          ].map(({ icon: Icon, label, value, color }) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="gold-card p-3 text-center"
            >
              <Icon className={cn('w-4 h-4 mx-auto mb-1', color)} />
              <p className={cn('text-lg font-black', color)}>{value}</p>
              <p className="text-[10px] text-navy-200">{label}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Tasks section */}
      <div className="px-5 pb-4">
        {/* Section header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-white text-base">Available Tasks</h2>
          <button
            onClick={() => router.push('/tasks')}
            className="flex items-center gap-1 text-gold text-xs font-semibold hover:underline"
          >
            See all <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-200" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search tasks..."
            className="w-full pl-10 pr-4 py-3 rounded-xl text-sm"
          />
        </div>

        {/* Platform filter pills */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-4">
          {PLATFORMS.map(p => (
            <button
              key={p}
              onClick={() => setPlatform(p)}
              className={cn(
                'flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all',
                platform === p
                  ? 'bg-gold text-navy-700'
                  : 'bg-navy-500 text-navy-200 border border-navy-border hover:border-gold/30'
              )}
            >
              {p !== 'All' && <span>{getPlatformEmoji(p)}</span>}
              {p}
            </button>
          ))}
        </div>

        {/* Task list */}
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-white font-semibold">No tasks found</p>
            <p className="text-navy-200 text-sm mt-1">Try a different filter or check back later</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.slice(0, 8).map((task, i) => (
              <TaskCard
                key={task.id}
                task={task}
                index={i}
                isCompleted={submissionMap[task.id] === 'approved'}
                isPending={submissionMap[task.id] === 'pending'}
                onClick={() => router.push(`/tasks/${task.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Referral banner */}
      {profile?.referral_code && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-5 mb-6 p-4 rounded-2xl cursor-pointer tap-highlight"
          style={{
            background: 'linear-gradient(135deg, rgba(245,196,0,0.12) 0%, rgba(245,196,0,0.05) 100%)',
            border: '1px solid rgba(245,196,0,0.25)',
          }}
          onClick={() => router.push('/profile?tab=referral')}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎁</span>
            <div className="flex-1">
              <p className="text-white font-semibold text-sm">Refer & Earn ₦100!</p>
              <p className="text-navy-200 text-xs mt-0.5">
                Your code: <span className="text-gold font-bold tracking-wider">{profile.referral_code}</span>
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-gold" />
          </div>
        </motion.div>
      )}
    </div>
  )
}
