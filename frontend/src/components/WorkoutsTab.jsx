import { useState, useMemo } from "react";
import { Panel } from "./Primitives";
import { WORKOUTS, WORKOUT_CATEGORIES } from "../workoutsData";
import { api } from "../api";
import {
  Info,
  Sparkles,
  X,
  ChevronRight,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Play,
  BookOpen,
  Video,
  ExternalLink,
  Search,
  Dumbbell,
  Timer,
  Zap,
} from "lucide-react";

export default function WorkoutsTab() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [modalTab, setModalTab] = useState("ai"); // 'ai' | 'shorts'
  const [userQuestion, setUserQuestion] = useState("");
  const [aiAdvice, setAiAdvice] = useState("");
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiError, setAiError] = useState("");

  const quickQuestions = [
    "Чем заменить это упражнение?",
    "С какого веса начать новичку?",
    "Как избежать травмы спины и коленей?",
    "Разминка перед этим упражнением",
  ];

  const openExercise = (item, color, workoutTitle) => {
    setSelectedExercise({ ...item, color, workoutTitle });
    setModalTab("ai");
    setUserQuestion("");
    setAiAdvice("");
    setAiError("");
  };

  const handleAskAi = async (customPrompt) => {
    const q = customPrompt || userQuestion.trim();
    if (!selectedExercise) return;
    setLoadingAi(true);
    setAiError("");
    if (customPrompt) setUserQuestion(customPrompt);
    try {
      const res = await api.getWorkoutAdvice(selectedExercise.name, q);
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

  // Filter and search workouts
  const filteredWorkouts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return Object.entries(WORKOUTS).filter(([key, w]) => {
      // Category filter
      if (selectedCategory !== "all" && w.category !== selectedCategory) {
        return false;
      }

      // Search query
      if (!q) return true;

      const titleMatch = w.title?.toLowerCase().includes(q);
      const descMatch = w.description?.toLowerCase().includes(q);
      const categoryMatch = w.categoryLabel?.toLowerCase().includes(q);
      const itemMatch = w.items?.some(
        (it) => it.name?.toLowerCase().includes(q) || it.detail?.toLowerCase().includes(q)
      );

      return titleMatch || descMatch || categoryMatch || itemMatch;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <div className="p-4 flex flex-col gap-3.5">
      {/* Header Info Banner */}
      <div className="p-4 bg-panel border border-line rounded-2xl flex flex-col gap-1.5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="text-base font-bold text-cream flex items-center gap-2">
            <Dumbbell size={18} className="text-go" />
            Каталог тренировок
          </div>
          <span className="font-mono text-[11px] px-2 py-0.5 rounded-full bg-go/10 border border-go/30 text-go font-semibold">
            {Object.keys(WORKOUTS).length} программ
          </span>
        </div>
        <div className="text-xs text-muted leading-relaxed">
          Full Body, Быстрая ходьба, сплиты PPL и восстановление с видео-техникой и персональным AI Тренером.
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Поиск по названию, упражнению, мышцам..."
          className="w-full pl-9 pr-8 py-2.5 bg-panel border border-line rounded-xl text-xs text-cream placeholder:text-muted focus:outline-none focus:border-go transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Category Pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs font-mono">
        {WORKOUT_CATEGORIES.map((cat) => {
          const active = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all flex items-center gap-1 border ${
                active
                  ? "bg-go text-bg font-bold border-go shadow-sm"
                  : "bg-panel border-line text-muted hover:text-cream hover:border-line/80"
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Workouts List */}
      {filteredWorkouts.length === 0 ? (
        <div className="p-8 text-center bg-panel/60 border border-line rounded-2xl space-y-2">
          <div className="text-muted text-xs font-mono">Ничего не найдено по вашему запросу</div>
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("all");
            }}
            className="text-xs text-go hover:underline font-mono"
          >
            Сбросить фильтры
          </button>
        </div>
      ) : (
        filteredWorkouts.map(([key, w]) => (
          <Panel key={key} className="space-y-3">
            {/* Header of the workout card */}
            <div className="flex flex-col gap-1.5 border-b border-line/50 pb-2.5">
              <div className="flex justify-between items-start gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-md text-bg shrink-0"
                    style={{ backgroundColor: w.color }}
                  >
                    {w.categoryLabel || "Тренировка"}
                  </span>
                  <h4 className="text-[15px] font-bold text-cream">{w.title}</h4>
                </div>
                <div className="font-mono text-xs text-muted px-2 py-0.5 bg-bg/60 rounded-lg border border-line/40 shrink-0 flex items-center gap-1">
                  <Timer size={12} className="text-muted" />
                  {w.duration}
                </div>
              </div>

              {w.description && (
                <p className="text-xs text-muted leading-relaxed">{w.description}</p>
              )}
            </div>

            {/* Exercise items list */}
            <div className="flex flex-col gap-2">
              {w.items.map((it, i) => (
                <div
                  key={i}
                  onClick={() => openExercise(it, w.color, w.title)}
                  className="pl-3 py-2.5 pr-2.5 bg-bg/40 hover:bg-bg/80 border-l-4 rounded-r-xl cursor-pointer transition-all flex items-center justify-between group"
                  style={{ borderLeftColor: w.color }}
                >
                  <div className="space-y-0.5 pr-2">
                    <div className="text-[13px] font-semibold text-cream group-hover:text-accent transition-colors flex items-center gap-1.5">
                      <span>{it.name}</span>
                      <Info size={13} className="text-muted opacity-60 group-hover:opacity-100 shrink-0" />
                    </div>
                    <div className="text-xs text-muted leading-snug">{it.detail}</div>
                  </div>
                  <ChevronRight
                    size={16}
                    className="text-muted group-hover:text-cream transition-transform group-hover:translate-x-0.5 shrink-0"
                  />
                </div>
              ))}
            </div>
          </Panel>
        ))
      )}

      {/* Technique & Video Modal */}
      {selectedExercise && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-panel border border-line rounded-3xl w-full max-w-[460px] max-h-[90vh] overflow-y-auto p-5 space-y-4 shadow-2xl relative">
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-line/60 pb-3">
              <div>
                <span
                  className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-md text-bg font-bold"
                  style={{ backgroundColor: selectedExercise.color }}
                >
                  {selectedExercise.workoutTitle || "Упражнение"}
                </span>
                <h3 className="text-lg font-bold text-cream mt-1 leading-snug">{selectedExercise.name}</h3>
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
                <span>Встроенный Плеер</span>
              </button>
            </div>

            {/* TAB 1: AI & Text Technique */}
            {modalTab === "ai" && (
              <div className="space-y-3.5 animate-fadeIn">
                {/* Quick Summary */}
                <div className="p-3 bg-bg/60 rounded-2xl border border-line/50 text-xs text-cream space-y-1 font-mono">
                  <span className="text-go font-bold">Параметры и схема: </span>
                  <span>{selectedExercise.detail}</span>
                </div>

                {/* Quick Prompts */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-mono text-muted flex items-center gap-1">
                    <Zap size={12} className="text-go" />
                    Быстрые вопросы AI Тренеру:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {quickQuestions.map((qq, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleAskAi(qq)}
                        disabled={loadingAi}
                        className="text-[11px] px-2.5 py-1 bg-bg/70 hover:bg-bg border border-line hover:border-go/50 text-cream/90 rounded-lg transition-colors text-left disabled:opacity-50"
                      >
                        {qq}
                      </button>
                    ))}
                  </div>
                </div>

                {/* AI Trainer Consultation Section */}
                <div className="p-3.5 bg-bg/80 border border-go/40 rounded-2xl space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-mono text-go font-bold">
                    <Sparkles size={16} />
                    Консультация с AI Тренером
                  </div>

                  <p className="text-xs text-muted leading-relaxed">
                    Задайте любой вопрос по технике, весам или альтернативам:
                  </p>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={userQuestion}
                      onChange={(e) => setUserQuestion(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAskAi()}
                      placeholder="Задать свой вопрос тренеру..."
                      className="flex-1 p-2 bg-panel border border-line rounded-xl text-xs text-cream placeholder:text-muted focus:outline-none focus:border-go"
                    />
                    <button
                      onClick={() => handleAskAi()}
                      disabled={loadingAi}
                      className="px-4 py-2.5 bg-go hover:bg-[#34B87D] disabled:opacity-40 text-bg font-extrabold rounded-xl text-xs font-sans transition-all flex items-center gap-1.5 shrink-0 shadow-md active:scale-95 cursor-pointer min-h-[38px]"
                    >
                      {loadingAi ? <Loader2 size={16} className="animate-spin text-bg" /> : <Sparkles size={16} className="text-bg" />}
                      <span className="font-extrabold text-bg text-xs">Спросить</span>
                    </button>
                  </div>

                  {aiError && (
                    <div className="p-2.5 bg-red-950/40 border border-red-800 text-red-200 text-xs rounded-xl flex items-center gap-2">
                      <AlertCircle size={14} className="shrink-0" />
                      <span>{aiError}</span>
                    </div>
                  )}

                  {aiAdvice && (
                    <div className="p-3 bg-panel border border-go/50 rounded-xl text-xs text-cream whitespace-pre-wrap leading-relaxed animate-fadeIn space-y-1">
                      <div className="font-mono font-bold text-go flex items-center gap-1">
                        <CheckCircle2 size={14} /> Рекомендация AI Тренера:
                      </div>
                      <div className="text-cream leading-relaxed">{aiAdvice}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: Embedded YouTube Shorts Player */}
            {modalTab === "shorts" && (
              <div className="space-y-3 animate-fadeIn">
                <div className="p-3 bg-bg/80 border border-line rounded-2xl space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono text-white">
                    <span className="flex items-center gap-1.5 font-bold text-red-500">
                      <Play size={16} fill="#FF0000" />
                      Видео-техника на сайте:
                    </span>
                    <span className="text-[10px] text-muted font-mono">{selectedExercise.name}</span>
                  </div>

                  {/* Embedded YouTube Frame */}
                  <div className="relative w-full aspect-[9/16] max-h-[380px] bg-black rounded-2xl overflow-hidden border border-line shadow-2xl mx-auto flex items-center justify-center">
                    {selectedExercise.videoId ? (
                      <iframe
                        src={`https://www.youtube.com/embed/${selectedExercise.videoId}?autoplay=0&rel=0&modestbranding=1`}
                        title={selectedExercise.name}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full rounded-2xl border-none"
                      />
                    ) : (
                      <div className="p-4 text-center text-muted text-xs font-mono">
                        Видеоплеер недоступен
                      </div>
                    )}
                  </div>

                  {/* Optional External Link Button */}
                  <a
                    href={getYoutubeShortsUrl("техника shorts")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-3 bg-panelAlt hover:bg-line text-cream font-semibold rounded-xl text-xs font-sans flex items-center justify-center gap-1.5 transition-colors decoration-none"
                  >
                    <span>Открыть в приложении YouTube</span>
                    <ExternalLink size={14} />
                  </a>
                </div>

                {/* Quick Video Search Topics */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-mono text-muted uppercase">Другие ролики на YouTube:</div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <a
                      href={getYoutubeShortsUrl("как правильно делать shorts")}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-bg/60 hover:bg-bg border border-line rounded-lg text-cream flex items-center justify-between transition-colors decoration-none"
                    >
                      <span>🎯 Разбор техники</span>
                      <ExternalLink size={12} className="text-muted" />
                    </a>
                    <a
                      href={getYoutubeShortsUrl("ошибки техника shorts")}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-bg/60 hover:bg-bg border border-line rounded-lg text-cream flex items-center justify-between transition-colors decoration-none"
                    >
                      <span>⚠️ Главные ошибки</span>
                      <ExternalLink size={12} className="text-muted" />
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
