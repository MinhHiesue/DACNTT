import { useState } from 'react'
import { PageHeading } from '../components/PageHeading.jsx'
import { ModelSelector } from '../components/performance/ModelSelector.jsx'
import { PerformanceChart } from '../components/performance/PerformanceChart.jsx'
import { PerformanceMetrics } from '../components/performance/PerformanceMetrics.jsx'
import { PERFORMANCE_MODELS } from '../data/performance.js'

export function PerformancePage() {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const selectedModel = PERFORMANCE_MODELS[selectedIndex]

  return (
    <div className="utility-page">
      <PageHeading eyebrow="MODEL MONITOR" title="Hiệu suất mô hình" subtitle="Theo dõi độ chính xác và kết quả mô phỏng của từng chiến lược." badge="CẬP NHẬT HÔM NAY" />
      <ModelSelector models={PERFORMANCE_MODELS} selectedIndex={selectedIndex} onSelect={setSelectedIndex} />
      <PerformanceMetrics model={selectedModel} />
      <PerformanceChart model={selectedModel} />
    </div>
  )
}
