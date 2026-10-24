import { PageHeading } from '../components/PageHeading.jsx'
import { FaqSection } from '../components/help/FaqSection.jsx'
import { HelpShortcuts } from '../components/help/HelpShortcuts.jsx'

export function HelpPage({ onNavigate }) {
  return (
    <div className="utility-page">
      <PageHeading eyebrow="SUPPORT DESK" title="Trung tâm trợ giúp" subtitle="Thông tin nhanh về dữ liệu và các màn hình trong bản demo." badge="4 CHỦ ĐỀ" />
      <div className="help-layout">
        <FaqSection />
        <HelpShortcuts onNavigate={onNavigate} />
      </div>
    </div>
  )
}
