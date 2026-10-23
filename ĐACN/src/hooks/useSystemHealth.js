import { useState, useEffect, useCallback } from 'react'
import { fetchHealth } from '../api/client.js'

export function useSystemHealth(pollIntervalMs = 10000) {
  const [health, setHealth] = useState(null)
  const [online, setOnline] = useState(false)
  const [loading, setLoading] = useState(true)

  const checkHealth = useCallback(async () => {
    try {
      const data = await fetchHealth()
      if (data?.status === 'ok') {
        setHealth(data)
        setOnline(true)
      } else {
        setOnline(false)
      }
    } catch {
      setOnline(false)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    checkHealth()
    const timer = setInterval(checkHealth, pollIntervalMs)
    return () => clearInterval(timer)
  }, [checkHealth, pollIntervalMs])

  return { health, online, loading, checkHealth }
}
