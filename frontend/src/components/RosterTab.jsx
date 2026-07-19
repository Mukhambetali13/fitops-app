import { Panel, SectionTitle, Badge } from "./Primitives";
import { api } from "../api";

function fmtDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });
}

export default function RosterTab({ roster, settings, onChanged }) {
  if (!roster || !settings) return null;

  async function changeStart(e) {
    await api.putSettings({ ...settings, rosterStart: e.target.value });
    onChanged();
  }

  return (
    <div className="p-4">
      <Panel className="mb-3">
        <SectionTitle>Начало цикла (день 1 = дневная смена)</SectionTitle>
        <input
          type="date"
          defaultValue={settings.rosterStart}
          onChange={changeStart}
          className="font-mono w-full bg-panelAlt border border-line rounded-md px-2.5 py-2 text-cream"
        />
      </Panel>
      <div className="flex flex-col gap-2">
        {roster.map((d, i) => (
          <Panel key={i} className="flex justify-between items-center py-2.5 px-3.5">
            <div>
              <div className="text-[13px] font-semibold text-cream">{i === 0 ? "Сегодня" : fmtDate(d.date)}</div>
              <div className="text-xs text-muted">{d.workoutMeta.title}</div>
            </div>
            <Badge kind={d.kind} />
          </Panel>
        ))}
      </div>
    </div>
  );
}
