// tabs = { key: 'Label', ... }   counts = { key: 3, ... } (optional)
export default function Tabs({ tabs, active, onChange, counts }) {
  return (
    <div className="tabs" role="tablist">
      {Object.entries(tabs).map(([key, label]) => (
        <button key={key} role="tab" aria-selected={key === active} className={'tab' + (key === active ? ' active' : '')} onClick={() => onChange(key)}>
          {label}
          {counts && <span className="n">{counts[key] ?? 0}</span>}
        </button>
      ))}
    </div>
  );
}
