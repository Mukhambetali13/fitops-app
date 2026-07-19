import { useState } from "react";
import { Wind, RotateCcw } from "lucide-react";
import { Panel, SectionTitle } from "./Primitives";
import { api } from "../api";

export default function SmokingTab({ smoking, onChanged }) {
  const [intensity, setIntensity] = useState(3);
  if (!smoking) return null;

  const smokeFreeDays = smoking.quitDate
    ? Math.max(0, Math.floor((Date.now() - new Date(smoking.quitDate)) / 86400000))
    : 0;
  const moneySaved = Math.round(smokeFreeDays * (smoking.cigsPerDay / 20) * smoking.pricePerPack);

  async function start() {
    await api.startQuit();
    onChanged();
  }
  async function relapse() {
    if (!confirm("Записать срыв и сбросить счётчик дней?")) return;
    await api.logRelapse();
    onChanged();
  }
  async function craving() {
    await api.logCraving(intensity);
    onChanged();
  }
  async function updateSettings(field, value) {
    await api.putSmokingSettings({ ...smoking, [field]: value });
    onChanged();
  }

  return (
    <div className="p-4 flex flex-col gap-3.5">
      <Panel className="text-center py-6">
        <div className="font-mono text-[40px] font-semibold text-go">{smokeFreeDays}</div>
        <div className="font-mono text-[11px] text-muted tracking-wider">ДНЕЙ БЕЗ СИГАРЕТ</div>
        {!smoking.quitDate && (
          <button onClick={start} className="mt-3.5 bg-go rounded-md px-4 py-2.5 text-bg font-semibold">
            Начать отсчёт
          </button>
        )}
      </Panel>

      <Panel>
        <SectionTitle>Экономия</SectionTitle>
        <div className="flex gap-2.5">
          <div className="flex-1">
            <div className="text-[11px] text-muted">сигарет / день</div>
            <input
              type="number"
              defaultValue={smoking.cigsPerDay}
              onBlur={(e) => updateSettings("cigsPerDay", +e.target.value)}
              className="font-mono w-full bg-panelAlt border border-line rounded-md px-2 py-1.5 text-cream mt-1"
            />
          </div>
          <div className="flex-1">
            <div className="text-[11px] text-muted">цена пачки, ₸</div>
            <input
              type="number"
              defaultValue={smoking.pricePerPack}
              onBlur={(e) => updateSettings("pricePerPack", +e.target.value)}
              className="font-mono w-full bg-panelAlt border border-line rounded-md px-2 py-1.5 text-cream mt-1"
            />
          </div>
        </div>
        <div className="mt-2.5 font-mono text-2xl font-semibold text-cream">{moneySaved.toLocaleString("ru-RU")} ₸</div>
      </Panel>

      <Panel>
        <SectionTitle>Записать тягу к курению</SectionTitle>
        <div className="flex items-center gap-2.5">
          <Wind size={18} className="text-muted" />
          <input
            type="range"
            min="1"
            max="5"
            step="1"
            value={intensity}
            onChange={(e) => setIntensity(+e.target.value)}
            className="flex-1"
          />
          <span className="font-mono w-5 text-cream">{intensity}</span>
        </div>
        <button onClick={craving} className="mt-2.5 w-full bg-panelAlt border border-line rounded-md py-2 text-cream">
          Записать
        </button>
      </Panel>

      <Panel>
        <button
          onClick={relapse}
          className="w-full bg-transparent border border-warn rounded-md py-2.5 text-warn flex items-center justify-center gap-1.5"
        >
          <RotateCcw size={14} /> Отметить срыв (сброс счётчика)
        </button>
      </Panel>
    </div>
  );
}
