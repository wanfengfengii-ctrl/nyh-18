export function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const data = localStorage.getItem(key)
    if (data) {
      return JSON.parse(data) as T
    }
  } catch (e) {
    console.error(`Failed to load ${key} from storage:`, e)
  }
  return fallback
}

export function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (e) {
    console.error(`Failed to save ${key} to storage:`, e)
  }
}

export function getStorageKey(module: string, type: string): string {
  return `mural_${module}_${type}`
}
