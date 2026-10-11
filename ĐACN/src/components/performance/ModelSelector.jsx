export function ModelSelector({ models, selectedIndex, onSelect }) {
  return (
    <div className="model-selector-grid">
      {models.map((model, index) => <button key={model.name} className={`model-select-card ${selectedIndex === index ? 'model-selected' : ''}`} onClick={() => onSelect(index)}>
        <span>{model.name}</span><strong>{model.accuracy}</strong><small>{model.version} <i /> {model.signals} tín hiệu</small>
      </button>)}
    </div>
  )
}
