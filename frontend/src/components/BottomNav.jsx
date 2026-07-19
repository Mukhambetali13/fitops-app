import { Home, CalendarDays, Dumbbell, Cigarette, TrendingUp } from "lucide-react";

const TABS = [
  { id: "home", label: "Главная", icon: Home },
  { id: "roster", label: "Расписание", icon: CalendarDays },
  { id: "workouts", label: "Тренировки", icon: Dumbbell },
  { id: "smoke", label: "Курение", icon: Cigarette },
  { id: "progress", label: "Прогресс", icon: TrendingUp },
];

export default function BottomNav({ tab, setTab }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 flex border-t border-line bg-panel max-w-[480px] mx-auto">
      {TABS.map((t) => {
        const Icon = t.icon;
        const active = tab === t.id;
        return (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex-1 flex flex-col items-center gap-0.5 py-2 pb-2.5"
            style={{ color: active ? "#3ECF8E" : "#8A93A6" }}
          >
            <Icon size={19} />
            <span className="text-[10px]">{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}
