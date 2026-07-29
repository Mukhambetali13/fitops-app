import { useState, useEffect, useRef } from "react";
import { api } from "../api";
import { Sparkles, Camera, Utensils, Trash2, Plus, Check, X, Loader2, Image as ImageIcon } from "lucide-react";

export default function FoodTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");

  const [textInput, setTextInput] = useState("");
  const [selectedImage, setSelectedImage] = useState(null); // base64
  const [imageMime, setImageMime] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");

  // AI Result Preview / Edit state
  const [aiResult, setAiResult] = useState(null);
  const [editableMealName, setEditableMealName] = useState("");
  const [editableCal, setEditableCal] = useState(0);
  const [editableP, setEditableP] = useState(0);
  const [editableF, setEditableF] = useState(0);
  const [editableC, setEditableC] = useState(0);

  const fileInputRef = useRef(null);

  const loadTodayFood = async () => {
    try {
      setError("");
      const res = await api.getTodayFood();
      setData(res);
    } catch (err) {
      setError(err.message || "Не удалось загрузить дневник питания");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTodayFood();
  }, []);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Размер файла не должен превышать 5 МБ");
      return;
    }

    const mime = file.type || "image/jpeg";
    setImageMime(mime);
    setPreviewUrl(URL.createObjectURL(file));

    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImageMime("");
    setPreviewUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleAnalyze = async () => {
    if (!textInput.trim() && !selectedImage) {
      setError("Добавьте фото или опишите еду словами");
      return;
    }

    setAnalyzing(true);
    setError("");
    setAiResult(null);

    try {
      const res = await api.analyzeFood({
        text: textInput.trim(),
        image: selectedImage || "",
        mime: imageMime,
      });

      setAiResult(res);
      setEditableMealName(res.meal_name || "Прием пищи");
      setEditableCal(res.total_calories || 0);
      setEditableP(res.total_protein || 0);
      setEditableF(res.total_fat || 0);
      setEditableC(res.total_carbs || 0);
    } catch (err) {
      setError(err.message || "Ошибка распознавания. Проверьте GROQ_API_KEY / GEMINI_API_KEY.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSaveLog = async () => {
    if (!editableMealName.trim()) return;

    try {
      await api.logFood({
        mealName: editableMealName.trim(),
        calories: Number(editableCal) || 0,
        protein: Number(editableP) || 0,
        fat: Number(editableF) || 0,
        carbs: Number(editableC) || 0,
        rawJson: JSON.stringify(aiResult),
      });

      // Clear form
      setAiResult(null);
      setTextInput("");
      removeImage();

      // Reload
      await loadTodayFood();
    } catch (err) {
      setError(err.message || "Ошибка сохранения блюда");
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteFoodLog(id);
      await loadTodayFood();
    } catch (err) {
      setError(err.message || "Ошибка удаления");
    }
  };

  if (loading) {
    return (
      <div className="p-4 text-center text-muted font-mono text-xs">
        Загрузка дневника питания...
      </div>
    );
  }

  const calorieGoal = data?.calorieGoal || 2000;
  const totalCalories = data?.totalCalories || 0;
  const totalProtein = (data?.totalProtein || 0).toFixed(1);
  const totalFat = (data?.totalFat || 0).toFixed(1);
  const totalCarbs = (data?.totalCarbs || 0).toFixed(1);
  const logs = data?.logs || [];

  const pct = Math.min(Math.round((totalCalories / calorieGoal) * 100), 100);

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-cream flex items-center gap-2">
          <Utensils className="text-accent" size={20} />
          Питание и AI Ккал
        </h2>
        <span className="text-xs font-mono text-muted">Groq AI Vision</span>
      </div>

      {error && (
        <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-red-200 text-xs flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError("")} className="text-muted hover:text-white">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Progress Widget */}
      <div className="p-4 bg-panel border border-line rounded-2xl space-y-3">
        <div className="flex justify-between items-baseline">
          <div>
            <div className="text-xs text-muted font-mono uppercase">Съедено сегодня</div>
            <div className="text-2xl font-bold font-mono text-cream">
              {totalCalories}{" "}
              <span className="text-sm font-normal text-muted">/ {calorieGoal} ккал</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs font-mono font-bold text-accent">{pct}%</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2.5 bg-bg rounded-full overflow-hidden border border-line">
          <div
            className={`h-full transition-all duration-500 ${
              totalCalories > calorieGoal ? "bg-red-500" : "bg-accent"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Macros Breakdown */}
        <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-center">
          <div className="p-2 bg-bg/50 rounded-xl border border-line/50">
            <div className="text-[10px] text-muted uppercase">Белки (Б)</div>
            <div className="text-sm font-bold text-cream">{totalProtein}г</div>
          </div>
          <div className="p-2 bg-bg/50 rounded-xl border border-line/50">
            <div className="text-[10px] text-muted uppercase">Жиры (Ж)</div>
            <div className="text-sm font-bold text-cream">{totalFat}г</div>
          </div>
          <div className="p-2 bg-bg/50 rounded-xl border border-line/50">
            <div className="text-[10px] text-muted uppercase">Углеводы (У)</div>
            <div className="text-sm font-bold text-cream">{totalCarbs}г</div>
          </div>
        </div>
      </div>

      {/* Add / Analyze Form */}
      <div className="p-4 bg-panel border border-line rounded-2xl space-y-3">
        <div className="flex items-center gap-2 text-xs font-mono text-accent uppercase font-bold">
          <Sparkles size={16} />
          Распознать прием пищи через AI
        </div>

        {/* Image Preview if selected */}
        {previewUrl && (
          <div className="relative w-full h-40 bg-bg rounded-xl overflow-hidden border border-line flex items-center justify-center">
            <img src={previewUrl} alt="Еда" className="w-full h-full object-cover" />
            <button
              onClick={removeImage}
              className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-black text-white rounded-full"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Text Input */}
        <textarea
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          placeholder="Опишите блюдо (например: Борщ 300г, 2 кусочка хлеба, сметана 20г)..."
          rows={2}
          className="w-full p-3 bg-bg border border-line rounded-xl text-sm text-cream placeholder:text-muted focus:outline-none focus:border-accent resize-none"
        />

        {/* Controls */}
        <div className="flex items-center gap-2">
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleImageSelect}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-3 bg-panelAlt border border-line hover:border-go text-cream rounded-xl text-xs font-semibold transition-colors"
          >
            <Camera size={18} className="text-go" />
            <span>{previewUrl ? "Сменить фото" : "Загрузить фото"}</span>
          </button>

          <button
            type="button"
            onClick={handleAnalyze}
            disabled={analyzing || (!textInput.trim() && !selectedImage)}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-go hover:bg-[#34B87D] disabled:opacity-40 text-bg font-extrabold rounded-xl text-sm font-sans transition-all shadow-md active:scale-95 cursor-pointer min-h-[44px]"
          >
            {analyzing ? (
              <>
                <Loader2 size={18} className="animate-spin text-bg" />
                <span className="font-extrabold text-bg text-sm">Анализируем...</span>
              </>
            ) : (
              <>
                <Sparkles size={18} className="text-bg" />
                <span className="font-extrabold text-bg text-sm">Распознать ккал</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* AI Result Card for Confirmation */}
      {aiResult && (
        <div className="p-4 bg-panel border-2 border-go/60 rounded-2xl space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-go flex items-center gap-1.5">
              <Check size={16} /> Результат распознавания AI
            </h3>
            <button
              onClick={() => setAiResult(null)}
              className="text-muted hover:text-cream text-xs"
            >
              <X size={16} />
            </button>
          </div>

          <div className="space-y-2">
            <div>
              <label className="text-[10px] text-muted font-mono uppercase block mb-1">
                Название блюда
              </label>
              <input
                type="text"
                value={editableMealName}
                onChange={(e) => setEditableMealName(e.target.value)}
                className="w-full p-2 bg-bg border border-line rounded-lg text-sm text-cream font-bold"
              />
            </div>

            {/* List of ingredients found */}
            {aiResult.items && aiResult.items.length > 0 && (
              <div className="space-y-1 bg-bg/40 p-2 rounded-xl border border-line/40 text-xs">
                <div className="text-[10px] text-muted font-mono uppercase mb-1">Состав:</div>
                {aiResult.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-cream">
                    <span>
                      • {item.name} {item.grams > 0 ? `(${item.grams}г)` : ""}
                    </span>
                    <span className="font-mono text-muted">{item.calories} ккал</span>
                  </div>
                ))}
              </div>
            )}

            {/* Editable Macros */}
            <div className="grid grid-cols-4 gap-2 pt-1 font-mono">
              <div>
                <label className="text-[9px] text-muted uppercase block">Ккал</label>
                <input
                  type="number"
                  value={editableCal}
                  onChange={(e) => setEditableCal(e.target.value)}
                  className="w-full p-1.5 bg-bg border border-line rounded-lg text-xs text-cream font-bold text-center"
                />
              </div>
              <div>
                <label className="text-[9px] text-muted uppercase block">Белки (г)</label>
                <input
                  type="number"
                  step="0.1"
                  value={editableP}
                  onChange={(e) => setEditableP(e.target.value)}
                  className="w-full p-1.5 bg-bg border border-line rounded-lg text-xs text-cream font-bold text-center"
                />
              </div>
              <div>
                <label className="text-[9px] text-muted uppercase block">Жиры (г)</label>
                <input
                  type="number"
                  step="0.1"
                  value={editableF}
                  onChange={(e) => setEditableF(e.target.value)}
                  className="w-full p-1.5 bg-bg border border-line rounded-lg text-xs text-cream font-bold text-center"
                />
              </div>
              <div>
                <label className="text-[9px] text-muted uppercase block">Углевод (г)</label>
                <input
                  type="number"
                  step="0.1"
                  value={editableC}
                  onChange={(e) => setEditableC(e.target.value)}
                  className="w-full p-1.5 bg-bg border border-line rounded-lg text-xs text-cream font-bold text-center"
                />
              </div>
            </div>

            {aiResult.notes && (
              <p className="text-xs text-muted italic bg-bg/30 p-2 rounded-lg">
                💡 {aiResult.notes}
              </p>
            )}

            <button
              onClick={handleSaveLog}
              className="w-full py-3 bg-go hover:bg-[#34B87D] text-bg font-extrabold rounded-xl text-sm font-sans transition-all flex items-center justify-center gap-2 mt-2 shadow-md active:scale-95 cursor-pointer min-h-[44px]"
            >
              <Plus size={18} className="text-bg" />
              <span className="font-extrabold text-bg text-sm">Сохранить в дневник питания</span>
            </button>
          </div>
        </div>
      )}

      {/* Today's Meals Log */}
      <div className="space-y-2">
        <h3 className="text-xs font-mono text-muted uppercase tracking-wider font-bold">
          Записи за сегодня ({logs.length})
        </h3>

        {logs.length === 0 ? (
          <div className="p-6 text-center text-muted font-mono text-xs bg-panel border border-line rounded-2xl">
            Записей за сегодня пока нет. Воспользуйтесь AI выше!
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map((item) => (
              <div
                key={item.id}
                className="p-3 bg-panel border border-line rounded-2xl flex items-center justify-between hover:border-line/80 transition-colors"
              >
                <div className="space-y-0.5">
                  <div className="text-sm font-bold text-cream">{item.mealName}</div>
                  <div className="text-xs font-mono text-muted flex gap-2">
                    <span className="text-accent font-bold">{item.calories} ккал</span>
                    <span>•</span>
                    <span>Б: {item.protein}g</span>
                    <span>Ж: {item.fat}g</span>
                    <span>У: {item.carbs}g</span>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-2 text-muted hover:text-red-400 transition-colors"
                  title="Удалить запись"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
