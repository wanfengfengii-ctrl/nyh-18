import type { FadingLevel, MuralArea, ObservationRecord, RiskAlert, RiskLevel } from '@/types'

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

function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

const areaDefinitions = [
  { areaCode: 'MOG-001', caveName: '第257窟', theme: '九色鹿本生', dynasty: '北魏', mainColors: '石青、赭石、土红', location: '窟内北壁', description: '九色鹿本生故事画，描绘了释迦牟尼佛前世化身为九色鹿救度众生的故事。画面色彩丰富，人物造型生动。' },
  { areaCode: 'MOG-002', caveName: '第257窟', theme: '飞天', dynasty: '北魏', mainColors: '石绿、朱砂', location: '窟顶藻井周围', description: '北魏时期飞天造型，身体姿态优美，衣带飘扬，展现了西域飞天向中原飞天演变的过渡形态。' },
  { areaCode: 'MOG-003', caveName: '第259窟', theme: '佛说法图', dynasty: '北魏', mainColors: '石青、金粉', location: '窟内正壁', description: '释迦牟尼佛说法图，佛像面容慈祥，衣纹流畅，两侧有胁侍菩萨和弟子。' },
  { areaCode: 'MOG-004', caveName: '第275窟', theme: '交脚弥勒像', dynasty: '北凉', mainColors: '赭石、土红', location: '窟内正壁', description: '北凉时期交脚弥勒菩萨像，是莫高窟最早的弥勒造像之一，造型古朴庄重。' },
  { areaCode: 'MOG-005', caveName: '第285窟', theme: '飞天', dynasty: '西魏', mainColors: '石青、石绿、朱砂', location: '窟顶四坡', description: '西魏时期飞天，受到中原文化影响，人物面容清秀，姿态飘逸。' },
  { areaCode: 'MOG-006', caveName: '第285窟', theme: '禅修图', dynasty: '西魏', mainColors: '黑石、白云母', location: '窟内南壁', description: '描绘僧人在山林中禅修的场景，背景有山峦、树木、动物，体现了禅定的宁静氛围。' },
  { areaCode: 'MOG-007', caveName: '第428窟', theme: '萨埵太子本生', dynasty: '北周', mainColors: '土红、赭石', location: '窟内东壁', description: '萨埵太子舍身饲虎本生故事画，是莫高窟规模最大的本生故事画之一。' },
  { areaCode: 'MOG-008', caveName: '第428窟', theme: '供养人像', dynasty: '北周', mainColors: '朱砂、铅丹', location: '窟内四壁下层', description: '北周时期供养人像，人物众多，服饰华丽，反映了当时贵族的生活风貌。' },
  { areaCode: 'MOG-009', caveName: '第45窟', theme: '观音像', dynasty: '唐代', mainColors: '石青、金粉', location: '窟内南壁', description: '唐代观音菩萨像，面容丰满，姿态优雅，是唐代壁画艺术的代表作。' },
  { areaCode: 'MOG-010', caveName: '第45窟', theme: '胡商遇盗图', dynasty: '唐代', mainColors: '石绿、赭石', location: '窟内南壁观音经变中', description: '描绘胡商在丝绸之路上遭遇盗贼，祈求观音菩萨保佑的场景，反映了当时丝绸之路的商贸活动。' },
  { areaCode: 'MOG-011', caveName: '第57窟', theme: '美人菩萨', dynasty: '唐代', mainColors: '金粉、朱砂、石青', location: '窟内南壁', description: '被誉为"美人菩萨"的观音像，面容姣好，装饰华丽，是唐代壁画中最精美的菩萨像之一。' },
  { areaCode: 'MOG-012', caveName: '第57窟', theme: '说法图', dynasty: '唐代', mainColors: '石青、石绿', location: '窟内北壁', description: '释迦牟尼佛说法图，画面构图严谨，人物众多，色彩鲜艳。' },
  { areaCode: 'MOG-013', caveName: '第220窟', theme: '维摩诘经变', dynasty: '唐代', mainColors: '赭石、铅丹', location: '窟内东壁', description: '维摩诘居士与文殊菩萨辩论的场景，人物神态生动，是唐代经变画的精品。' },
  { areaCode: 'MOG-014', caveName: '第220窟', theme: '乐舞图', dynasty: '唐代', mainColors: '朱砂、石绿', location: '窟内北壁药师经变中', description: '描绘唐代乐舞表演的场景，舞者姿态优美，乐队阵容庞大，反映了唐代音乐舞蹈的繁荣。' },
  { areaCode: 'MOG-015', caveName: '第320窟', theme: '西方净土变', dynasty: '唐代', mainColors: '石青、金粉、石绿', location: '窟内南壁', description: '描绘西方极乐世界的庄严景象，阿弥陀佛居中，周围有菩萨、天人、宝池、楼阁等。' },
  { areaCode: 'MOG-016', caveName: '第323窟', theme: '佛教史迹画', dynasty: '唐代', mainColors: '土红、黑石', location: '窟内南北两壁', description: '描绘佛教传入中国的历史故事，包括张骞出使西域、康僧会弘法等内容。' },
  { areaCode: 'MOG-017', caveName: '第130窟', theme: '南大像', dynasty: '唐代', mainColors: '赭石、土红', location: '窟内正壁', description: '高达26米的弥勒大佛，是莫高窟第二大佛，气势恢宏，造型庄严。' },
  { areaCode: 'MOG-018', caveName: '第158窟', theme: '涅槃像', dynasty: '中唐', mainColors: '石青、金粉', location: '窟内正壁', description: '释迦牟尼佛涅槃像，长约15米，佛像侧卧，神态安详，周围有弟子举哀。' },
  { areaCode: 'MOG-019', caveName: '第172窟', theme: '观无量寿经变', dynasty: '盛唐', mainColors: '石绿、朱砂、石青', location: '窟内南壁', description: '描绘西方极乐世界的庄严景象，画面层次分明，色彩绚丽，是盛唐经变画的代表作。' },
  { areaCode: 'MOG-020', caveName: '第196窟', theme: '劳度叉斗圣变', dynasty: '晚唐', mainColors: '赭石、铅丹、黑石', location: '窟内西壁', description: '描绘舍利弗与劳度叉斗法的故事，画面紧张激烈，人物形象生动。' },
  { areaCode: 'MOG-021', caveName: '第217窟', theme: '法华经变', dynasty: '盛唐', mainColors: '石青、石绿', location: '窟内南壁', description: '法华经变画，画面构图复杂，内容丰富，包括多个法华经中的故事场景。' },
  { areaCode: 'MOG-022', caveName: '第96窟', theme: '北大像', dynasty: '唐代', mainColors: '土红、金粉', location: '窟内正壁', description: '高达35.5米的弥勒大佛，是莫高窟第一大佛，也是世界上最大的室内泥塑佛像之一。' },
  { areaCode: 'MOG-023', caveName: '第16窟', theme: '藏经洞', dynasty: '晚唐', mainColors: '赭石、土红', location: '窟内甬道北壁', description: '藏经洞（第17窟）甬道壁画，描绘了洪辩法师的肖像和供养人像。' },
  { areaCode: 'MOG-024', caveName: '第3窟', theme: '千手千眼观音', dynasty: '元代', mainColors: '黑石、金粉', location: '窟内南壁', description: '元代千手千眼观音像，线描精湛，是莫高窟晚期壁画的精品。' },
  { areaCode: 'MOG-025', caveName: '第465窟', theme: '密宗曼陀罗', dynasty: '元代', mainColors: '石青、朱砂、金粉', location: '窟内四壁', description: '藏传佛教密宗曼陀罗壁画，色彩浓郁，构图繁复，是元代密宗艺术的珍品。' },
]

