package main

import "time"

type CycleDay struct {
	Label      string `json:"label"`
	Kind       string `json:"kind"` // day | night | off
	WorkoutKey string `json:"workoutKey"`
	Note       string `json:"note"`
}

type WorkoutMeta struct {
	Title    string `json:"title"`
	Duration string `json:"duration"`
}

var Cycle = [8]CycleDay{
	{"Дневная смена 1", "day", "recovery", "08:00–20:00 на смене"},
	{"Дневная смена 2", "day", "cardio_light", "08:00–20:00 на смене"},
	{"Ночная смена 1", "night", "legs", "тренировка утром, смена 20:00–08:00"},
	{"Ночная смена 2", "night", "active_rest", "накопленная усталость — легко"},
	{"Выходной 1", "off", "recovery_full", "сон и восстановление после ночей"},
	{"Выходной 2", "off", "push", "грудь / плечи / трицепс"},
	{"Выходной 3", "off", "pull", "спина / бицепс / пресс"},
	{"Выходной 4", "off", "legs_full", "ноги + метаболическая работа"},
}

var Workouts = map[string]WorkoutMeta{
	"recovery":      {"Восстановление", "15–20 мин"},
	"cardio_light":  {"Лёгкое кардио", "20–30 мин"},
	"legs":          {"Ноги + кор", "50–60 мин"},
	"active_rest":   {"Активное восстановление", "15 мин"},
	"recovery_full": {"Сон и восстановление", "по самочувствию"},
	"push":          {"Грудь / плечи / трицепс", "55–65 мин"},
	"pull":          {"Спина / бицепс / пресс", "55–65 мин"},
	"legs_full":     {"Ноги + метаболический круг", "60 мин"},
}

func dateOnly(t time.Time) time.Time {
	y, m, d := t.Date()
	return time.Date(y, m, d, 0, 0, 0, 0, time.UTC)
}

// CycleIndexFor returns which of the 8 rotation days `date` falls on,
// given the date the rotation started (day index 0 = first day shift).
func CycleIndexFor(date, rosterStart time.Time) int {
	diff := int(dateOnly(date).Sub(dateOnly(rosterStart)).Hours() / 24)
	idx := diff % 8
	if idx < 0 {
		idx += 8
	}
	return idx
}

func DayInfo(date, rosterStart time.Time) (CycleDay, WorkoutMeta) {
	idx := CycleIndexFor(date, rosterStart)
	cd := Cycle[idx]
	return cd, Workouts[cd.WorkoutKey]
}

func DefaultChecklist(cd CycleDay, wm WorkoutMeta) []string {
	items := []string{"Вода 2.5 л", "Приём пищи по плану", "Витамины"}
	if cd.Kind == "off" {
		items = append(items, "Тренировка: "+wm.Title)
	} else {
		items = append(items, "Разминка / растяжка 10 мин")
	}
	items = append(items, "Без сигарет сегодня")
	return items
}
