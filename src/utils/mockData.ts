import type {
  FadingLevel,
  MuralArea,
  ObservationRecord,
  RiskAlert,
  RiskLevel,
  DiseasePoint,
  EvidencePhoto,
  ImageComparison,
  TreatmentRecord,
  CrackExtension,
  ColorSample,
  Inspector,
  InspectionPlan,
  InspectionTask,
  InspectionTaskCheckItem,
} from '@/types'

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

function generateId(prefix: string, num: number): string {
  return `${prefix}_${String(num).padStart(4, '0')}`
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

export const mockDiseasePoints: DiseasePoint[] = []
export const mockEvidencePhotos: EvidencePhoto[] = []
export const mockImageComparisons: ImageComparison[] = []
export const mockTreatmentRecords: TreatmentRecord[] = []
export const mockCrackExtensions: CrackExtension[] = []
export const mockColorSamples: ColorSample[] = []

let diseasePointIndex = 0
let photoIndex = 0
let comparisonIndex = 0
let treatmentIndex = 0

areaDefinitions.forEach((def, areaIndex) => {
  const areaId = `AREA_${String(areaIndex + 1).padStart(4, '0')}`
  const areaObs = mockObservations.filter((o) => o.areaId === areaId)

  areaObs.forEach((obs, obsIndex) => {
    const diseaseCount = Math.floor(Math.random() * 4) + 1
    for (let i = 0; i < diseaseCount; i++) {
      const types = ['crack', 'fading', 'peeling', 'mold', 'salt', 'damage', 'other'] as const
      const type = types[Math.floor(Math.random() * types.length)]
      diseasePointIndex++
      mockDiseasePoints.push({
        id: generateId('DP', diseasePointIndex),
        areaId,
        observationId: obs.id,
        type,
        name: `${diseaseTypeToText(type)}点位${i + 1}`,
        x: Math.floor(Math.random() * 80) + 10,
        y: Math.floor(Math.random() * 80) + 10,
        width: Math.floor(Math.random() * 20) + 5,
        height: Math.floor(Math.random() * 20) + 5,
        description: `${diseaseTypeToText(type)}病害，${['轻微', '中度', '严重'][Math.floor(Math.random() * 3)]}程度`,
        severity: (['mild', 'moderate', 'severe'] as const)[Math.floor(Math.random() * 3)],
        createdAt: obs.observationDate,
        updatedAt: obs.observationDate,
      })
    }

    photoIndex++
    const photoDate = addDays(new Date(obs.observationDate), Math.floor(Math.random() * 10))
    mockEvidencePhotos.push({
      id: generateId('PHOTO', photoIndex),
      areaId,
      observationId: obs.id,
      fileName: `${def.areaCode}_${obs.observationDate.replace(/-/g, '')}_${obsIndex + 1}.jpg`,
      fileUrl: `https://picsum.photos/seed/${areaId}_${obsIndex}/800/600`,
      thumbnailUrl: `https://picsum.photos/seed/${areaId}_${obsIndex}/200/150`,
      photoDate: obs.observationDate,
      uploadDate: formatDateLocal(photoDate),
      uploadedBy: '张研究员',
      description: `${obs.observationDate} 现场拍摄照片`,
      isProcessed: Math.random() > 0.3,
    })
  })

  if (areaObs.length >= 2) {
    comparisonIndex++
    const beforeObs = areaObs[areaObs.length - 1]
    const afterObs = areaObs[0]
    const changeTypes = ['stable', 'improved', 'worsened', 'new'] as const
    const changeType = changeTypes[Math.floor(Math.random() * changeTypes.length)]
    mockImageComparisons.push({
      id: generateId('COMP', comparisonIndex),
      areaId,
      beforeImage: mockEvidencePhotos.find((p) => p.observationId === beforeObs.id)! || mockEvidencePhotos[0],
      afterImage: mockEvidencePhotos.find((p) => p.observationId === afterObs.id)! || mockEvidencePhotos[0],
      diseasePoints: mockDiseasePoints.filter((d) => d.areaId === areaId),
      changeAnalysis: `对比 ${beforeObs.observationDate} 与 ${afterObs.observationDate} 的影像变化分析显示：${changeType === 'improved' ? '病害情况有所改善' : changeType === 'worsened' ? '病害情况有所恶化' : changeType === 'new' ? '发现新增病害' : '状态基本稳定'}`,
      changeType,
      createdBy: '李研究员',
      createdAt: formatDateLocal(new Date()),
    })
  }

  treatmentIndex++
  mockTreatmentRecords.push({
    id: generateId('TREAT', treatmentIndex),
    areaId,
    observationId: areaObs[0].id,
    title: `${def.theme} 修复方案`,
    status: ['proposed', 'inProgress', 'completed', 'verified'][Math.floor(Math.random() * 4)] as any,
    proposedBy: '王工程师',
    approvedBy: Math.random() > 0.5 ? '李主任' : null,
    startDate: Math.random() > 0.3 ? formatDateLocal(addDays(new Date(areaObs[0].observationDate), 7)) : null,
    completedDate: Math.random() > 0.6 ? formatDateLocal(addDays(new Date(areaObs[0].observationDate), 30)) : null,
    steps: [
      { id: 'STEP_001', step: 1, description: '表面清洁除尘', operator: '张工', completedAt: formatDateLocal(addDays(new Date(areaObs[0].observationDate), 1)), images: [], remarks: '已完成表面灰尘清理' },
      { id: 'STEP_002', step: 2, description: '病害加固处理', operator: '李工', completedAt: formatDateLocal(addDays(new Date(areaObs[0].observationDate), 5)), images: [], remarks: '使用专用加固剂进行加固' },
      { id: 'STEP_003', step: 3, description: '补色修复', operator: '王工', completedAt: null, images: [], remarks: '' },
    ],
    materials: '专用加固剂、矿物颜料、黏合剂',
    description: '针对该区域的病害情况，制定详细的修复方案包括表面清洁、病害加固和补色修复三个主要步骤。',
    createdAt: formatDateLocal(new Date(areaObs[0].observationDate)),
    updatedAt: formatDateLocal(new Date()),
  })
})

function diseaseTypeToText(type: string): string {
  const map: Record<string, string> = {
    crack: '裂隙',
    fading: '褪变',
    peeling: '起甲',
    mold: '霉斑',
    salt: '盐析',
    damage: '破损',
    other: '其他',
  }
  return map[type] || type
}

export const mockInspectors: Inspector[] = [
  { id: 'INS_001', name: '张明远', avatar: '', department: '壁画保护科', phone: '13800138001', email: 'zhangmy@mogao.com', specialty: ['壁画修复', '病害分析'], taskCount: 45, completedCount: 38, workload: 85 },
  { id: 'INS_002', name: '李淑华', avatar: '', department: '文物修复室', phone: '13800138002', email: 'lish@mogao.com', specialty: ['颜料分析', '影像记录'], taskCount: 38, completedCount: 35, workload: 72 },
  { id: 'INS_003', name: '王建国', avatar: '', department: '监测中心', phone: '13800138003', email: 'wangjg@mogao.com', specialty: ['环境监测', '结构检测'], taskCount: 52, completedCount: 48, workload: 92 },
  { id: 'INS_004', name: '陈思雨', avatar: '', department: '壁画保护科', phone: '13800138004', email: 'chensy@mogao.com', specialty: ['壁画修复', '颜料分析'], taskCount: 32, completedCount: 29, workload: 65 },
  { id: 'INS_005', name: '刘志强', avatar: '', department: '研究室', phone: '13800138005', email: 'liuzq@mogao.com', specialty: ['病害分析', '结构检测'], taskCount: 28, completedCount: 26, workload: 58 },
  { id: 'INS_006', name: '赵晓燕', avatar: '', department: '保管部', phone: '13800138006', email: 'zhaoxy@mogao.com', specialty: ['影像记录', '环境监测'], taskCount: 41, completedCount: 37, workload: 78 },
]

const standardCheckItems: InspectionTaskCheckItem[] = [
  { id: 'CI_001', name: '表面状态检查', description: '检查壁画表面是否有灰尘、污渍等', isRequired: true, isChecked: false },
  { id: 'CI_002', name: '颜料层检查', description: '检查颜料层是否有起甲、脱落等现象', isRequired: true, isChecked: false },
  { id: 'CI_003', name: '裂隙检查', description: '检查是否有新的裂隙或裂隙扩展', isRequired: true, isChecked: false },
  { id: 'CI_004', name: '霉斑检查', description: '检查是否有霉斑滋生', isRequired: false, isChecked: false },
  { id: 'CI_005', name: '盐析检查', description: '检查是否有盐析现象', isRequired: false, isChecked: false },
  { id: 'CI_006', name: '环境温湿度记录', description: '记录当前环境的温度和湿度', isRequired: true, isChecked: false },
]

export const mockInspectionPlans: InspectionPlan[] = []
export const mockInspectionTasks: InspectionTask[] = []

const cavePlans = [
  { caveName: '第257窟', planName: '第257窟日常巡检计划', cycleType: 'weekly' as const, areas: [0, 1] },
  { caveName: '第259窟', planName: '第259窟定期巡检计划', cycleType: 'biweekly' as const, areas: [2] },
  { caveName: '第275窟', planName: '第275窟重点保护计划', cycleType: 'weekly' as const, areas: [3] },
  { caveName: '第285窟', planName: '第285窟综合巡检计划', cycleType: 'weekly' as const, areas: [4, 5] },
  { caveName: '第428窟', planName: '第428窟月度巡检计划', cycleType: 'monthly' as const, areas: [6, 7] },
  { caveName: '第45窟', planName: '第45窟日常巡检计划', cycleType: 'weekly' as const, areas: [8, 9] },
  { caveName: '第57窟', planName: '第57窟重点监测计划', cycleType: 'daily' as const, areas: [10, 11] },
  { caveName: '第220窟', planName: '第220窟季度巡检计划', cycleType: 'quarterly' as const, areas: [12, 13] },
]

let planIndex = 0
let taskIndex = 0

cavePlans.forEach((planDef, planIdx) => {
  planIndex++
  const assignees = mockInspectors.slice(planIdx % 3, (planIdx % 3) + 2).map((i) => i.id)
  const startDate = addDays(now, -30)

  const plan: InspectionPlan = {
    id: `PLAN_${String(planIndex).padStart(4, '0')}`,
    planName: planDef.planName,
    caveName: planDef.caveName,
    areaIds: planDef.areas.map((i) => `AREA_${String(i + 1).padStart(4, '0')}`),
    cycleType: planDef.cycleType,
    startDate: formatDateLocal(startDate),
    assigneeIds: assignees,
    priority: planDef.cycleType === 'daily' ? 'high' : planDef.cycleType === 'weekly' ? 'medium' : 'low',
    reminderDays: 1,
    description: `${planDef.caveName}${planDef.cycleType === 'daily' ? '每日' : planDef.cycleType === 'weekly' ? '每周' : '定期'}巡检计划，确保壁画保存状态良好。`,
    createdBy: '系统管理员',
    createdAt: formatDateLocal(startDate),
    updatedAt: formatDateLocal(now),
    isActive: true,
  }
  mockInspectionPlans.push(plan)

  const taskCount = planDef.cycleType === 'daily' ? 15 : planDef.cycleType === 'weekly' ? 8 : 3

  for (let t = 0; t < taskCount; t++) {
    const isFuture = t < 2
    const isPast = t >= taskCount - 2
    const isCurrent = !isFuture && !isPast

    let status: InspectionTask['status']
    if (isFuture) {
      status = 'pending'
    } else if (isPast) {
      status = Math.random() > 0.1 ? 'completed' : 'overdue'
    } else {
      status = Math.random() > 0.5 ? 'inProgress' : 'pending'
    }

    const assignee = mockInspectors[taskIndex % mockInspectors.length]
    const areaIdx = planDef.areas[taskIndex % planDef.areas.length]
    const area = areaDefinitions[areaIdx]
    const areaId = `AREA_${String(areaIdx + 1).padStart(4, '0')}`
    const scheduledDate = addDays(now, (t - taskCount / 2) * (planDef.cycleType === 'daily' ? 1 : planDef.cycleType === 'weekly' ? 7 : 30))

    taskIndex++

    const checkItems = standardCheckItems.map((ci) => ({
      ...ci,
      id: `${ci.id}_${taskIndex}`,
      isChecked: status === 'completed',
    }))

    const hasAbnormality = status === 'completed' && Math.random() > 0.7

    const task: InspectionTask = {
      id: `TASK_${String(taskIndex).padStart(4, '0')}`,
      planId: plan.id,
      taskName: `${planDef.caveName} - ${area.theme} 巡检`,
      caveName: planDef.caveName,
      areaId,
      areaCode: area.areaCode,
      assigneeId: assignee.id,
      assigneeName: assignee.name,
      status,
      priority: plan.priority,
      scheduledDate: formatDateLocal(scheduledDate),
      dueDate: formatDateLocal(addDays(scheduledDate, 1)),
      startedAt: status !== 'pending' ? formatDateLocal(scheduledDate) : undefined,
      completedAt: status === 'completed' ? formatDateLocal(addDays(scheduledDate, Math.random() > 0.5 ? 0 : 1)) : undefined,
      checkItems,
      findings: status === 'completed' ? (hasAbnormality ? '检查发现部分区域存在异常，已记录并上报。' : '检查完成，壁画状态良好，未发现明显异常。') : '',
      hasAbnormality,
      abnormalityDescription: hasAbnormality ? '发现局部颜料层有轻微起甲现象，建议进一步观察。' : undefined,
      photos: status === 'completed' ? [`https://picsum.photos/seed/task${taskIndex}/800/600`] : [],
      createdBy: '系统',
      createdAt: formatDateLocal(addDays(scheduledDate, -7)),
      updatedAt: formatDateLocal(now),
    }
    mockInspectionTasks.push(task)
  }
})
