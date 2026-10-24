import { Check, Save } from 'lucide-react'
import { SETTINGS_GROUPS } from '../../data/settings.js'

export function SettingsPanel({ activeTab, preferences, saved, onToggle, onSave }) {
  const group = SETTINGS_GROUPS[activeTab]

  return (
    <section className="panel settings-panel">
      <div className="utility-section-heading"><div><div className="panel-kicker">{activeTab.toUpperCase()} SETTINGS</div><h2>{group.heading}</h2></div></div>
      <div className="settings-list">
        {group.options.map(({ key, title, description }) => <label className="setting-row" key={key}>
          <span><strong>{title}</strong><small>{description}</small></span>
          <span className="switch-control"><input aria-label={title} type="checkbox" checked={preferences[key]} onChange={() => onToggle(key)} /><span /></span>
        </label>)}
      </div>
      <div className="settings-footer">
        {saved && <span role="status"><Check size={13} /> Đã lưu trong phiên demo</span>}
        <button className="primary-action" onClick={onSave}><Save size={14} /> Lưu thay đổi</button>
      </div>
    </section>
  )
}
