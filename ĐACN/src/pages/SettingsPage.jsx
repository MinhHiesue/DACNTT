import { useState } from 'react'
import { PageHeading } from '../components/PageHeading.jsx'
import { SettingsPanel } from '../components/settings/SettingsPanel.jsx'
import { SettingsTabs } from '../components/settings/SettingsTabs.jsx'

export function SettingsPage({ compactLayout, onCompactLayoutChange }) {
  const [tab, setTab] = useState('Chung')
  const [preferences, setPreferences] = useState({ sound: true, buy: true, sell: true, hold: false, desktop: true, telegram: true })
  const [saved, setSaved] = useState(false)
  const togglePreference = (key) => {
    if (key === 'compact') {
      onCompactLayoutChange(!compactLayout)
      setSaved(false)
      return
    }
    setPreferences((current) => ({ ...current, [key]: !current[key] }))
    setSaved(false)
  }

  return (
    <div className="utility-page">
      <PageHeading eyebrow="PREFERENCES" title="Cài đặt" subtitle="Quản lý tuỳ chọn hiển thị và loại thông báo trong workspace." badge="CÁ NHÂN" />
      <div className="settings-layout">
        <SettingsTabs activeTab={tab} onChange={setTab} />
        <SettingsPanel activeTab={tab} preferences={{ ...preferences, compact: compactLayout }} saved={saved} onToggle={togglePreference} onSave={() => setSaved(true)} />
      </div>
    </div>
  )
}
