import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ObservationRecord, RiskTrendItem, ProcessingStatus } from '@/types'
import { mockObservations } from '@/utils/mockData'
import { generateId, calculateRiskLevel } from '@/utils'
import { loadFromStorage, saveToStorage } from '@/utils/storage'
import { useAreaStore } from './area'

const OBSERVATIONS_STORAGE_KEY = 'mural_observations'

export const useObservationStore = defineStore('observation', () => {
  const observations = ref<ObservationRecord[]>(loadFromStorage(OBSERVATIONS_STORAGE_KEY, mockObservations))
  const areaObservations = ref<ObservationRecord[]>([])

  function getObservationsByAreaId(areaId: string): ObservationRecord[] {
    return observations.value
      .filter((o) => o.areaId === areaId)
      .sort((a, b) => new Date(b.observationDate).getTime() - new Date(a.observationDate).getTime())
  }

  function getRiskTrendByAreaId(areaId: string): RiskTrendItem[] {
    return getObservationsByAreaId(areaId)
      .sort((a, b) => new Date(a.observationDate).getTime() - new Date(b.observationDate).getTime())
      .map((o) => ({
        date: o.observationDate,
        riskLevel: o.riskLevel,
        fadingLevel: o.fadingLevel,
        crackLength: o.crackLength,
      }))
  }

  function setAreaObservations(areaId: string): void {
    areaObservations.value = getObservationsByAreaId(areaId)
  }

  function clearAreaObservations(): void {
    areaObservations.value = []
  }

  function addObservation(
    areaId: string,
    data: Omit<ObservationRecord, 'id' | 'areaId' | 'riskLevel' | 'createdAt' | 'updatedAt'>
  ): ObservationRecord | null {
    const areaStore = useAreaStore()
    const area = areaStore.getAreaById(areaId)
    if (!area) return null

    const now = new Date().toISOString()
    const riskLevel = calculateRiskLevel(data.fadingLevel, data.crackLength)
    const newObservation: ObservationRecord = {
      ...data,
      id: generateId(),
      areaId,
      riskLevel,
      createdAt: now,
      updatedAt: now,
    }

    observations.value.unshift(newObservation)

    const areaObsList = getObservationsByAreaId(areaId)

    areaStore.updateArea(areaId, {
      currentRiskLevel: riskLevel,
      currentProcessingStatus: data.processingStatus,
      lastObservationDate: data.observationDate,
      observationCount: areaObsList.length,
    })

    saveToStorage(OBSERVATIONS_STORAGE_KEY, observations.value)

    areaObservations.value = getObservationsByAreaId(areaId)

    return newObservation
  }

  function updateObservation(
    id: string,
    data: Partial<Omit<ObservationRecord, 'id' | 'areaId' | 'createdAt'>>
  ): ObservationRecord | null {
    const index = observations.value.findIndex((o) => o.id === id)
    if (index === -1) return null

    const existing = observations.value[index]
    const fadingLevel = (data.fadingLevel as typeof existing.fadingLevel) || existing.fadingLevel
    const crackLength = data.crackLength !== undefined ? data.crackLength : existing.crackLength

    const updatedObservation: ObservationRecord = {
      ...existing,
      ...data,
      riskLevel: calculateRiskLevel(fadingLevel, crackLength),
      updatedAt: new Date().toISOString(),
    }

    observations.value[index] = updatedObservation
    saveToStorage(OBSERVATIONS_STORAGE_KEY, observations.value)

    const areaStore = useAreaStore()
    const area = areaStore.getAreaById(existing.areaId)
    if (area) {
      const areaObs = getObservationsByAreaId(existing.areaId)
      if (areaObs.length > 0 && areaObs[0].id === id) {
        areaStore.updateArea(existing.areaId, {
          currentRiskLevel: updatedObservation.riskLevel,
          currentProcessingStatus: updatedObservation.processingStatus,
        })
      }
    }

    areaObservations.value = getObservationsByAreaId(existing.areaId)

    return updatedObservation
  }

  function deleteObservation(id: string): boolean {
    const index = observations.value.findIndex((o) => o.id === id)
    if (index === -1) return false

    const observation = observations.value[index]
    observations.value.splice(index, 1)
    saveToStorage(OBSERVATIONS_STORAGE_KEY, observations.value)

    const areaStore = useAreaStore()
    const areaObs = getObservationsByAreaId(observation.areaId)
    if (areaObs.length > 0) {
      const latest = areaObs[0]
      areaStore.updateArea(observation.areaId, {
        currentRiskLevel: latest.riskLevel,
        currentProcessingStatus: latest.processingStatus,
        lastObservationDate: latest.observationDate,
        observationCount: areaObs.length,
      })
    }

    areaObservations.value = getObservationsByAreaId(observation.areaId)

    return true
  }

  function updateProcessingStatus(areaId: string, status: ProcessingStatus): boolean {
    const areaStore = useAreaStore()
    const area = areaStore.getAreaById(areaId)
    if (!area) return false

    areaStore.updateArea(areaId, { currentProcessingStatus: status })

    const areaObs = getObservationsByAreaId(areaId)
    if (areaObs.length > 0) {
      updateObservation(areaObs[0].id, { processingStatus: status })
    }

    return true
  }

  function resetData(): void {
    observations.value = [...mockObservations]
    saveToStorage(OBSERVATIONS_STORAGE_KEY, observations.value)
  }

  return {
    observations,
    areaObservations,
    getObservationsByAreaId,
    getRiskTrendByAreaId,
    setAreaObservations,
    clearAreaObservations,
    addObservation,
    updateObservation,
    deleteObservation,
    updateProcessingStatus,
    resetData,
  }
})
