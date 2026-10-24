export function PageHeading({ eyebrow, title, subtitle, badge }) {
  return <section className="utility-page-heading"><div><div className="eyebrow"><span className="eyebrow-line" /> {eyebrow} <span className="heading-time">DỮ LIỆU MÔ PHỎNG</span></div><h1>{title}<span>.</span></h1><p className="page-subtitle">{subtitle}</p></div>{badge && <span className="utility-heading-badge">{badge}</span>}</section>
}
