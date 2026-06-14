import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatDistanceToNow, format } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNaira(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
  }).format(amount)
}

export function formatCompactNaira(amount: number): string {
  if (amount >= 1_000_000) return `₦${(amount / 1_000_000).toFixed(1)}M`
  if (amount >= 1_000) return `₦${(amount / 1_000).toFixed(1)}K`
  return `₦${amount.toFixed(2)}`
}

export function timeAgo(date: string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function formatDate(date: string): string {
  return format(new Date(date), 'dd MMM yyyy, HH:mm')
}

export function formatShortDate(date: string): string {
  return format(new Date(date), 'dd MMM yyyy')
}

export function getPlatformColor(platform: string): string {
  const colors: Record<string, string> = {
    instagram:  '#E1306C',
    youtube:    '#FF0000',
    tiktok:     '#010101',
    'twitter/x':'#1DA1F2',
    facebook:   '#1877F2',
    telegram:   '#2CA5E0',
    whatsapp:   '#25D366',
    snapchat:   '#FFFC00',
    linkedin:   '#0A66C2',
    pinterest:  '#E60023',
    twitch:     '#9146FF',
    discord:    '#5865F2',
    reddit:     '#FF4500',
    spotify:    '#1DB954',
    soundcloud: '#FF5500',
  }
  return colors[platform.toLowerCase()] ?? '#F5C400'
}

export function getPlatformEmoji(platform: string): string {
  const emojis: Record<string, string> = {
    instagram:  '📸',
    youtube:    '▶️',
    tiktok:     '🎵',
    'twitter/x':'🐦',
    facebook:   '👤',
    telegram:   '✈️',
    whatsapp:   '💬',
    snapchat:   '👻',
    linkedin:   '💼',
    pinterest:  '📌',
    twitch:     '🎮',
    discord:    '🎙️',
    reddit:     '🤖',
    spotify:    '🎧',
    soundcloud: '🔊',
  }
  return emojis[platform.toLowerCase()] ?? '🌐'
}

export function generateUsername(fullName: string): string {
  return fullName
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 20) + Math.floor(Math.random() * 999)
}

export function maskAccountNumber(account: string): string {
  if (account.length <= 4) return account
  return '*'.repeat(account.length - 4) + account.slice(-4)
}
