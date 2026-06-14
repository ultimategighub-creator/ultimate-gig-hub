'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, ExternalLink, Upload, Camera, Check,
  Loader2, Clock, Users, AlertCircle, CheckCircle2
} from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { formatNaira, getPlatformEmoji, getPlatformColor, timeAgo, cn } from '@/lib/utils'
import type { Task, TaskSubmission } from '@/types'

interface Props {
  task: Task
  existingSubmission: TaskSubmission | null
  userId: string
}

export default function TaskDetailClient({ task, existingSubmission, userId }: Props) {
  const router   = useRouter()
  const supabase = createClient()
  const fileRef  = useRef<HTMLInputElement>(null)

  const [step, setStep]         = useState<'detail' | 'submit' | 'done'>(
    existingSubmission ? 'done' : 'detail'
  )
  const [screenshot, setScreenshot]   = useState<File | null>(null)
  const [screenshotPreview, setPreview] = useState('')
  const [proofUrl, setProofUrl]         = useState('')
  const [loading, setLoading]           = useState(false)

  const spotsLeft  = task.total_spots - task.filled_spots
  const isFull     = spotsLeft <= 0
  const platformColor = getPlatformColor(task.platform)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('Screenshot must be under 5MB'); return }
    setScreenshot(file)
    setPreview(URL.createObjectURL(file))
  }

  async function handleSubmit() {
    if (!screenshot && task.proof_required !== 'url') {
      toast.error('Please upload a screenshot as proof')
      return
    }
    if (task.proof_required === 'url' && !proofUrl) {
      toast.error('Please enter the proof link')
      return
    }

    setLoading(true)
    try {
      let proofStorageUrl = ''

      // Upload screenshot to Supabase Storage
      if (screenshot) {
        const ext  = screenshot.name.split('.').pop()
        const path = `${userId}/${task.id}.${ext}`
        const { error: upErr } = await supabase.storage
          .from('task-proofs')
          .upload(path, screenshot, { upsert: true })
        if (upErr) throw upErr

        const { data: urlData } = supabase.storage.from('task-proofs').getPublicUrl(path)
        proofStorageUrl = urlData.publicUrl
      }

      // Create submission
      const { error } = await supabase.from('task_submissions').insert({
        task_id:    task.id,
        user_id:    userId,
        proof_url:  proofStorageUrl || null,
        proof_link: proofUrl || null,
        status:     'pending',
      })
      if (error) {
        if (error.code === '23505') { toast.error('You already submitted this task'); return }
        throw error
      }

      // Increment filled spots
      await supabase.rpc('increment_task_spots', { task_id: task.id }).maybeSingle()
      // Fallback manual increment
      await supabase.from('tasks')
        .update({ filled_spots: task.filled_spots + 1 })
        .eq('id', task.id)

      setStep('done')
      toast.success('Submission received! Awaiting review 🎉')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Submission failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-navy-700">
      {/* Top bar */}
      <div className="sticky top-0 z-40 bg-navy-700/95 backdrop-blur border-b border-navy-border px-5 py-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="w-8 h-8 rounded-lg bg-navy-500 flex items-center justify-center text-navy-200 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="font-bold text-white text-base flex-1 line-clamp-1">{task.title}</h1>
      </div>

      <div className="px-5 py-5 space-y-4">
        {/* Platform banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-5 text-center"
          style={{ background: `linear-gradient(135deg, ${platformColor}20, ${platformColor}08)`, border: `1px solid ${platformColor}30` }}
        >
          <div className="text-5xl mb-3">{getPlatformEmoji(task.platform)}</div>
          <h2 className="text-xl font-black text-white mb-1">{formatNaira(task.reward_amount)}</h2>
          <p className="text-sm font-semibold capitalize" style={{ color: platformColor }}>
            {task.platform} · {task.action_type}
          </p>
        </motion.div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Users, label: 'Spots Left',  value: spotsLeft, color: spotsLeft <= 10 ? 'text-warning' : 'text-white' },
            { icon: Clock, label: 'Reward',      value: formatNaira(task.reward_amount), color: 'text-gold' },
            { icon: CheckCircle2, label: 'Filled', value: `${task.filled_spots}/${task.total_spots}`, color: 'text-navy-100' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="gold-card p-3 text-center">
              <Icon className={cn('w-4 h-4 mx-auto mb-1', color)} />
              <p className={cn('text-sm font-bold', color)}>{value}</p>
              <p className="text-[10px] text-navy-200 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Instructions */}
        {task.instructions && (
          <div className="gold-card p-4">
            <h3 className="font-bold text-white text-sm mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-gold" /> Instructions
            </h3>
            <p className="text-navy-100 text-sm leading-relaxed">{task.instructions}</p>
          </div>
        )}

        {/* Description */}
        {task.description && (
          <div className="gold-card p-4">
            <h3 className="font-bold text-white text-sm mb-2">About this task</h3>
            <p className="text-navy-100 text-sm leading-relaxed">{task.description}</p>
          </div>
        )}

        {/* ── STEP: DONE ── */}
        <AnimatePresence>
          {step === 'done' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl p-6 text-center"
              style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)' }}
            >
              <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-3" />
              <h3 className="text-white font-bold text-lg mb-1">
                {existingSubmission?.status === 'approved' ? 'Approved! 🎉' :
                 existingSubmission?.status === 'rejected' ? 'Submission Rejected' :
                 'Submission Pending Review'}
              </h3>
              <p className="text-navy-200 text-sm">
                {existingSubmission?.status === 'approved'
                  ? `₦${task.reward_amount} has been added to your wallet.`
                  : existingSubmission?.status === 'rejected'
                  ? `Reason: ${existingSubmission?.rejection_reason ?? 'Not specified'}`
                  : 'We will review your submission shortly. Check Alerts for updates.'}
              </p>
              <button
                onClick={() => router.push('/tasks')}
                className="mt-4 px-6 py-2.5 rounded-xl bg-gold text-navy-700 font-bold text-sm"
              >
                Browse More Tasks
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── STEP: SUBMIT FORM ── */}
        {step === 'submit' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="gold-card p-5 space-y-4"
          >
            <h3 className="font-bold text-white text-base">Submit Proof</h3>
            <p className="text-navy-200 text-sm">
              Complete the task, then upload a clear screenshot as proof.
            </p>

            {/* Screenshot upload */}
            {task.proof_required !== 'url' && (
              <div>
                <label className="block text-sm font-medium text-navy-100 mb-2">Screenshot Proof *</label>
                <div
                  onClick={() => fileRef.current?.click()}
                  className={cn(
                    'w-full rounded-xl border-2 border-dashed transition-all cursor-pointer overflow-hidden',
                    screenshotPreview ? 'border-gold/40' : 'border-navy-border hover:border-gold/30'
                  )}
                >
                  {screenshotPreview ? (
                    <div className="relative">
                      <img src={screenshotPreview} alt="Proof" className="w-full max-h-48 object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <p className="text-white text-sm font-semibold">Tap to change</p>
                      </div>
                    </div>
                  ) : (
                    <div className="py-8 flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center">
                        <Camera className="w-6 h-6 text-gold" />
                      </div>
                      <p className="text-white text-sm font-semibold">Tap to upload screenshot</p>
                      <p className="text-navy-200 text-xs">PNG, JPG up to 5MB</p>
                    </div>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
              </div>
            )}

            {/* Proof URL */}
            {(task.proof_required === 'url' || task.proof_required === 'both') && (
              <div>
                <label className="block text-sm font-medium text-navy-100 mb-2">
                  Proof Link {task.proof_required === 'url' ? '*' : '(optional)'}
                </label>
                <input
                  type="url"
                  value={proofUrl}
                  onChange={e => setProofUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-4 py-3 rounded-xl text-sm"
                />
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setStep('detail')}
                className="flex-1 py-3 rounded-xl border border-navy-border text-navy-100 font-semibold text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 py-3 rounded-xl bg-gold text-navy-700 font-bold text-sm
                           flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : <>
                  <Upload className="w-4 h-4" /> Submit
                </>}
              </button>
            </div>
          </motion.div>
        )}

        {/* ── CTA ── */}
        {step === 'detail' && !isFull && (
          <div className="space-y-3 pt-2">
            {task.instructions && (
              <a
                href={task.instructions.match(/https?:\/\/[^\s]+/)?.[0] ?? '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 rounded-xl border border-gold/30 text-gold font-bold text-sm
                           flex items-center justify-center gap-2 hover:bg-gold/10 transition-all"
              >
                <ExternalLink className="w-4 h-4" /> Go to Task
              </a>
            )}
            <button
              onClick={() => setStep('submit')}
              className="w-full py-3.5 rounded-xl bg-gold text-navy-700 font-bold text-sm
                         flex items-center justify-center gap-2 hover:bg-gold-400 active:scale-95 transition-all"
            >
              <Check className="w-4 h-4" /> I've Done This — Submit Proof
            </button>
          </div>
        )}

        {isFull && step !== 'done' && (
          <div className="gold-card p-4 text-center">
            <p className="text-navy-200 text-sm">This task is full. Check back later or browse other tasks.</p>
            <button onClick={() => router.push('/tasks')}
              className="mt-3 px-6 py-2.5 rounded-xl bg-gold/10 border border-gold/30 text-gold text-sm font-semibold">
              Browse Tasks
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
