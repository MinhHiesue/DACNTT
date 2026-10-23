import { useState, useEffect, useCallback } from 'react'
import { fetchLatestSignal, fetchSignalsHistory, scanLatestSignal, fetchPatternInspector } from '../api/client.js'

export function useSignals(pollIntervalMs = 6000) {
  const [latestSignal, setLatestSignal] = useState(null)
  const [signalsHistory, setSignalsHistory] = useState([])
  const [patternInspector, setPatternInspector] = useState(null)
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState(null)

  const loadSignals = useCallback(async () => {
    try {
      const [latestRes, historyRes] = await Promise.all([
        fetchLatestSignal(),
        fetchSignalsHistory()
      ])

      if (latestRes) {
        setLatestSignal(latestRes)
      }
      if (historyRes?.signals) {
        setSignalsHistory(historyRes.signals)
      }
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const triggerScan = async () => {
    setScanning(true)
    try {
      const newSignal = await scanLatestSignal()
      if (newSignal) {
        setLatestSignal(newSignal)
        setSignalsHistory((prev) => [newSignal, ...prev.filter((s) => s.id !== newSignal.id)])
      }
      return newSignal
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setScanning(false)
    }
  }

  const loadInspector = async () => {
    try {
      const data = await fetchPatternInspector()
      setPatternInspector(data)
      return data
    } catch (err) {
      console.warn('Lỗi tải Pattern Inspector:', err.message)
    }
  }

  useEffect(() => {
    loadSignals()
    const timer = setInterval(loadSignals, pollIntervalMs)
    return () => clearInterval(timer)
  }, [loadSignals, pollIntervalMs])

  return {
    latestSignal,
    signalsHistory,
    patternInspector,
    loading,
    scanning,
    error,
    refresh: loadSignals,
    triggerScan,
    loadInspector
  }
}
