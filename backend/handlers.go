package main

import (
	"context"
	"net/http"
	"strconv"
	"time"
)

type Settings struct {
	StartWeight  float64 `json:"startWeight"`
	GoalWeight   float64 `json:"goalWeight"`
	Height       int     `json:"height"`
	RosterStart  string  `json:"rosterStart"`
	CigsPerDay   int     `json:"cigsPerDay"`
	PricePerPack int     `json:"pricePerPack"`
	QuitDate     *string `json:"quitDate"`
	CalorieGoal  int     `json:"calorieGoal"`
}

func getSettings(ctx context.Context) (Settings, error) {
	var s Settings
	var rosterStart time.Time
	var quitDate *time.Time
	err := pool.QueryRow(ctx, `SELECT start_weight, goal_weight, height, roster_start, cigs_per_day, price_per_pack, quit_date, calorie_goal FROM settings WHERE id=1`).
		Scan(&s.StartWeight, &s.GoalWeight, &s.Height, &rosterStart, &s.CigsPerDay, &s.PricePerPack, &quitDate, &s.CalorieGoal)
	if err != nil {
		return s, err
	}
	s.RosterStart = rosterStart.Format("2006-01-02")
	if quitDate != nil {
		q := quitDate.Format("2006-01-02")
		s.QuitDate = &q
	}
	if s.CalorieGoal == 0 {
		s.CalorieGoal = 2000
	}
	return s, nil
}

func settingsHandler(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	switch r.Method {
	case http.MethodGet:
		s, err := getSettings(ctx)
		if err != nil {
			writeError(w, 500, "не удалось получить настройки")
			return
		}
		writeJSON(w, 200, s)
	case http.MethodPut:
		var body Settings
		if err := decodeJSON(r, &body); err != nil {
			writeError(w, 400, "неверные данные")
			return
		}
		if body.CalorieGoal <= 0 {
			body.CalorieGoal = 2000
		}
		_, err := pool.Exec(ctx, `UPDATE settings SET start_weight=$1, goal_weight=$2, height=$3, roster_start=$4, cigs_per_day=$5, price_per_pack=$6, calorie_goal=$7 WHERE id=1`,
			body.StartWeight, body.GoalWeight, body.Height, body.RosterStart, body.CigsPerDay, body.PricePerPack, body.CalorieGoal)
		if err != nil {
			writeError(w, 500, "не удалось сохранить настройки")
			return
		}
		writeJSON(w, 200, map[string]bool{"ok": true})
	default:
		writeError(w, 405, "метод не поддерживается")
	}
}

// ---------- today / roster ----------

func todayHandler(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	s, err := getSettings(ctx)
	if err != nil {
		writeError(w, 500, "не удалось получить настройки")
		return
	}
	rosterStart, _ := time.Parse("2006-01-02", s.RosterStart)
	cd, wm := DayInfo(time.Now().UTC(), rosterStart)
	today := time.Now().UTC().Format("2006-01-02")

	items, err := loadOrCreateChecklist(ctx, today, cd, wm)
	if err != nil {
		writeError(w, 500, "не удалось получить чек-лист")
		return
	}

	writeJSON(w, 200, map[string]any{
		"date":        today,
		"kind":        cd.Kind,
		"label":       cd.Label,
		"note":        cd.Note,
		"workoutKey":  cd.WorkoutKey,
		"workoutMeta": wm,
		"checklist":   items,
	})
}

func rosterHandler(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	s, err := getSettings(ctx)
	if err != nil {
		writeError(w, 500, "не удалось получить настройки")
		return
	}
	rosterStart, _ := time.Parse("2006-01-02", s.RosterStart)
	type day struct {
		Date        string      `json:"date"`
		Kind        string      `json:"kind"`
		Label       string      `json:"label"`
		Note        string      `json:"note"`
		WorkoutKey  string      `json:"workoutKey"`
		WorkoutMeta WorkoutMeta `json:"workoutMeta"`
	}
	out := make([]day, 0, 8)
	now := time.Now().UTC()
	for i := 0; i < 8; i++ {
		d := now.AddDate(0, 0, i)
		cd, wm := DayInfo(d, rosterStart)
		out = append(out, day{d.Format("2006-01-02"), cd.Kind, cd.Label, cd.Note, cd.WorkoutKey, wm})
	}
	writeJSON(w, 200, out)
}

