import { useState } from 'react'
import { Bell, Check, Command, LogOut, Menu, Search, Settings2, ChevronDown, Zap } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const PAGE_TITLES = {
  '/overview': 'Tổng quan',
  '/market': 'Phân tích thị trường',
  '/signals': 'Tín hiệu AI',
  '/history': 'Lịch sử',
  '/performance': 'Hiệu suất mô hình',
  '/telegram': 'Telegram Bot',
  '/settings': 'Cài đặt',
  '/help': 'Trung tâm trợ giúp',
}

export function Topbar({ pathname, query, onQueryChange, onMenuOpen, user, onLogout }) {
  const [noticeOpen, setNoticeOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const navigate = useNavigate()
  const initials = user.name.split(/\s+/).map((part) => part[0]).slice(-2).join('').toUpperCase()

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="icon-button mobile-menu" aria-label="Mở menu" onClick={onMenuOpen}><Menu size={20} /></button>
        <div className="breadcrumbs"><span>Workspace</span><span className="crumb-slash">/</span><strong>{PAGE_TITLES[pathname] ?? 'Tổng quan'}</strong></div>
      </div>
      <div className="topbar-actions">
        <label className="search-box"><Search size={16} /><input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Tìm cặp giao dịch..." /><kbd><Command size={11} /> K</kbd></label>
        <div className="topbar-divider" />
        <div className="popover-wrap">
          <button className={`icon-button notification-button ${noticeOpen ? 'button-selected' : ''}`} aria-label="Thông báo" onClick={() => setNoticeOpen(!noticeOpen)}><Bell size={18} /><i /></button>
          {noticeOpen && <div className="popover notification-pop"><div className="popover-title">Thông báo <span>2 mới</span></div><div className="notice-item"><span className="notice-icon gold-notice"><Zap size={14} /></span><div><strong>Tín hiệu XAU/USDT M5 mới</strong><p>XAU/USDT · BUY · Độ tin cậy 88.5%</p><small>Vừa phát hiện</small></div></div><div className="notice-item"><span className="notice-icon blue-notice"><Check size={14} /></span><div><strong>Bot Telegram đã kết nối</strong><p>Thông báo sẽ được gửi tức thì</p><small>18 phút trước</small></div></div></div>}
        </div>
        <div className="popover-wrap">
          <button className="profile-button" onClick={() => setProfileOpen(!profileOpen)}><span className="profile-avatar">{initials}</span><span className="profile-name">{user.name}</span><ChevronDown size={14} /></button>
          {profileOpen && <div className="popover profile-pop"><div className="profile-pop-name">{user.name}</div><div className="profile-pop-email">{user.email}</div><button onClick={() => { setProfileOpen(false); navigate('/settings') }}><Settings2 size={14} /> Tùy chọn tài khoản</button><button className="profile-logout" onClick={() => { setProfileOpen(false); onLogout() }}><LogOut size={14} /> Đăng xuất</button></div>}
        </div>
      </div>
    </header>
  )
}
