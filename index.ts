export type UserRole = 'earner' | 'advertiser' | 'both' | 'admin'
export type SubmissionStatus = 'pending' | 'approved' | 'rejected'
export type CampaignStatus = 'pending' | 'active' | 'paused' | 'completed' | 'rejected'
export type TransactionType = 'earning' | 'withdrawal' | 'funding' | 'referral_bonus' | 'campaign_spend' | 'refund'
export type WithdrawalStatus = 'pending' | 'processing' | 'paid' | 'rejected'
export type NotificationType = 'task_approved' | 'task_rejected' | 'withdrawal_paid' | 'withdrawal_rejected' | 'campaign_approved' | 'campaign_rejected' | 'referral_bonus' | 'system' | 'funding'

export interface Profile {
  id: string
  full_name: string
  username: string
  email: string
  phone?: string
  avatar_url?: string
  role: UserRole
  withdrawal_pin?: string
  referral_code?: string
  referred_by?: string
  is_active: boolean
  is_banned: boolean
  ban_reason?: string
  created_at: string
  updated_at: string
}

export interface Wallet {
  id: string
  user_id: string
  balance: number
  total_earned: number
  total_withdrawn: number
  total_spent: number
  updated_at: string
}

export interface BankDetails {
  id: string
  user_id: string
  bank_name: string
  account_number: string
  account_name: string
  is_verified: boolean
  created_at: string
  updated_at: string
}

export interface SocialAccount {
  id: string
  user_id: string
  platform: string
  profile_url: string
  is_verified: boolean
  verified_at?: string
  created_at: string
}

export interface Task {
  id: string
  title: string
  description?: string
  platform: string
  action_type: string
  reward_amount: number
  total_spots: number
  filled_spots: number
  proof_required: string
  instructions?: string
  is_active: boolean
  campaign_id?: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface TaskSubmission {
  id: string
  task_id: string
  user_id: string
  proof_url?: string
  proof_link?: string
  status: SubmissionStatus
  rejection_reason?: string
  reward_paid?: number
  reviewed_by?: string
  reviewed_at?: string
  submitted_at: string
  task?: Task
}

export interface Campaign {
  id: string
  advertiser_id: string
  title: string
  platform: string
  action_type: string
  target_url: string
  description?: string
  budget: number
  cost_per_task: number
  total_spots: number
  filled_spots: number
  status: CampaignStatus
  rejection_reason?: string
  reviewed_by?: string
  reviewed_at?: string
  created_at: string
  updated_at: string
}

export interface Transaction {
  id: string
  user_id: string
  type: TransactionType
  amount: number
  balance_after: number
  description: string
  reference?: string
  status: string
  metadata?: Record<string, unknown>
  created_at: string
}

export interface WithdrawalRequest {
  id: string
  user_id: string
  amount: number
  bank_name: string
  account_number: string
  account_name: string
  status: WithdrawalStatus
  admin_note?: string
  processed_by?: string
  processed_at?: string
  created_at: string
  profile?: Profile
}

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  is_read: boolean
  metadata?: Record<string, unknown>
  created_at: string
}

export interface Referral {
  id: string
  referrer_id: string
  referred_id: string
  bonus_paid: boolean
  bonus_amount: number
  activated_at?: string
  created_at: string
}

// Social platforms supported
export const SOCIAL_PLATFORMS = [
  'Instagram', 'YouTube', 'TikTok', 'Twitter/X', 'Facebook',
  'Telegram', 'WhatsApp', 'Snapchat', 'LinkedIn', 'Pinterest',
  'Twitch', 'Discord', 'Reddit', 'Spotify', 'SoundCloud',
  'AppStore', 'PlayStore', 'Website'
] as const

export const NIGERIAN_BANKS = [
  'Access Bank', 'GTBank', 'First Bank', 'Zenith Bank', 'UBA',
  'Fidelity Bank', 'Union Bank', 'Sterling Bank', 'Stanbic IBTC',
  'Polaris Bank', 'Keystone Bank', 'Heritage Bank', 'Wema Bank',
  'Jaiz Bank', 'Ecobank', 'FCMB', 'Citibank', 'Standard Chartered',
  'OPay', 'PalmPay', 'Kuda Bank', 'Moniepoint', 'VFD Microfinance'
] as const