// ---------- weight logs ----------

func weightsHandler(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	switch r.Method {
	case http.MethodGet:
		rows, err := pool.Query(ctx, `SELECT log_date, weight FROM weight_logs ORDER BY log_date ASC`)
		if err != nil {
			writeError(w, 500, "не удалось получить записи веса")
			return
		}
		defer rows.Close()
		type entry struct {
			Date   string  `json:"date"`
			Weight float64 `json:"weight"`
		}
		out := []entry{}
		for rows.Next() {
			var d time.Time
			var wgt float64
			if err := rows.Scan(&d, &wgt); err == nil {
				out = append(out, entry{d.Format("2006-01-02"), wgt})
			}
		}
		writeJSON(w, 200, out)
	case http.MethodPost:
		var body struct {
			Date   string  `json:"date"`
			Weight float64 `json:"weight"`
		}
		if err := decodeJSON(r, &body); err != nil || body.Weight <= 0 {
			writeError(w, 400, "неверные данные")
			return
		}
		_, err := pool.Exec(ctx, `INSERT INTO weight_logs (log_date, weight) VALUES ($1, $2)
			ON CONFLICT (log_date) DO UPDATE SET weight = EXCLUDED.weight`, body.Date, body.Weight)
		if err != nil {
			writeError(w, 500, "не удалось сохранить вес")
			return
		}
		writeJSON(w, 200, map[string]bool{"ok": true})
	default:
		writeError(w, 405, "метод не поддерживается")
	}
}

// ---------- checklist ----------

type ChecklistItem struct {
	ID   int    `json:"id"`
	Text string `json:"text"`
	Done bool   `json:"done"`
}

func loadOrCreateChecklist(ctx context.Context, date string, cd CycleDay, wm WorkoutMeta) ([]ChecklistItem, error) {
	rows, err := pool.Query(ctx, `SELECT id, text, done FROM checklist_items WHERE item_date=$1 ORDER BY sort_order ASC, id ASC`, date)
	if err != nil {
		return nil, err
	}
	items := []ChecklistItem{}
	for rows.Next() {
		var it ChecklistItem
		if err := rows.Scan(&it.ID, &it.Text, &it.Done); err == nil {
			items = append(items, it)
		}
	}
	rows.Close()
	if len(items) > 0 {
		return items, nil
	}
	defaults := DefaultChecklist(cd, wm)
	for i, text := range defaults {
		var id int
		err := pool.QueryRow(ctx, `INSERT INTO checklist_items (item_date, text, sort_order) VALUES ($1,$2,$3) RETURNING id`, date, text, i).Scan(&id)
		if err != nil {
			return nil, err
		}
		items = append(items, ChecklistItem{ID: id, Text: text, Done: false})
	}
	return items, nil
}

func checklistHandler(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	switch r.Method {
	case http.MethodGet:
		date := r.URL.Query().Get("date")
		if date == "" {
			date = time.Now().UTC().Format("2006-01-02")
		}
		s, err := getSettings(ctx)
		if err != nil {
			writeError(w, 500, "не удалось получить настройки")
			return
		}
		rosterStart, _ := time.Parse("2006-01-02", s.RosterStart)
		d, _ := time.Parse("2006-01-02", date)
		cd, wm := DayInfo(d, rosterStart)
		items, err := loadOrCreateChecklist(ctx, date, cd, wm)
		if err != nil {
			writeError(w, 500, "не удалось получить чек-лист")
			return
		}
		writeJSON(w, 200, items)
	case http.MethodPost:
		var body struct {
			Date string `json:"date"`
			Text string `json:"text"`
		}
		if err := decodeJSON(r, &body); err != nil || body.Text == "" {
			writeError(w, 400, "неверные данные")
			return
		}
		var id int
		err := pool.QueryRow(ctx, `INSERT INTO checklist_items (item_date, text, sort_order) VALUES ($1,$2,999) RETURNING id`, body.Date, body.Text).Scan(&id)
		if err != nil {
			writeError(w, 500, "не удалось добавить пункт")
			return
		}
		writeJSON(w, 200, ChecklistItem{ID: id, Text: body.Text, Done: false})
	default:
		writeError(w, 405, "метод не поддерживается")
	}
}

