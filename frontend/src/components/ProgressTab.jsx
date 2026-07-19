import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from "recharts";
import { Panel, SectionTitle } from "./Primitives";
import { api } from "../api";

export default function ProgressTab({ settings, weights, onChanged }) {
  if (!settings) return null;
  const currentWeight = weights.length ? weights[weights.length - 1].weight : settings.startWeight;
  const chartData = weights.map((e) => ({ date: e.date.slice(5), Вес: e.weight }));

  async function updateGoal(field, value) {
    await api.putSettings({ ...settings, [field]: value });
    onChanged();
  }

  return (
    <div className="p-4 flex flex-col gap-3.5">
      <Panel>
        <SectionTitle>Динамика веса</SectionTitle>
        <div className="flex gap-4 mb-2.5">
          <div>
            <div className="text-[11px] text-muted">текущий</div>
            <div className="font-mono text-xl font-semibold text-cream">{currentWeight} кг</div>
          </div>
          <div>
            <div className="text-[11px] text-muted">цель</div>
            <div className="font-mono text-xl font-semibold text-go">{settings.goalWeight} кг</div>
          </div>
          <div>
            <div className="text-[11px] text-muted">осталось</div>
            <div className="font-mono text-xl font-semibold text-caution">
              {Math.max(0, +(currentWeight - settings.goalWeight).toFixed(1))} кг
            </div>
          </div>
        </div>
        {chartData.length > 1 ? (
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid stroke="#2C3648" strokeDasharray="3 3" />
                <XAxis dataKey="date" stroke="#8A93A6" fontSize={11} />
                <YAxis stroke="#8A93A6" fontSize={11} domain={["dataMin - 2", "dataMax + 2"]} />
                <Tooltip contentStyle={{ background: "#212A3C", border: "1px solid #2C3648", color: "#E9E5DA" }} />
                <ReferenceLine y={settings.goalWeight} stroke="#3ECF8E" strokeDasharray="4 4" />
                <Line type="monotone" dataKey="Вес" stroke="#5EA8C7" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-sm text-muted py-5 text-center">
            Добавь вес на вкладке «Главная» хотя бы 2 раза, чтобы увидеть график
          </div>
        )}
      </Panel>

      <Panel>
        <SectionTitle>Цели профиля</SectionTitle>
        <div className="flex gap-2.5">
          <div className="flex-1">
            <div className="text-[11px] text-muted">старт, кг</div>
            <input
              type="number"
              defaultValue={settings.startWeight}
              onBlur={(e) => updateGoal("startWeight", +e.target.value)}
              className="font-mono w-full bg-panelAlt border border-line rounded-md px-2 py-1.5 text-cream mt-1"
            />
          </div>
          <div className="flex-1">
            <div className="text-[11px] text-muted">цель, кг</div>
            <input
              type="number"
              defaultValue={settings.goalWeight}
              onBlur={(e) => updateGoal("goalWeight", +e.target.value)}
              className="font-mono w-full bg-panelAlt border border-line rounded-md px-2 py-1.5 text-cream mt-1"
            />
          </div>
        </div>
      </Panel>
    </div>
  );
}
