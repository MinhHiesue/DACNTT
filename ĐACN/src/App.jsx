import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout.jsx'
import { AISignalsPage } from './pages/AISignalsPage.jsx'
import { DashboardPage } from './pages/DashboardPage.jsx'
import { HelpPage } from './pages/HelpPage.jsx'
import { HistoryPage } from './pages/HistoryPage.jsx'
import { MarketAnalysisPage } from './pages/MarketAnalysisPage.jsx'
import { PerformancePage } from './pages/PerformancePage.jsx'
import { SettingsPage } from './pages/SettingsPage.jsx'
import { TelegramPage } from './pages/TelegramPage.jsx'

function RoutedPages() {
  return (
    <AppLayout>
      {({ query, navigateToLabel }) => (
        <Routes>
          <Route path="/" element={<Navigate to="/overview" replace />} />
          <Route path="/overview" element={<DashboardPage onNavigate={navigateToLabel} query={query} />} />
          <Route path="/market" element={<MarketAnalysisPage />} />
          <Route path="/signals" element={<AISignalsPage query={query} />} />
          <Route path="/history" element={<HistoryPage query={query} />} />
          <Route path="/performance" element={<PerformancePage />} />
          <Route path="/telegram" element={<TelegramPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/help" element={<HelpPage onNavigate={navigateToLabel} />} />
          <Route path="*" element={<Navigate to="/overview" replace />} />
        </Routes>
      )}
    </AppLayout>
  )
}

export default function App() {
  return <RoutedPages />
}