func checklistItemHandler(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	id, idErr := strconv.Atoi(r.PathValue("id"))
	if idErr != nil {
		writeError(w, 400, "неверный id")
		return
	}
	switch r.Method {
	case http.MethodPatch:
		var body struct {
			Done bool `json:"done"`
		}
		if err := decodeJSON(r, &body); err != nil {
			writeError(w, 400, "неверные данные")
			return
		}
		_, err := pool.Exec(ctx, `UPDATE checklist_items SET done=$1 WHERE id=$2`, body.Done, id)
		if err != nil {
			writeError(w, 500, "не удалось обновить пункт")
			return
		}
		writeJSON(w, 200, map[string]bool{"ok": true})
	case http.MethodDelete:
		_, err := pool.Exec(ctx, `DELETE FROM checklist_items WHERE id=$1`, id)
		if err != nil {
			writeError(w, 500, "не удалось удалить пункт")
			return
		}
		writeJSON(w, 200, map[string]bool{"ok": true})
	default:
		writeError(w, 405, "метод не поддерживается")
	}
}

// ---------- smoking tracker ----------

func smokingHandler(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	s, err := getSettings(ctx)
	if err != nil {
		writeError(w, 500, "не удалось получить настройки")
		return
	}
	rows, err := pool.Query(ctx, `SELECT intensity, occurred_at FROM cravings ORDER BY occurred_at DESC LIMIT 30`)
	cravings := []map[string]any{}
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var intensity int
			var at time.Time
			if err := rows.Scan(&intensity, &at); err == nil {
				cravings = append(cravings, map[string]any{"intensity": intensity, "at": at.Format(time.RFC3339)})
			}
		}
	}
	writeJSON(w, 200, map[string]any{
		"quitDate":     s.QuitDate,
		"cigsPerDay":   s.CigsPerDay,
		"pricePerPack": s.PricePerPack,
		"cravings":     cravings,
	})
}

func smokingStartHandler(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	today := time.Now().UTC().Format("2006-01-02")
	_, err := pool.Exec(ctx, `UPDATE settings SET quit_date=$1 WHERE id=1`, today)
	if err != nil {
		writeError(w, 500, "не удалось начать отсчёт")
		return
	}
	writeJSON(w, 200, map[string]string{"quitDate": today})
}

func smokingRelapseHandler(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	today := time.Now().UTC().Format("2006-01-02")
	_, err := pool.Exec(ctx, `INSERT INTO relapses (relapse_date) VALUES ($1)`, today)
	if err != nil {
		writeError(w, 500, "не удалось записать срыв")
		return
	}
	_, err = pool.Exec(ctx, `UPDATE settings SET quit_date=$1 WHERE id=1`, today)
	if err != nil {
		writeError(w, 500, "не удалось сбросить счётчик")
		return
	}
	writeJSON(w, 200, map[string]string{"quitDate": today})
}

func smokingCravingHandler(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	var body struct {
		Intensity int `json:"intensity"`
	}
	if err := decodeJSON(r, &body); err != nil || body.Intensity < 1 || body.Intensity > 5 {
		writeError(w, 400, "неверные данные")
		return
	}
	_, err := pool.Exec(ctx, `INSERT INTO cravings (intensity) VALUES ($1)`, body.Intensity)
	if err != nil {
		writeError(w, 500, "не удалось записать тягу")
		return
	}
	writeJSON(w, 200, map[string]bool{"ok": true})
}

func smokingSettingsHandler(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	var body struct {
		CigsPerDay   int `json:"cigsPerDay"`
		PricePerPack int `json:"pricePerPack"`
	}
	if err := decodeJSON(r, &body); err != nil {
		writeError(w, 400, "неверные данные")
		return
	}
	_, err := pool.Exec(ctx, `UPDATE settings SET cigs_per_day=$1, price_per_pack=$2 WHERE id=1`, body.CigsPerDay, body.PricePerPack)
	if err != nil {
		writeError(w, 500, "не удалось сохранить")
		return
	}
	writeJSON(w, 200, map[string]bool{"ok": true})
}

// ---------- nutrition / food handlers ----------

type FoodLogEntry struct {
	ID        int       `json:"id"`
	LogDate   string    `json:"logDate"`
	MealName  string    `json:"mealName"`
	Calories  int       `json:"calories"`
	Protein   float64   `json:"protein"`
	Fat       float64   `json:"fat"`
	Carbs     float64   `json:"carbs"`
	CreatedAt time.Time `json:"createdAt"`
}

