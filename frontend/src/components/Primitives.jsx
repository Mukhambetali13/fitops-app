export function Badge({ kind }) {
  const map = {
    day: { text: "ДНЕВНАЯ СМЕНА", color: "#F2A93B" },
    night: { text: "НОЧНАЯ СМЕНА", color: "#5EA8C7" },
    off: { text: "ВЫХОДНОЙ", color: "#3ECF8E" },
  };
  const m = map[kind] || map.off;
  return (
    <span
      className="font-mono text-[11px] tracking-wider px-2.5 py-1 rounded"
      style={{ border: `1px solid ${m.color}`, color: m.color, background: `${m.color}18` }}
    >
      {m.text}
    </span>
  );
}

export function Panel({ children, className = "" }) {
  return (
    <div className={`bg-panel border border-line rounded-[10px] p-3.5 ${className}`}>{children}</div>
  );
}

export function SectionTitle({ children }) {
  return <div className="font-mono text-[11px] tracking-widest text-muted mb-2.5 uppercase">{children}</div>;
}
