export type FadingLevel = 'none' | 'mild' | 'moderate' | 'severe'

export type ProcessingStatus = 'pending' | 'processing' | 'completed'

export type RiskLevel = 'low' | 'medium' | 'high'

export interface MuralRecord {
  id: string
  areaCode: string
  caveName: string
  theme: string
  dynasty: string
  observationDate: string
  mainColors: string
  fadingLevel: FadingLevel
  crackLength: number
  processingStatus: ProcessingStatus
  riskLevel: RiskLevel
  remarks: string
  createdAt: string
  updatedAt: string
}

export interface FilterParams {
  caveName: string
  dynasty: string
  riskLevel: RiskLevel | ''
  processingStatus: ProcessingStatus | ''
  keyword: string
}

export interface DashboardStats {
  totalRecords: number
  pendingCount: number
  highRiskCount: number
  monthlyNewCount: number
  riskDistribution: { name: string; value: number }[]
  dynastyDistribution: { name: string; value: number }[]
  fadingTrend: { date: string; count: number }[]
  processingProgress: { name: string; value: number }[]
}

export const FADING_LEVEL_OPTIONS: { value: FadingLevel; label: string }[] = [
  { value: 'none', label: '无褪变' },
  { value: 'mild', label: '轻微' },
  { value: 'moderate', label: '中度' },
  { value: 'severe', label: '严重' },
]

export const PROCESSING_STATUS_OPTIONS: { value: ProcessingStatus; label: string }[] = [
  { value: 'pending', label: '未处理' },
  { value: 'processing', label: '处理中' },
  { value: 'completed', label: '已完成' },
]

export const RISK_LEVEL_OPTIONS: { value: RiskLevel; label: string; color: string }[] = [
  { value: 'low', label: '低风险', color: '#67C23A' },
  { value: 'medium', label: '中风险', color: '#E6A23C' },
  { value: 'high', label: '高风险', color: '#F56C6C' },
]

export const DYNASTY_OPTIONS: string[] = [
  '北魏',
  '西魏',
  '北周',
  '隋代',
  '唐代',
  '五代',
  '宋代',
  '西夏',
  '元代',
  '明代',
  '清代',
]

export const CAVE_OPTIONS: string[] = [
  '第257窟',
  '第259窟',
  '第275窟',
  '第285窟',
  '第320窟',
  '第323窟',
  '第428窟',
  '第45窟',
  '第57窟',
  '第96窟',
  '第130窟',
  '第158窟',
  '第172窟',
  '第196窟',
  '第217窟',
  '第220窟',
]

export const THEME_OPTIONS: string[] = [
  '九色鹿本生',
  '尸毗王本生',
  '萨埵太子本生',
  '须达拏太子本生',
  '西方净土变',
  '东方药师变',
  '弥勒经变',
  '法华经变',
  '维摩诘经变',
  '金刚经变',
  '报恩经变',
  '天请问经变',
  '观无量寿经变',
  '文殊普贤变',
  '劳度叉斗圣变',
  '飞天',
  '供养人像',
  '山水图',
]

export const COLOR_OPTIONS: string[] = [
  '石青',
  '石绿',
  '赭石',
  '朱砂',
  '铅丹',
  '金粉',
  '银粉',
  '黑石',
  '白云母',
  '土红',
]
