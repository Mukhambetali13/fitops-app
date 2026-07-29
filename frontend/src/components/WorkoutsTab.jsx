import { useState } from "react";
import { Panel } from "./Primitives";
import { WORKOUTS } from "../workoutsData";
import { api } from "../api";
import { Info, Sparkles, X, ChevronRight, AlertCircle, Loader2, CheckCircle2 } from "lucide-react";

export default function WorkoutsTab() {
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [userQuestion, setUserQuestion] = useState("");
  const [aiAdvice, setAiAdvice] = useState("");
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiError, setAiError] = useState("");

  const openExercise = (item, color) => {
    setSelectedExercise({ ...item, color });
    setUserQuestion("");
    setAiAdvice("");
    setAiError("");
  };

  const handleAskAi = async () => {
    if (!selectedExercise) return;
    setLoadingAi(true);
    setAiError("");
    try {
      const res = await api.getWorkoutAdvice(selectedExercise.name, userQuestion.trim());
      setAiAdvice(res.advice || "Не удалось получить совет от AI.");
    } catch (err) {
      setAiError(err.message || "Ошибка получения ответа от AI Тренера");
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <div className="p-4 flex flex-col gap-3">
      {/* Header Info */}
      <div className="p-3 bg-panel border border-line rounded-2xl flex items-center justify-between">
        <div>
          <div className="text-sm font-bold text-cream">Каталог техник и упражнений</div>
          <div className="text-xs text-muted">Нажмите на любое упражнение для разбора техники и консультации с AI Тренером</div>
        </div>
      </div>

      {Object.entries(WORKOUTS).map(([key, w]) => (
        <Panel key={key}>
          <div className="flex justify-between mb-2.5 items-center">
            <div className="text-[15px] font-bold" style={{ color: w.color }}>
              {w.title}
            </div>
            <div className="font-mono text-xs text-muted px-2 py-0.5 bg-bg/60 rounded-lg border border-line/40">
              {w.duration}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {w.items.map((it, i) => (
              <div
                key={i}
                onClick={() => openExercise(it, w.color)}
                className="pl-3 py-2 pr-2 bg-bg/40 hover:bg-bg/80 border-l-4 rounded-r-xl cursor-pointer transition-all flex items-center justify-between group"
                style={{ borderLeftColor: w.color }}
              >
                <div>
                  <div className="text-[13px] font-semibold text-cream group-hover:text-accent transition-colors flex items-center gap-1.5">
                    {it.name}
                    <Info size={14} className="text-muted opacity-60 group-hover:opacity-100" />
                  </div>
                  <div className="text-xs text-muted">{it.detail}</div>
                </div>
                <ChevronRight size={16} className="text-muted group-hover:text-cream transition-transform group-hover:translate-x-0.5" />
              </div>
            ))}
          </div>
        </Panel>
      ))}

      {/* Technique Modal */}
      {selectedExercise && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-panel border border-line rounded-3xl w-full max-w-[440px] max-h-[85vh] overflow-y-auto p-5 space-y-4 shadow-2xl relative">
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-line/60 pb-3">
              <div>
                <span
                  className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-md text-bg font-bold"
                  style={{ backgroundColor: selectedExercise.color }}
                >
                  Правильная техника
                </span>
                <h3 className="text-lg font-bold text-cream mt-1">{selectedExercise.name}</h3>
              </div>
              <button
                onClick={() => setSelectedExercise(null)}
                className="p-1.5 text-muted hover:text-white rounded-full bg-bg border border-line"
              >
                <X size={18} />
              </button>
            </div>

            {/* Quick Summary */}
            <div className="p-3 bg-bg/60 rounded-2xl border border-line/50 text-xs text-cream space-y-1 font-mono">
              <span className="text-accent font-bold">Параметры: </span>
              <span>{selectedExercise.detail}</span>
            </div>

            {/* AI Trainer Consultation Section */}
            <div className="p-3.5 bg-bg/80 border border-accent/40 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono text-accent font-bold">
                <Sparkles size={16} />
                Консультация с AI Тренером
              </div>

              <p className="text-xs text-muted">
                Задайте любой вопрос по упражнению (например: <i>«Чем заменить?», «Болит поясница, что делать?», «Как правильно подобрать вес?»</i>)
              </p>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={userQuestion}
                  onChange={(e) => setUserQuestion(e.target.value)}
                  placeholder="Задать вопрос тренеру..."
                  className="flex-1 p-2 bg-panel border border-line rounded-xl text-xs text-cream placeholder:text-muted focus:outline-none focus:border-accent"
                />
                <button
                  onClick={handleAskAi}
                  disabled={loadingAi}
                  className="px-3.5 py-2 bg-accent hover:opacity-90 disabled:opacity-50 text-bg font-bold rounded-xl text-xs font-mono transition-all flex items-center gap-1.5"
                >
                  {loadingAi ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  <span>Спросить</span>
                </button>
              </div>

              {aiError && (
                <div className="p-2 bg-red-950/40 border border-red-800 text-red-200 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle size={14} />
                  <span>{aiError}</span>
                </div>
              )}

              {aiAdvice && (
                <div className="p-3 bg-panel border border-accent/50 rounded-xl text-xs text-cream whitespace-pre-wrap leading-relaxed animate-fadeIn">
                  <div className="font-mono font-bold text-accent mb-1 flex items-center gap-1">
                    <CheckCircle2 size={14} /> Рекомендация AI Тренера:
                  </div>
                  {aiAdvice}
                </div>
              )}
            </div>

            {/* Close Button */}
            <button
              onClick={() => setSelectedExercise(null)}
              className="w-full py-2.5 bg-bg border border-line hover:border-cream text-cream rounded-xl text-xs font-mono font-bold transition-colors"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
