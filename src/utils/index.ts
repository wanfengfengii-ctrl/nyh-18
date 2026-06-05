import type { FadingLevel, RiskLevel } from '@/types'

export function generateId(): string {
  return `REC_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

export function calculateRiskLevel(
  fadingLevel: FadingLevel,
  crackLength: number
): RiskLevel {
  if (fadingLevel === 'severe' || crackLength > 50) {
    return 'high'
  }
  if (fadingLevel === 'moderate' || (crackLength >= 20 && crackLength <= 50)) {
    return 'medium'
  }
  return 'low'
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function getCurrentDate(): string {
  return formatDate(new Date())
}

export function getMonthStartDate(): string {
  const date = new Date()
  date.setDate(1)
  return formatDate(date)
}

export function getRiskLabel(level: RiskLevel): string {
  const labels: Record<RiskLevel, string> = {
    low: '低风险',
    medium: '中风险',
    high: '高风险',
  }
  return labels[level]
}

export function getRiskColor(level: RiskLevel): string {
  const colors: Record<RiskLevel, string> = {
    low: '#67C23A',
    medium: '#E6A23C',
    high: '#F56C6C',
  }
  return colors[level]
}

export function getFadingLabel(level: FadingLevel): string {
  const labels: Record<FadingLevel, string> = {
    none: '无褪变',
    mild: '轻微',
    moderate: '中度',
    severe: '严重',
  }
  return labels[level]
}

export function getProcessingLabel(status: 'pending' | 'processing' | 'completed'): string {
  const labels = {
    pending: '未处理',
    processing: '处理中',
    completed: '已完成',
  }
  return labels[status]
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null
  return function (...args: Parameters<T>) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}
