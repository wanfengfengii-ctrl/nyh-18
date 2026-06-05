import type { FadingLevel, MuralRecord, RiskLevel } from '@/types'

function calculateRiskLevelLocal(
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

function formatDateLocal(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function createMockRecord(
  index: number,
  areaCode: string,
  caveName: string,
  theme: string,
  dynasty: string,
  daysAgo: number,
  mainColors: string,
  fadingLevel: 'none' | 'mild' | 'moderate' | 'severe',
  crackLength: number,
  processingStatus: 'pending' | 'processing' | 'completed',
  remarks: string
): MuralRecord {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  const observationDate = formatDateLocal(date)
  const createdAt = date.toISOString()
  const updatedAt = date.toISOString()

  return {
    id: `REC_${String(index).padStart(4, '0')}_${Math.random().toString(36).substring(2, 6)}`,
    areaCode,
    caveName,
    theme,
    dynasty,
    observationDate,
    mainColors,
    fadingLevel,
    crackLength,
    processingStatus,
    riskLevel: calculateRiskLevelLocal(fadingLevel, crackLength),
    remarks,
    createdAt,
    updatedAt,
  }
}

export const mockRecords: MuralRecord[] = [
  createMockRecord(1, 'MOG-001', '第257窟', '九色鹿本生', '北魏', 3, '石青、赭石、土红', 'moderate', 25, 'processing', '壁画主体保存较好，右侧边缘有轻微裂隙，色彩有中度褪变迹象。'),
  createMockRecord(2, 'MOG-002', '第257窟', '飞天', '北魏', 7, '石绿、朱砂', 'mild', 12, 'pending', '飞天造型优美，色彩轻微褪变，需定期观察。'),
  createMockRecord(3, 'MOG-003', '第259窟', '佛说法图', '北魏', 10, '石青、金粉', 'severe', 65, 'processing', '主佛面部色彩严重褪变，右侧有较长裂隙，急需修复。'),
  createMockRecord(4, 'MOG-004', '第275窟', '交脚弥勒像', '北凉', 14, '赭石、土红', 'moderate', 30, 'pending', '弥勒像基座有裂隙蔓延，色彩中度褪变。'),
  createMockRecord(5, 'MOG-005', '第285窟', '飞天', '西魏', 5, '石青、石绿、朱砂', 'mild', 8, 'completed', '2024年修复完成，目前状态良好，继续监测。'),
  createMockRecord(6, 'MOG-006', '第285窟', '禅修图', '西魏', 21, '黑石、白云母', 'mild', 5, 'pending', '保存状态良好，仅有轻微自然老化。'),
  createMockRecord(7, 'MOG-007', '第428窟', '萨埵太子本生', '北周', 30, '土红、赭石', 'severe', 58, 'processing', '大面积色彩褪变，多处裂隙纵横，紧急修复中。'),
  createMockRecord(8, 'MOG-008', '第428窟', '供养人像', '北周', 45, '朱砂、铅丹', 'moderate', 22, 'pending', '供养人面部色彩褪变，衣纹保存较好。'),
  createMockRecord(9, 'MOG-009', '第45窟', '观音像', '唐代', 2, '石青、金粉', 'none', 0, 'completed', '保存完好，色彩鲜艳，无明显病害。'),
  createMockRecord(10, 'MOG-010', '第45窟', '胡商遇盗图', '唐代', 18, '石绿、赭石', 'moderate', 35, 'processing', '人物面部有中度褪变，画面中部有裂隙。'),
  createMockRecord(11, 'MOG-011', '第57窟', '美人菩萨', '唐代', 60, '金粉、朱砂、石青', 'severe', 72, 'pending', '菩萨像面部金箔严重脱落，色彩褪变严重，为特级保护对象。'),
  createMockRecord(12, 'MOG-012', '第57窟', '说法图', '唐代', 25, '石青、石绿', 'mild', 15, 'pending', '整体保存较好，边缘有轻微褪变。'),
  createMockRecord(13, 'MOG-013', '第220窟', '维摩诘经变', '唐代', 8, '赭石、铅丹', 'mild', 10, 'completed', '2023年完成修复，采用最新固色技术。'),
  createMockRecord(14, 'MOG-014', '第220窟', '乐舞图', '唐代', 12, '朱砂、石绿', 'moderate', 28, 'processing', '舞者衣带色彩褪变，地面有裂隙延伸。'),
  createMockRecord(15, 'MOG-015', '第320窟', '西方净土变', '唐代', 40, '石青、金粉、石绿', 'severe', 55, 'pending', '大殿建筑部分色彩严重褪变，多处起甲病害。'),
  createMockRecord(16, 'MOG-016', '第323窟', '佛教史迹画', '唐代', 50, '土红、黑石', 'moderate', 32, 'pending', '画面有烟熏痕迹，色彩中度褪变。'),
  createMockRecord(17, 'MOG-017', '第130窟', '南大像', '唐代', 90, '赭石、土红', 'severe', 80, 'processing', '大佛面部色彩严重风化，右手部有大型裂隙。'),
  createMockRecord(18, 'MOG-018', '第158窟', '涅槃像', '中唐', 35, '石青、金粉', 'moderate', 45, 'pending', '卧佛身体右侧有长裂隙，弟子像色彩褪变。'),
  createMockRecord(19, 'MOG-019', '第172窟', '观无量寿经变', '盛唐', 28, '石绿、朱砂、石青', 'mild', 18, 'completed', '2024年春季修复完成，画面清晰稳定。'),
  createMockRecord(20, 'MOG-020', '第196窟', '劳度叉斗圣变', '晚唐', 55, '赭石、铅丹、黑石', 'severe', 68, 'pending', '画面大面积空鼓，多处色彩脱落，需尽快抢救。'),
  createMockRecord(21, 'MOG-021', '第217窟', '法华经变', '盛唐', 15, '石青、石绿', 'mild', 6, 'pending', '山峦部分色彩轻微褪变，整体保存较好。'),
  createMockRecord(22, 'MOG-022', '第96窟', '北大像', '唐代', 100, '土红、金粉', 'severe', 95, 'processing', '大佛整体风化严重，正在进行大型修复工程。'),
  createMockRecord(23, 'MOG-023', '第16窟', '藏经洞', '晚唐', 3, '赭石、土红', 'none', 0, 'completed', '藏经洞甬道壁画，2025年最新检查，状态良好。'),
  createMockRecord(24, 'MOG-024', '第3窟', '千手千眼观音', '元代', 48, '黑石、金粉', 'moderate', 38, 'pending', '观音像手部有裂隙，线描部分保存较好。'),
  createMockRecord(25, 'MOG-025', '第465窟', '密宗曼陀罗', '元代', 65, '石青、朱砂、金粉', 'severe', 75, 'pending', '色彩丰富但褪变严重，多处地仗层空鼓。'),
]
