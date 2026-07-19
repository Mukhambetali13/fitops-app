import { useState } from "react";
import { Check, X, Plus } from "lucide-react";
import Gauge from "./Gauge";
import { Panel, SectionTitle } from "./Primitives";
import { api } from "../api";

export default function HomeTab({ today, settings, weights, smoking, onChanged }) {
  const [weightInput, setWeightInput] = useState("");
  const [newItem, setNewItem] = useState("");

  if (!today || !settings) return null;

  const currentWeight = weights.length ? weights[weights.length - 1].weight : settings.startWeight;
  const totalToLose = settings.startWeight - settings.goalWeight;
  const lostSoFar = settings.startWeight - currentWeight;
  const weightPct = totalToLose > 0 ? Math.max(0, Math.min(100, Math.round((lostSoFar / totalToLose) * 100))) : 0;

  const smokeFreeDays = smoking?.quitDate
    ? Math.max(0, Math.floor((Date.now() - new Date(smoking.quitDate)) / 86400000))
    : 0;

  const doneCount = today.checklist.filter((i) => i.done).length;
  const checklistPct = today.checklist.length ? Math.round((doneCount / today.checklist.length) * 100) : 0;

  async function toggle(item) {
    await api.toggleChecklistItem(item.id, !item.done);
    onChanged();
  }
  async function remove(item) {
    await api.deleteChecklistItem(item.id);
    onChanged();
  }
  async function addItem() {
    if (!newItem.trim()) return;
    await api.addChecklistItem(today.date, newItem.trim());
    setNewItem("");
    onChanged();
  }
  async function saveWeight() {
    const w = parseFloat(weightInput.replace(",", "."));
    if (!w || w <= 0) return;
    await api.addWeight(today.date, w);
    setWeightInput("");
    onChanged();
  }

  return (
    <div className="p-4 flex flex-col gap-3.5">
      <Panel>
        <div className="flex justify-around">
          <Gauge value={weightPct} max={100} color="#3ECF8E" label="вес" sub={weightPct + "%"} />
          <Gauge value={Math.min(smokeFreeDays, 30)} max={30} color="#F2A93B" label="без сигарет" sub={smokeFreeDays} />
          <Gauge value={checklistPct} max={100} color="#5EA8C7" label="чек-лист" sub={checklistPct + "%"} />
        </div>
      </Panel>

      <Panel>
        <SectionTitle>Тренировка дня</SectionTitle>
        <div className="flex justify-between items-baseline">
          <div className="text-[17px] font-semibold text-cream">{today.workoutMeta.title}</div>
          <div className="font-mono text-xs text-muted">{today.workoutMeta.duration}</div>
        </div>
        <div className="text-[13px] text-muted mt-1">{today.note}</div>
      </Panel>

      <Panel>
        <SectionTitle>Чек-лист на сегодня</SectionTitle>
        <div className="flex flex-col gap-2">
          {today.checklist.map((it) => (
            <div key={it.id} className="flex items-center gap-2">
              <button
                onClick={() => toggle(it)}
                className="w-[22px] h-[22px] rounded flex items-center justify-center shrink-0"
                style={{
                  border: `1px solid ${it.done ? "#3ECF8E" : "#2C3648"}`,
                  background: it.done ? "#3ECF8E" : "transparent",
                }}
              >
                {it.done && <Check size={14} color="#10141B" />}
              </button>
              <span className={`flex-1 text-sm ${it.done ? "line-through text-muted" : "text-cream"}`}>{it.text}</span>
              <button onClick={() => remove(it)} className="text-muted">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-2.5">
          <input
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addItem()}
            placeholder="Добавить пункт..."
            className="flex-1 bg-panelAlt border border-line rounded-md px-2.5 py-2 text-sm text-cream"
          />
          <button onClick={addItem} className="bg-panelAlt border border-line rounded-md px-2.5 text-cream">
            <Plus size={16} />
          </button>
        </div>
      </Panel>

      <Panel>
        <SectionTitle>Вес сегодня</SectionTitle>
        <div className="flex gap-2">
          <input
            value={weightInput}
            onChange={(e) => setWeightInput(e.target.value)}
            placeholder="напр. 91.4"
            inputMode="decimal"
            className="font-mono flex-1 bg-panelAlt border border-line rounded-md px-2.5 py-2 text-cream"
          />
          <button onClick={saveWeight} className="bg-go rounded-md px-3.5 text-bg font-semibold">
            OK
          </button>
        </div>
      </Panel>
    </div>
  );
}
