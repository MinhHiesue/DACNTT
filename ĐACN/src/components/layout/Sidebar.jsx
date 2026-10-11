import {
  Activity,
  ArrowRight,
  Bot,
  Boxes,
  CandlestickChart,
  ChevronDown,
  CircleHelp,
  Clock3,
  Gem,
  LayoutDashboard,
  Settings2,
  Signal,
  X,
} from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'

const navGroups = [
  {
    title: 'WORKSPACE',
    items: [
      { label: 'Tổng quan', path: '/overview', icon: LayoutDashboard },
      { label: 'Phân tích thị trường', path: '/market', icon: CandlestickChart },
      { label: 'Tín hiệu AI', path: '/signals', icon: Signal, count: '4' },
      { label: 'Lịch sử', path: '/history', icon: Clock3 },
    ],
  },
  {
    title: 'HỆ THỐNG',
    items: [
      { label: 'Hiệu suất mô hình', path: '/performance', icon: Activity },
      { label: 'Telegram Bot', path: '/telegram', icon: Bot, status: true },
      { label: 'Cài đặt', path: '/settings', icon: Settings2 },
    ],
  },
]

export function Sidebar({ mobileNav, onClose }) {
  const navigate = useNavigate()

  return (
    <>
      {mobileNav && <button className="scrim" aria-label="Đóng điều hướng" onClick={onClose} />}
      <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}>
        <div className="brand-row">
          <div className="brand-mark"><Gem size={19} strokeWidth={1.8} /></div>
          <div className="brand-copy"><span className="brand-name">NORTHSTAR</span><span className="brand-sub">MARKET INTELLIGENCE</span></div>
          <button className="icon-button sidebar-close" aria-label="Đóng menu" onClick={onClose}><X size={17} /></button>
        </div>
        <button className="workspace-picker" onClick={() => { navigate('/settings'); onClose() }}>
          <span className="workspace-avatar">N</span>
          <span className="workspace-meta"><strong>Northstar Desk</strong><span>Gói cá nhân · Miễn phí</span></span>
          <ChevronDown size={15} />
        </button>
        <div className="nav-area">
          {navGroups.map((group) => (
            <section className="nav-group" key={group.title}>
              <div className="nav-heading">{group.title}</div>
              {group.items.map(({ label, path, icon: Icon, count, status }) => (
                <NavLink
                  key={path}
                  to={path}
                  onClick={onClose}
                  className={({ isActive }) => `nav-item ${isActive ? 'nav-active' : ''}`}
                >
                  <Icon size={17} strokeWidth={1.8} />
                  <span>{label}</span>
                  {count && <span className="nav-count">{count}</span>}
                  {status && <span className="nav-status-dot" />}
                </NavLink>
              ))}
            </section>
          ))}
        </div>
        <div className="sidebar-bottom">
          <div className="quota-card">
            <div className="quota-top"><span><Boxes size={14} /> Tín hiệu hôm nay</span><strong>12 <small>/ 30</small></strong></div>
            <div className="quota-track"><span /></div>
            <div className="quota-foot">Làm mới sau 13 giờ</div>
          </div>
          <NavLink className="help-link" to="/help" onClick={onClose}>
            <CircleHelp size={16} /> Trung tâm trợ giúp <ArrowRight size={14} />
          </NavLink>
          <div className="sidebar-foot"><span className="online-pulse" /> Tất cả hệ thống ổn định <span className="version">v1.0.4</span></div>
        </div>
      </aside>
    </>
  )
}
