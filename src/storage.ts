import { formatValue } from "./enhancement";
import { Context, StorageType, TimeType } from "./helper";
import type { StorageCallback } from './helper'
export function storageCacheFactory(ctx: Context, storageType: StorageType) {

  const useStorage = (callback: StorageCallback) => {
    if (typeof window === 'undefined') {
      console.warn('Warning: Running in a non-browser environment.');
      return
    }

    const storage = storageType === StorageType.LOCAL ? localStorage : sessionStorage
    return callback?.(storage)
  }

  function setItem(key: string, value: string): void
  function setItem(key: string, value: string, expired: number): void
  function setItem(key: string, value: string, timeType: TimeType, expired: number): void

  function setItem() {
    const args = arguments

    useStorage((storage) => {
      let timeType: TimeType | undefined, expired: number | undefined
      const namespaceKey = ctx.namespace + args[0]
      if (args.length === 3) {
        expired = args[2]
      } else if (args.length === 4) {
        timeType = args[2]
        expired = args[3]
      }
      const params = ([args[1], timeType, expired]).filter(Boolean) as [string, TimeType, number]
      storage.setItem(namespaceKey, formatValue.apply(null, params))
    })
  }

  function getItem(key: string): string | null {
    return useStorage((storage) => {
      const namespaceKey = ctx.namespace + key
      const value = storage.getItem(namespaceKey)
      if (!value) {
        return null
      }
      const target = JSON.parse(value)

      if (target.expiredTime && target.expiredTime < Date.now()) {
        storage.removeItem(namespaceKey)
        return null
      }
      return target.value
    })
  }

  function removeItem(key: string) {
    useStorage(storage => {
      const namespaceKey = ctx.namespace + key
      storage.removeItem(namespaceKey)
    })
  }

  function clear() {
    useStorage(storage => [
      Object.keys(storage).filter(key => {
        return key.startsWith(ctx.namespace)
      }).forEach(key => storage.removeItem(key))
    ])
  }

  return { setItem, clear, getItem, removeItem }
}