func nutritionAnalyzeHandler(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	var body struct {
		Text  string `json:"text"`
		Image string `json:"image"`
		Mime  string `json:"mime"`
	}
	if err := decodeJSON(r, &body); err != nil {
		writeError(w, 400, "неверный формат запроса")
		return
	}

	if body.Text == "" && body.Image == "" {
		writeError(w, 400, "предоставьте фото или описание еды")
		return
	}

	res, err := AnalyzeFoodWithGemini(ctx, body.Text, body.Image, body.Mime)
	if err != nil {
		writeError(w, 500, err.Error())
		return
	}

	writeJSON(w, 200, res)
}

func nutritionTodayHandler(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	s, err := getSettings(ctx)
	if err != nil {
		writeError(w, 500, "ошибка получения настроек")
		return
	}

	today := time.Now().UTC().Format("2006-01-02")
	rows, err := pool.Query(ctx, `
		SELECT id, log_date, meal_name, calories, protein, fat, carbs, created_at 
		FROM food_logs 
		WHERE log_date = $1 
		ORDER BY created_at DESC
	`, today)
	if err != nil {
		writeError(w, 500, "ошибка чтения дневника питания")
		return
	}
	defer rows.Close()

	logs := []FoodLogEntry{}
	var totalCal int
	var totalP, totalF, totalC float64

	for rows.Next() {
		var item FoodLogEntry
		var logDate time.Time
		if err := rows.Scan(&item.ID, &logDate, &item.MealName, &item.Calories, &item.Protein, &item.Fat, &item.Carbs, &item.CreatedAt); err != nil {
			continue
		}
		item.LogDate = logDate.Format("2006-01-02")
		totalCal += item.Calories
		totalP += item.Protein
		totalF += item.Fat
		totalC += item.Carbs
		logs = append(logs, item)
	}

	writeJSON(w, 200, map[string]any{
		"calorieGoal":   s.CalorieGoal,
		"totalCalories": totalCal,
		"totalProtein":  totalP,
		"totalFat":      totalF,
		"totalCarbs":    totalC,
		"logs":          logs,
	})
}

func nutritionLogHandler(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	var body struct {
		MealName string  `json:"mealName"`
		Calories int     `json:"calories"`
		Protein  float64 `json:"protein"`
		Fat      float64 `json:"fat"`
		Carbs    float64 `json:"carbs"`
		RawJSON  string  `json:"rawJson,omitempty"`
	}
	if err := decodeJSON(r, &body); err != nil || body.MealName == "" {
		writeError(w, 400, "укажите название блюда")
		return
	}

	today := time.Now().UTC().Format("2006-01-02")
	var newID int
	err := pool.QueryRow(ctx, `
		INSERT INTO food_logs (log_date, meal_name, calories, protein, fat, carbs, ai_raw_json)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id
	`, today, body.MealName, body.Calories, body.Protein, body.Fat, body.Carbs, body.RawJSON).Scan(&newID)
	if err != nil {
		writeError(w, 500, "ошибка сохранения блюда")
		return
	}

	writeJSON(w, 200, map[string]any{"ok": true, "id": newID})
}

func nutritionLogItemHandler(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		writeError(w, 400, "неверный id")
		return
	}

	if r.Method == http.MethodDelete {
		_, err := pool.Exec(ctx, `DELETE FROM food_logs WHERE id=$1`, id)
		if err != nil {
			writeError(w, 500, "ошибка удаления записи")
			return
		}
		writeJSON(w, 200, map[string]bool{"ok": true})
		return
	}

	writeError(w, 405, "метод не поддерживается")
}

func workoutAdviceHandler(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	var body struct {
		ExerciseName string `json:"exerciseName"`
		Question     string `json:"question"`
	}
	if err := decodeJSON(r, &body); err != nil || body.ExerciseName == "" {
		writeError(w, 400, "укажите название упражнения")
		return
	}

	advice, err := AskWorkoutTrainer(ctx, body.ExerciseName, body.Question)
	if err != nil {
		writeError(w, 500, err.Error())
		return
	}

	writeJSON(w, 200, map[string]string{"advice": advice})
}


