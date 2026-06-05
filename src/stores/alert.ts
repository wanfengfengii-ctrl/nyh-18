import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { RiskAlert } from '@/types'
import { mockAlerts } from '@/utils/mockData'
import { generateId } from '@/utils'
import { loadFromStorage, saveToStorage } from '@/utils/storage'

const ALERTS_STORAGE_KEY = 'mural_alerts'

export const useAlertStore = defineStore('alert', () => {
  const alerts = ref<RiskAlert[]>(loadFromStorage(ALERTS_STORAGE_KEY, mockAlerts))

  const unreadAlerts = computed(() => alerts.value.filter((a) => !a.isRead))

  function getAlertsByAreaId(areaId: string): RiskAlert[] {
    return alerts.value.filter((a) => a.areaId === areaId)
  }

  function addAlert(data: Omit<RiskAlert, 'id' | 'createdAt' | 'isRead'>): RiskAlert {
    const now = new Date().toISOString()
    const newAlert: RiskAlert = {
      ...data,
      id: generateId(),
      createdAt: now,
      isRead: false,
    }
    alerts.value.unshift(newAlert)
    saveToStorage(ALERTS_STORAGE_KEY, alerts.value)
    return newAlert
  }

  function markAlertAsRead(id: string): boolean {
    const alert = alerts.value.find((a) => a.id === id)
    if (!alert) return false
    alert.isRead = true
    saveToStorage(ALERTS_STORAGE_KEY, alerts.value)
    return true
  }

  function markAllAlertsAsRead(): void {
    alerts.value.forEach((a) => (a.isRead = true))
    saveToStorage(ALERTS_STORAGE_KEY, alerts.value)
  }

  function deleteAlert(id: string): boolean {
    const index = alerts.value.findIndex((a) => a.id === id)
    if (index === -1) return false
    alerts.value.splice(index, 1)
    saveToStorage(ALERTS_STORAGE_KEY, alerts.value)
    return true
  }

  function deleteAlertsByAreaId(areaId: string): void {
    alerts.value = alerts.value.filter((a) => a.areaId !== areaId)
    saveToStorage(ALERTS_STORAGE_KEY, alerts.value)
  }

  function resetData(): void {
    alerts.value = [...mockAlerts]
    saveToStorage(ALERTS_STORAGE_KEY, alerts.value)
  }

  return {
    alerts,
    unreadAlerts,
    getAlertsByAreaId,
    addAlert,
    markAlertAsRead,
    markAllAlertsAsRead,
    deleteAlert,
    deleteAlertsByAreaId,
    resetData,
  }
})
