const TABS = ['Chung', 'Tín hiệu', 'Thông báo']

export function SettingsTabs({ activeTab, onChange }) {
  return (
    <nav className="settings-tabs" aria-label="Nhóm cài đặt">
      {TABS.map((tab) => <button key={tab} className={activeTab === tab ? 'settings-tab-active' : ''} onClick={() => onChange(tab)}>{tab}</button>)}
    </nav>
  )
}
