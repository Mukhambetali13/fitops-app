import { useEffect, useState, useCallback } from "react";
import { api, getToken } from "./api";
import Login from "./components/Login";
import BottomNav from "./components/BottomNav";
import { Badge } from "./components/Primitives";
import HomeTab from "./components/HomeTab";
import RosterTab from "./components/RosterTab";
import WorkoutsTab from "./components/WorkoutsTab";
import SmokingTab from "./components/SmokingTab";
import ProgressTab from "./components/ProgressTab";

export default function App() {
  const [authed, setAuthed] = useState(!!getToken());
  const [tab, setTab] = useState("home");
  const [today, setToday] = useState(null);
  const [roster, setRoster] = useState(null);
  const [settings, setSettings] = useState(null);
  const [weights, setWeights] = useState([]);
  const [smoking, setSmoking] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    const [t, r, s, w, sm] = await Promise.all([
      api.today(),
      api.roster(),
      api.getSettings(),
      api.getWeights(),
      api.getSmoking(),
    ]);
    setToday(t);
    setRoster(r);
    setSettings(s);
    setWeights(w);
    setSmoking(sm);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (authed) loadAll().catch(() => setLoading(false));
  }, [authed, loadAll]);

  if (!authed) return <Login onSuccess={() => setAuthed(true)} />;
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="font-mono text-muted text-sm">Загрузка...</div>
      </div>
    );
  }

  const weekday = new Date().toLocaleDateString("ru-RU", { weekday: "long", day: "2-digit", month: "long" });

  return (
    <div className="min-h-screen bg-bg text-cream font-sans max-w-[480px] mx-auto pb-[70px]">
      <div className="px-4 pt-4 pb-2 border-b border-line flex justify-between items-center">
        <div className="font-mono text-xs text-muted tracking-wider uppercase">{weekday}</div>
        <Badge kind={today.kind} />
      </div>

      {tab === "home" && <HomeTab today={today} settings={settings} weights={weights} smoking={smoking} onChanged={loadAll} />}
      {tab === "roster" && <RosterTab roster={roster} settings={settings} onChanged={loadAll} />}
      {tab === "workouts" && <WorkoutsTab />}
      {tab === "smoke" && <SmokingTab smoking={smoking} onChanged={loadAll} />}
      {tab === "progress" && <ProgressTab settings={settings} weights={weights} onChanged={loadAll} />}

      <BottomNav tab={tab} setTab={setTab} />
    </div>
  );
}
