import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Sidebar } from './Sidebar.jsx'
import { Topbar } from './Topbar.jsx'

export function AppLayout({ children }) {
  const [mobileNav, setMobileNav] = useState(false)
  const [query, setQuery] = useState('')
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const navigateToLabel = (label) => {
    const route = {
      'Tổng quan': '/overview',
      'Phân tích thị trường': '/market',
      'Tín hiệu AI': '/signals',
      'Lịch sử': '/history',
      'Hiệu suất mô hình': '/performance',
      'Telegram Bot': '/telegram',
      'Cài đặt': '/settings',
      'Trung tâm trợ giúp': '/help',
    }[label]
    if (route) navigate(route)
  }

  return (
    <div className="app-shell">
      <Sidebar mobileNav={mobileNav} onClose={() => setMobileNav(false)} />
      <main className="main-column">
        <Topbar pathname={pathname} query={query} onQueryChange={setQuery} onMenuOpen={() => setMobileNav(true)} />
        <div className="page-content">{children({ query, navigateToLabel })}</div>
      </main>
    </div>
  )
}
