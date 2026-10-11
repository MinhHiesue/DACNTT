import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { HELP_TOPICS } from '../../data/help.js'

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState(0)

  return (
    <section className="panel help-topics">
      <div className="panel-kicker">CÂU HỎI THƯỜNG GẶP</div>
      {HELP_TOPICS.map((topic, index) => <article className={`help-topic ${openIndex === index ? 'help-topic-open' : ''}`} key={topic.title}>
        <button aria-expanded={openIndex === index} onClick={() => setOpenIndex(openIndex === index ? -1 : index)}>
          <span>{topic.title}</span><ChevronDown size={16} />
        </button>
        {openIndex === index && <p>{topic.body}</p>}
      </article>)}
    </section>
  )
}
