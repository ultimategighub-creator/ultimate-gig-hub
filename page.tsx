'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Eye, EyeOff, Mail, Lock, User, Phone,
  Camera, Loader2, ChevronRight, ChevronLeft, Check
} from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { generateUsername } from '@/lib/utils'

const STEPS = ['Account', 'Security', 'Profile']

export default function RegisterPage() {
  const router   = useRouter()
  const supabase = createClient()
  const fileRef  = useRef<HTMLInputElement>(null)

  const [step, setStep]     = useState(0)
  const [loading, setLoading] = useState(false)
  const [agreed, setAgreed] = useState(false)

  // Step 1
  const [fullName, setFullName]     = useState('')
  const [email, setEmail]           = useState('')
  const [phone, setPhone]           = useState('')
  const [password, setPassword]     = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [showPass, setShowPass]     = useState(false)

  // Step 2
  const [pin, setPin]         = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [referralCode, setReferralCode] = useState('')

  // Step 3
  const [avatar, setAvatar]       = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string>('')

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be under 2MB')
      return
    }
    setAvatar(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  function validateStep(): boolean {
    if (step === 0) {
      if (!fullName.trim()) { toast.error('Enter your full name'); return false }
      if (!email.includes('@')) { toast.error('Enter a valid email'); return false }
      if (!phone || phone.length < 10) { toast.error('Enter a valid phone number'); return false }
      if (password.length < 6) { toast.error('Password must be at least 6 characters'); return false }
      if (password !== confirmPass) { toast.error('Passwords do not match'); return false }
    }
    if (step === 1) {
      if (pin.length !== 4 || !/^\d{4}$/.test(pin)) { toast.error('PIN must be exactly 4 digits'); return false }
      if (pin !== confirmPin) { toast.error('PINs do not match'); return false }
    }
    if (step === 2) {
      if (!agreed) { toast.error('Please accept the Terms of Service'); return false }
    }
    return true
  }

  function nextStep() {
    if (validateStep()) setStep(s => s + 1)
  }

  async function handleRegister() {
    if (!validateStep()) return
    setLoading(true)

    try {
      const username = generateUsername(fullName)

      // Sign up with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            username,
            phone,
            referral_code: referralCode || null,
          }
        }
      })
      if (error) throw error

      // Upload avatar if provided
      if (avatar && data.user) {
        const ext  = avatar.name.split('.').pop()
        const path = `${data.user.id}/avatar.${ext}`
        const { error: uploadErr } = await supabase.storage
          .from('avatars')
          .upload(path, avatar, { upsert: true })

        if (!uploadErr) {
          const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
          await supabase
            .from('profiles')
            .update({ avatar_url: urlData.publicUrl })
            .eq('id', data.user.id)
        }
      }

      // Save hashed PIN (simple — for production use bcrypt on server)
      if (data.user) {
        await supabase
          .from('profiles')
          .update({ withdrawal_pin: pin })  // hash this server-side in production
          .eq('id', data.user.id)
      }

      toast.success('Account created! Setting up your profile...')
      router.push('/auth/onboarding')
      router.refresh()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed'
      if (msg.includes('already registered')) {
        toast.error('This email is already registered')
      } else {
        toast.error(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-container flex flex-col min-h-dvh bg-navy-700">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-gold/5 blur-3xl pointer-events-none" />

      <div className="flex-1 flex flex-col px-6 py-10 relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gold/10 border border-gold/30 mb-3">
            <span className="text-2xl">⚡</span>
          </div>
          <h1 className="text-xl font-bold gold-text">Create Account</h1>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all ${
                i < step  ? 'bg-gold text-navy-700' :
                i === step ? 'bg-gold/20 border border-gold text-gold' :
                             'bg-navy-400 text-navy-200'
              }`}>
                {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </div>
              <span className={`text-xs ${i === step ? 'text-gold' : 'text-navy-200'}`}>{s}</span>
              {i < STEPS.length - 1 && (
                <div className={`w-8 h-px ${i < step ? 'bg-gold' : 'bg-navy-border'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="gold-card p-6 flex-1"
          >
            {/* ── STEP 0: Account ── */}
            {step === 0 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-white mb-4">Account Details</h2>

                <div>
                  <label className="block text-sm font-medium text-navy-100 mb-1.5">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-200" />
                    <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                      placeholder="e.g. Adebayo Okafor"
                      className="w-full pl-10 pr-4 py-3 rounded-xl text-sm" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-navy-100 mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-200" />
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="you@email.com"
                      className="w-full pl-10 pr-4 py-3 rounded-xl text-sm" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-navy-100 mb-1.5">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-200" />
                    <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                      placeholder="08012345678"
                      className="w-full pl-10 pr-4 py-3 rounded-xl text-sm" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-navy-100 mb-1.5">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-200" />
                    <input type={showPass ? 'text' : 'password'} value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      className="w-full pl-10 pr-11 py-3 rounded-xl text-sm" />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-200 hover:text-gold">
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-navy-100 mb-1.5">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-200" />
                    <input type={showPass ? 'text' : 'password'} value={confirmPass}
                      onChange={e => setConfirmPass(e.target.value)}
                      placeholder="Repeat password"
                      className="w-full pl-10 pr-4 py-3 rounded-xl text-sm" />
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 1: Security ── */}
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-white mb-1">Security Setup</h2>
                <p className="text-navy-200 text-sm mb-4">
                  Your 4-digit PIN protects withdrawals from your wallet.
                </p>

                <div>
                  <label className="block text-sm font-medium text-navy-100 mb-1.5">
                    Withdrawal PIN (4 digits)
                  </label>
                  <input
                    type="password" inputMode="numeric" maxLength={4}
                    value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="• • • •"
                    className="w-full px-4 py-3 rounded-xl text-sm text-center tracking-[0.5em]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-navy-100 mb-1.5">
                    Confirm PIN
                  </label>
                  <input
                    type="password" inputMode="numeric" maxLength={4}
                    value={confirmPin} onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="• • • •"
                    className="w-full px-4 py-3 rounded-xl text-sm text-center tracking-[0.5em]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-navy-100 mb-1.5">
                    Referral Code <span className="text-navy-200">(optional)</span>
                  </label>
                  <input
                    type="text" value={referralCode}
                    onChange={e => setReferralCode(e.target.value.toUpperCase())}
                    placeholder="e.g. ADEBAYO1234"
                    className="w-full px-4 py-3 rounded-xl text-sm uppercase tracking-wider"
                  />
                  <p className="text-navy-200 text-xs mt-1">
                    If someone referred you, enter their code to give them a bonus.
                  </p>
                </div>
              </div>
            )}

            {/* ── STEP 2: Profile photo + Terms ── */}
            {step === 2 && (
              <div className="space-y-5">
                <h2 className="text-lg font-semibold text-white mb-1">Almost done!</h2>
                <p className="text-navy-200 text-sm mb-4">
                  Add a profile photo and accept our terms.
                </p>

                {/* Avatar upload */}
                <div className="flex flex-col items-center gap-3">
                  <div
                    onClick={() => fileRef.current?.click()}
                    className="relative w-24 h-24 rounded-full border-2 border-dashed border-gold/40
                               flex items-center justify-center cursor-pointer hover:border-gold
                               transition-colors overflow-hidden bg-navy-500"
                  >
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        <Camera className="w-6 h-6 text-gold/60" />
                        <span className="text-xs text-navy-200">Add photo</span>
                      </div>
                    )}
                    <div className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-gold
                                    flex items-center justify-center">
                      <Camera className="w-3.5 h-3.5 text-navy-700" />
                    </div>
                  </div>
                  <input ref={fileRef} type="file" accept="image/*"
                    onChange={handleAvatarChange} className="hidden" />
                  <p className="text-navy-200 text-xs">Optional — max 2MB</p>
                </div>

                {/* Terms */}
                <div className="flex items-start gap-3 p-4 rounded-xl border border-navy-border bg-navy-500/50">
                  <button
                    type="button"
                    onClick={() => setAgreed(!agreed)}
                    className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center flex-shrink-0
                               border-2 transition-all ${agreed ? 'bg-gold border-gold' : 'border-navy-300'}`}
                  >
                    {agreed && <Check className="w-3 h-3 text-navy-700" />}
                  </button>
                  <p className="text-sm text-navy-100">
                    I agree to the{' '}
                    <span className="text-gold underline cursor-pointer">Terms of Service</span>
                    {' '}and{' '}
                    <span className="text-gold underline cursor-pointer">Privacy Policy</span>
                    {' '}of Ultimate Gig Hub.
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation buttons */}
        <div className="flex gap-3 mt-6">
          {step > 0 && (
            <button
              onClick={() => setStep(s => s - 1)}
              className="flex-1 py-3.5 rounded-xl border border-navy-border text-navy-100
                         font-semibold text-sm flex items-center justify-center gap-2
                         hover:border-gold/40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          )}
          <button
            onClick={step === STEPS.length - 1 ? handleRegister : nextStep}
            disabled={loading}
            className="flex-1 py-3.5 rounded-xl bg-gold text-navy-700 font-bold text-sm
                       flex items-center justify-center gap-2
                       hover:bg-gold-400 active:scale-95 transition-all disabled:opacity-60"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</>
            ) : step === STEPS.length - 1 ? (
              'Create Account'
            ) : (
              <>Next <ChevronRight className="w-4 h-4" /></>
            )}
          </button>
        </div>

        {/* Login link */}
        <p className="text-center text-navy-200 text-sm mt-5">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-gold font-semibold hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  )
}
