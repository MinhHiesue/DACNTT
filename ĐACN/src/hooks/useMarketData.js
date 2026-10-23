import { useState, useEffect, useCallback } from 'react'
import { fetchKlines, fetchVolumeRegime } from '../api/client.js'

export function useMarketData(symbol = 'BTCUSDT', limit = 150, pollIntervalMs = 5000) {
  const [klines, setKlines] = useState([])
  const [volumeRegime, setVolumeRegime] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadData = useCallback(async () => {
    try {
      const [klinesRes, volRes] = await Promise.all([
        fetchKlines(symbol, limit),
        fetchVolumeRegime(symbol)
      ])

      if (klinesRes?.data) {
        setKlines(klinesRes.data)
      }
      if (volRes) {
        setVolumeRegime(volRes)
      }
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [symbol, limit])

  useEffect(() => {
    loadData()
    const timer = setInterval(loadData, pollIntervalMs)
    return () => clearInterval(timer)
  }, [loadData, pollIntervalMs])

  return { klines, volumeRegime, loading, error, refresh: loadData }
}
