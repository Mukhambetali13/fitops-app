import { Panel } from "./Primitives";
import { WORKOUTS } from "../workoutsData";

export default function WorkoutsTab() {
  return (
    <div className="p-4 flex flex-col gap-2.5">
      {Object.entries(WORKOUTS).map(([key, w]) => (
        <Panel key={key}>
          <div className="flex justify-between mb-2">
            <div className="text-[15px] font-semibold" style={{ color: w.color }}>
              {w.title}
            </div>
            <div className="font-mono text-xs text-muted">{w.duration}</div>
          </div>
          <div className="flex flex-col gap-1.5">
            {w.items.map((it, i) => (
              <div key={i} className="pl-2.5" style={{ borderLeft: `2px solid ${w.color}` }}>
                <div className="text-[13px] font-semibold text-cream">{it.name}</div>
                <div className="text-xs text-muted">{it.detail}</div>
              </div>
            ))}
          </div>
        </Panel>
      ))}
    </div>
  );
}
