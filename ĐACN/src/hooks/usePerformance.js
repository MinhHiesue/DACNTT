import { useState, useEffect, useCallback } from 'react'
import { fetchPerformanceSummary, fetchPerformanceTrades } from '../api/client.js'

export function usePerformance(limit = 100) {
  const [summary, setSummary] = useState(null)
  const [trades, setTrades] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadPerformance = useCallback(async () => {
    setLoading(true)
    try {
      const [sumRes, tradesRes] = await Promise.all([
        fetchPerformanceSummary(),
        fetchPerformanceTrades(limit, 0)
      ])

      if (sumRes) {
        setSummary(sumRes)
      }
      if (tradesRes?.trades) {
        setTrades(tradesRes.trades)
      }
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [limit])

  useEffect(() => {
    loadPerformance()
  }, [loadPerformance])

  return { summary, trades, loading, error, refresh: loadPerformance }
}
