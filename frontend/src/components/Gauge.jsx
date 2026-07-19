export default function Gauge({ value, max, color, label, sub }) {
  const pct = Math.max(0, Math.min(1, max ? value / max : 0));
  const r = 34;
  const c = 2 * Math.PI * r;
  return (
    <div className="flex flex-col items-center gap-1 flex-1">
      <svg width="84" height="84" viewBox="0 0 84 84">
        <circle cx="42" cy="42" r={r} fill="none" stroke="#2C3648" strokeWidth="7" />
        <circle
          cx="42"
          cy="42"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="7"
          strokeDasharray={`${c * pct} ${c}`}
          strokeLinecap="round"
          transform="rotate(-90 42 42)"
        />
        <text x="42" y="39" textAnchor="middle" fill="#E9E5DA" fontSize="15" fontWeight="600" className="font-mono">
          {sub}
        </text>
        <text x="42" y="53" textAnchor="middle" fill="#8A93A6" fontSize="8" className="font-mono">
          {label.toUpperCase()}
        </text>
      </svg>
    </div>
  );
}
