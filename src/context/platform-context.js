import { createContext, useContext } from 'react'

export const PlatformContext = createContext(null)

export function usePlatformContext() {
  const context = useContext(PlatformContext)
  if (!context) {
    throw new Error('usePlatformContext deve ser usado dentro de PlatformProvider')
  }
  return context
}