export const mockAreas: MuralArea[] = []
export const mockObservations: ObservationRecord[] = []
export const mockAlerts: RiskAlert[] = []

const now = new Date()

areaDefinitions.forEach((def, index) => {
  const areaId = `AREA_${String(index + 1).padStart(4, '0')}`
  const observationCount = Math.floor(Math.random() * 5) + 2
  const observations: ObservationRecord[] = []

  for (let i = 0; i < observationCount; i++) {
    const daysAgo = Math.floor(Math.random() * 180)
    const obsDate = addDays(now, -daysAgo)

    let fadingLevel: FadingLevel
    let crackLength: number

    if (i === 0) {
      fadingLevel = ['none', 'mild', 'moderate', 'severe'][Math.floor(Math.random() * 4)] as FadingLevel
      crackLength = Math.floor(Math.random() * 100)
    } else {
      const prevObs = observations[i - 1]
      const fadingOptions: FadingLevel[] = ['none', 'mild', 'moderate', 'severe']
      const prevFadingIndex = fadingOptions.indexOf(prevObs.fadingLevel)
      const change = Math.random() > 0.7 ? (Math.random() > 0.5 ? 1 : -1) : 0
      const newIndex = Math.max(0, Math.min(3, prevFadingIndex + change))
      fadingLevel = fadingOptions[newIndex]
      crackLength = Math.max(0, prevObs.crackLength + Math.floor((Math.random() - 0.3) * 10))
    }

    const riskLevel = calculateRiskLevelLocal(fadingLevel, crackLength)
    let processingStatus: 'pending' | 'processing' | 'completed'
    if (i === 0) {
      processingStatus = ['pending', 'processing', 'completed'][Math.floor(Math.random() * 3)] as 'pending' | 'processing' | 'completed'
    } else {
      processingStatus = riskLevel === 'low' ? 'completed' : riskLevel === 'high' ? 'processing' : 'pending'
    }

    observations.push({
      id: `OBS_${String(index + 1).padStart(4, '0')}_${String(i + 1).padStart(2, '0')}`,
      areaId,
      observationDate: formatDateLocal(obsDate),
      fadingLevel,
      crackLength,
      riskLevel,
      processingStatus,
      remarks: i === 0 ? `初次观察记录，${fadingLevel === 'severe' ? '病害较严重，需重点关注' : '状态良好，定期监测'}` : `第${i + 1}次复查，${fadingLevel !== observations[i - 1].fadingLevel ? '褪变情况有变化' : '褪变情况稳定'}，${crackLength !== observations[i - 1].crackLength ? '裂隙长度有变化' : '裂隙无明显变化'}。`,
      images: [],
      createdAt: obsDate.toISOString(),
      updatedAt: obsDate.toISOString(),
    })
  }

  observations.sort((a, b) => new Date(b.observationDate).getTime() - new Date(a.observationDate).getTime())

  const latestObs = observations[0]
  const firstObs = observations[observations.length - 1]
  const lastDate = new Date(latestObs.observationDate)
  const diffDays = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
  const isOverdue = diffDays > 90

  const area: MuralArea = {
    id: areaId,
    areaCode: def.areaCode,
    caveName: def.caveName,
    theme: def.theme,
    dynasty: def.dynasty,
    mainColors: def.mainColors,
    location: def.location,
    description: def.description,
    firstObservationDate: firstObs.observationDate,
    lastObservationDate: latestObs.observationDate,
    currentRiskLevel: latestObs.riskLevel,
    currentProcessingStatus: latestObs.processingStatus,
    observationCount,
    isOverdue,
    overdueDays: diffDays,
    createdAt: firstObs.createdAt,
    updatedAt: latestObs.updatedAt,
  }

  mockAreas.push(area)
  mockObservations.push(...observations)

  if (latestObs.riskLevel === 'high') {
    mockAlerts.push({
      id: `ALERT_${String(index + 1).padStart(4, '0')}_HR`,
      areaId,
      areaCode: def.areaCode,
      caveName: def.caveName,
      theme: def.theme,
      type: 'highRisk',
      title: '高风险预警',
      description: `检测到高风险：褪变等级${fadingLevelToText(latestObs.fadingLevel)}，裂隙${latestObs.crackLength}cm，需立即处理。`,
      riskLevel: 'high',
      createdAt: latestObs.observationDate,
      isRead: Math.random() > 0.5,
    })
  }

  if (isOverdue) {
    mockAlerts.push({
      id: `ALERT_${String(index + 1).padStart(4, '0')}_OD`,
      areaId,
      areaCode: def.areaCode,
      caveName: def.caveName,
      theme: def.theme,
      type: 'overdue',
      title: '超期未观察预警',
      description: `该区域已 ${diffDays} 天未进行观察记录，建议尽快安排复查。`,
      riskLevel: 'medium',
      createdAt: formatDateLocal(addDays(lastDate, 91)),
      isRead: Math.random() > 0.6,
    })
  }
})

function fadingLevelToText(level: FadingLevel): string {
  const map: Record<FadingLevel, string> = {
    none: '无褪变',
    mild: '轻微',
    moderate: '中度',
    severe: '严重',
  }
  return map[level]
}
