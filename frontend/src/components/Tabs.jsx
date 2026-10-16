// tabs = { key: 'Label', ... }
export default function Tabs({ tabs, active, onChange }) {
  return (
    <div className="tabs">
      {Object.entries(tabs).map(([key, label]) => (
        <button key={key} className={'tab' + (key === active ? ' active' : '')} onClick={() => onChange(key)}>
          {label}
        </button>
      ))}
    </div>
  );
}
