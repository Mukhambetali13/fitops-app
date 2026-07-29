import { useState } from "react";
import { Panel } from "./Primitives";
import { WORKOUTS } from "../workoutsData";
import { api } from "../api";
import { Info, Sparkles, X, ChevronRight, AlertCircle, Loader2, CheckCircle2, Play, BookOpen, Video, ExternalLink } from "lucide-react";

export default function WorkoutsTab() {
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [modalTab, setModalTab] = useState("ai"); // 'ai' | 'shorts'
  const [userQuestion, setUserQuestion] = useState("");
  const [aiAdvice, setAiAdvice] = useState("");
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiError, setAiError] = useState("");

  const openExercise = (item, color) => {
    setSelectedExercise({ ...item, color });
    setModalTab("ai");
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

  const getYoutubeShortsUrl = (querySuffix = "техника shorts") => {
    if (!selectedExercise) return "#";
    const q = `${selectedExercise.name} ${querySuffix}`;
    return `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
  };

  return (
    <div className="p-4 flex flex-col gap-3">
      {/* Header Info */}
      <div className="p-3.5 bg-panel border border-line rounded-2xl flex items-center justify-between">
        <div>
          <div className="text-sm font-bold text-cream">Каталог техник и упражнений</div>
          <div className="text-xs text-muted">Разбор техники, ответы AI Тренера и подборки YouTube Shorts</div>
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

      {/* Technique & Video Modal */}
      {selectedExercise && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-panel border border-line rounded-3xl w-full max-w-[440px] max-h-[88vh] overflow-y-auto p-5 space-y-4 shadow-2xl relative">
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-line/60 pb-3">
              <div>
                <span
                  className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-md text-bg font-bold"
                  style={{ backgroundColor: selectedExercise.color }}
                >
                  Карточка упражнения
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

            {/* Segmented Switch Tabs */}
            <div className="grid grid-cols-2 p-1 bg-bg/80 border border-line rounded-xl font-mono text-xs">
              <button
                onClick={() => setModalTab("ai")}
                className={`py-2 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
                  modalTab === "ai"
                    ? "bg-panel text-go border border-line shadow-sm"
                    : "text-muted hover:text-cream"
                }`}
              >
                <BookOpen size={14} />
                <span>Инструкция & AI</span>
              </button>
              <button
                onClick={() => setModalTab("shorts")}
                className={`py-2 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
                  modalTab === "shorts"
                    ? "bg-[#FF0000] text-white shadow-sm"
                    : "text-muted hover:text-cream"
                }`}
              >
                <Video size={14} />
                <span>YouTube Shorts</span>
              </button>
            </div>

            {/* TAB 1: AI & Text Technique */}
            {modalTab === "ai" && (
              <div className="space-y-3 animate-fadeIn">
                {/* Quick Summary */}
                <div className="p-3 bg-bg/60 rounded-2xl border border-line/50 text-xs text-cream space-y-1 font-mono">
                  <span className="text-go font-bold">Параметры и схема: </span>
                  <span>{selectedExercise.detail}</span>
                </div>

                {/* AI Trainer Consultation Section */}
                <div className="p-3.5 bg-bg/80 border border-go/40 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-xs font-mono text-go font-bold">
                    <Sparkles size={16} />
                    Консультация с AI Тренером
                  </div>

                  <p className="text-xs text-muted">
                    Задайте любой вопрос по упражнению (например: <i>«Чем заменить?», «Болит поясница», «С какого веса начать?»</i>)
                  </p>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={userQuestion}
                      onChange={(e) => setUserQuestion(e.target.value)}
                      placeholder="Задать вопрос тренеру..."
                      className="flex-1 p-2 bg-panel border border-line rounded-xl text-xs text-cream placeholder:text-muted focus:outline-none focus:border-go"
                    />
                    <button
                      onClick={handleAskAi}
                      disabled={loadingAi}
                      className="px-4 py-2.5 bg-go hover:bg-[#34B87D] disabled:opacity-40 text-bg font-extrabold rounded-xl text-xs font-sans transition-all flex items-center gap-1.5 shrink-0 shadow-md active:scale-95 cursor-pointer min-h-[38px]"
                    >
                      {loadingAi ? <Loader2 size={16} className="animate-spin text-bg" /> : <Sparkles size={16} className="text-bg" />}
                      <span className="font-extrabold text-bg text-xs">Спросить</span>
                    </button>
                  </div>

                  {aiError && (
                    <div className="p-2 bg-red-950/40 border border-red-800 text-red-200 text-xs rounded-xl flex items-center gap-2">
                      <AlertCircle size={14} />
                      <span>{aiError}</span>
                    </div>
                  )}

                  {aiAdvice && (
                    <div className="p-3 bg-panel border border-go/50 rounded-xl text-xs text-cream whitespace-pre-wrap leading-relaxed animate-fadeIn">
                      <div className="font-mono font-bold text-go mb-1 flex items-center gap-1">
                        <CheckCircle2 size={14} /> Рекомендация AI Тренера:
                      </div>
                      {aiAdvice}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: YouTube Shorts */}
            {modalTab === "shorts" && (
              <div className="space-y-3 animate-fadeIn">
                <div className="p-4 bg-gradient-to-b from-[#282828] to-bg border border-red-900/50 rounded-2xl space-y-3 text-center">
                  <div className="w-12 h-12 bg-[#FF0000] text-white rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-red-900/30">
                    <Play size={24} fill="white" className="ml-0.5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Видео-техника на YouTube Shorts</h4>
                    <p className="text-xs text-muted mt-1">
                      Смотрите короткие наглядные ролики с правильной биомеханикой для упражнения «{selectedExercise.name}»
                    </p>
                  </div>

                  {/* Main YouTube Shorts Button */}
                  <a
                    href={getYoutubeShortsUrl("техника shorts")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 px-4 bg-[#FF0000] hover:bg-[#D90000] text-white font-extrabold rounded-xl text-xs font-sans flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 cursor-pointer decoration-none border-none"
                  >
                    <Play size={16} fill="white" />
                    <span>Смотреть Shorts на YouTube</span>
                    <ExternalLink size={14} />
                  </a>
                </div>

                {/* Specific Topic Chips */}
                <div className="space-y-2">
                  <div className="text-[11px] font-mono text-muted uppercase">Быстрые подборки видео:</div>
                  <div className="grid grid-cols-1 gap-2 text-xs">
                    <a
                      href={getYoutubeShortsUrl("как правильно делать shorts")}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 bg-bg/60 hover:bg-bg border border-line hover:border-red-500 rounded-xl text-cream flex items-center justify-between group transition-colors decoration-none"
                    >
                      <span>🎯 Идеальная техника движения (Shorts)</span>
                      <ExternalLink size={14} className="text-muted group-hover:text-white" />
                    </a>
                    <a
                      href={getYoutubeShortsUrl("ошибки техника shorts")}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 bg-bg/60 hover:bg-bg border border-line hover:border-red-500 rounded-xl text-cream flex items-center justify-between group transition-colors decoration-none"
                    >
                      <span>⚠️ Опасные ошибки в технике (Shorts)</span>
                      <ExternalLink size={14} className="text-muted group-hover:text-white" />
                    </a>
                    <a
                      href={getYoutubeShortsUrl("разбор биомеханика shorts")}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 bg-bg/60 hover:bg-bg border border-line hover:border-red-500 rounded-xl text-cream flex items-center justify-between group transition-colors decoration-none"
                    >
                      <span>🏋️ Подробный разбор анатомии (Shorts)</span>
                      <ExternalLink size={14} className="text-muted group-hover:text-white" />
                    </a>
                  </div>
                </div>
              </div>
            )}

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
