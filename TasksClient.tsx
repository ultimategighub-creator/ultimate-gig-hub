'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { getPlatformEmoji, formatNaira, cn } from '@/lib/utils'
import TaskCard from '@/components/earner/TaskCard'
import type { Task, TaskSubmission } from '@/types'

const TABS   = ['All', 'New', 'High Pay', 'Almost Full']
const PLATFORMS = ['All', 'Instagram', 'YouTube', 'TikTok', 'Twitter/X', 'Facebook', 'Telegram', 'WhatsApp', 'Snapchat', 'LinkedIn']

interface Props {
  tasks: Task[]
  submissions: Pick<TaskSubmission, 'task_id' | 'status'>[]
}

export default function TasksClient({ tasks, submissions }: Props) {
  const router = useRouter()
  const [search, setSearch]     = useState('')
  const [tab, setTab]           = useState('All')
  const [platform, setPlatform] = useState('All')
  const [showFilter, setShowFilter] = useState(false)

  const submissionMap = useMemo(() => {
    const map: Record<string, string> = {}
    submissions.forEach(s => { map[s.task_id] = s.status })
    return map
  }, [submissions])

  const filtered = useMemo(() => {
    let list = [...tasks]

    // Tab filter
    if (tab === 'New')         list = list.filter(t => new Date(t.created_at) > new Date(Date.now() - 86400000 * 3))
    if (tab === 'High Pay')    list = list.sort((a, b) => b.reward_amount - a.reward_amount)
    if (tab === 'Almost Full') list = list.filter(t => (t.total_spots - t.filled_spots) <= 10 && t.filled_spots < t.total_spots)

    // Platform filter
    if (platform !== 'All') list = list.filter(t => t.platform.toLowerCase() === platform.toLowerCase())

    // Search
    if (search) list = list.filter(t =>
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.platform.toLowerCase().includes(search.toLowerCase())
    )

    return list
  }, [tasks, tab, platform, search])

  const available = filtered.filter(t => !submissionMap[t.id] && t.filled_spots < t.total_spots)
  const completed = filtered.filter(t => submissionMap[t.id] === 'approved')
  const pending   = filtered.filter(t => submissionMap[t.id] === 'pending')

  return (
    <div className="min-h-screen bg-navy-700">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-navy-700/95 backdrop-blur border-b border-navy-border px-5 pt-12 pb-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-white">Tasks</h1>
          <button
            onClick={() => setShowFilter(!showFilter)}
            className={cn(
              'w-9 h-9 rounded-xl flex items-center justify-center transition-all',
              showFilter ? 'bg-gold text-navy-700' : 'bg-navy-500 border border-navy-border text-navy-200'
            )}
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-200" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search tasks by name or platform..."
            className="w-full pl-10 pr-10 py-3 rounded-xl text-sm"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-200">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all',
                tab === t ? 'bg-gold text-navy-700' : 'bg-navy-500 text-navy-200 border border-navy-border'
              )}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Platform filter (collapsible) */}
        {showFilter && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3"
          >
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {PLATFORMS.map(p => (
                <button
                  key={p}
                  onClick={() => setPlatform(p)}
                  className={cn(
                    'flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all',
                    platform === p ? 'bg-gold text-navy-700' : 'bg-navy-400 text-navy-200 border border-navy-border'
                  )}
                >
                  {p !== 'All' && getPlatformEmoji(p)} {p}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      <div className="px-5 py-4 space-y-6">
        {/* Available tasks */}
        {available.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-gold" />
              <h2 className="font-semibold text-white text-sm">
                Available ({available.length})
              </h2>
            </div>
            <div className="space-y-3">
              {available.map((task, i) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  index={i}
                  onClick={() => router.push(`/tasks/${task.id}`)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Pending review */}
        {pending.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-warning" />
              <h2 className="font-semibold text-white text-sm">
                Under Review ({pending.length})
              </h2>
            </div>
            <div className="space-y-3">
              {pending.map((task, i) => (
                <TaskCard key={task.id} task={task} index={i} isPending onClick={() => {}} />
              ))}
            </div>
          </section>
        )}

        {/* Completed */}
        {completed.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-success" />
              <h2 className="font-semibold text-white text-sm">
                Completed ({completed.length})
              </h2>
            </div>
            <div className="space-y-3">
              {completed.map((task, i) => (
                <TaskCard key={task.id} task={task} index={i} isCompleted onClick={() => {}} />
              ))}
            </div>
          </section>
        )}

        {/* Empty */}
        {filtered.length === 0 && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-white font-semibold text-lg">No tasks found</p>
            <p className="text-navy-200 text-sm mt-2">Try clearing your filters or check back later</p>
            <button
              onClick={() => { setSearch(''); setTab('All'); setPlatform('All') }}
              className="mt-4 px-6 py-2.5 rounded-xl bg-gold/10 border border-gold/30 text-gold text-sm font-semibold"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
