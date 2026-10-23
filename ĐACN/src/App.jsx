import { useEffect, useState } from 'react'
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout.jsx'
import { AISignalsPage } from './pages/AISignalsPage.jsx'
import { AuthPage } from './pages/AuthPage.jsx'
import { DashboardPage } from './pages/DashboardPage.jsx'
import { HelpPage } from './pages/HelpPage.jsx'
import { HistoryPage } from './pages/HistoryPage.jsx'
import { MarketAnalysisPage } from './pages/MarketAnalysisPage.jsx'
import { PerformancePage } from './pages/PerformancePage.jsx'
import { SettingsPage } from './pages/SettingsPage.jsx'
import { TelegramPage } from './pages/TelegramPage.jsx'
import { clearSession, getCurrentUser, loadSession, saveSession } from './data/authApi.js'

function RequireAuth({ session }) {
  const location = useLocation()

  return session ? <Outlet /> : <Navigate to="/login" replace state={{ from: location }} />
}

function RoutedPages({ session, onLogout }) {
  return (
    <AppLayout user={session.user} onLogout={onLogout}>
      {({ query, navigateToLabel, compactLayout, onCompactLayoutChange }) => (
        <Routes>
          <Route path="/" element={<Navigate to="/overview" replace />} />
          <Route path="/overview" element={<DashboardPage onNavigate={navigateToLabel} query={query} />} />
          <Route path="/market" element={<MarketAnalysisPage />} />
          <Route path="/signals" element={<AISignalsPage query={query} />} />
          <Route path="/history" element={<HistoryPage query={query} />} />
          <Route path="/performance" element={<PerformancePage />} />
          <Route path="/telegram" element={<TelegramPage />} />
          <Route path="/settings" element={<SettingsPage compactLayout={compactLayout} onCompactLayoutChange={onCompactLayoutChange} />} />
          <Route path="/help" element={<HelpPage onNavigate={navigateToLabel} />} />
          <Route path="*" element={<Navigate to="/overview" replace />} />
        </Routes>
      )}
    </AppLayout>
  )
}

export default function App() {
  const [session, setSession] = useState(loadSession)
  const [authReady, setAuthReady] = useState(false)
  const [authCheckError, setAuthCheckError] = useState('')
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function restoreSession() {
      if (!session) {
        setAuthReady(true)
        return
      }

      try {
        const user = await getCurrentUser(session.token)
        if (!cancelled) {
          const restoredSession = { ...session, user }
          setAuthCheckError('')
          saveSession(restoredSession)
          setSession(restoredSession)
        }
      } catch (error) {
        if (!cancelled) {
          if (error.status === 401) {
            clearSession()
            setSession(null)
          } else {
            setAuthCheckError('Không thể kết nối backend để xác minh phiên đăng nhập.')
          }
        }
      } finally {
        if (!cancelled) setAuthReady(true)
      }
    }

    restoreSession()
    return () => { cancelled = true }
  }, [retryCount])

  function handleAuthenticated(nextSession) {
    saveSession(nextSession)
    setSession(nextSession)
  }

  function handleLogout() {
    clearSession()
    setSession(null)
    setAuthCheckError('')
  }

  if (!authReady) {
    return <main className="auth-loading"><span className="online-pulse" /> ĐANG KIỂM TRA PHIÊN ĐĂNG NHẬP</main>
  }

  if (authCheckError) {
    return <main className="auth-loading auth-check-error"><p role="alert">{authCheckError}</p><button onClick={() => { setAuthReady(false); setRetryCount((count) => count + 1) }}>Thử kết nối lại</button><button onClick={handleLogout}>Về đăng nhập</button></main>
  }

  return (
    <Routes>
      <Route path="/login" element={session ? <Navigate to="/overview" replace /> : <AuthPage mode="login" onAuthenticated={handleAuthenticated} />} />
      <Route path="/register" element={session ? <Navigate to="/overview" replace /> : <AuthPage mode="register" onAuthenticated={handleAuthenticated} />} />
      <Route element={<RequireAuth session={session} />}>
        <Route path="/*" element={<RoutedPages session={session} onLogout={handleLogout} />} />
      </Route>
    </Routes>
  )
}
