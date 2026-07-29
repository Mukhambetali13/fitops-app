export const WORKOUTS = {
  recovery: {
    title: "Восстановление",
    duration: "15–20 мин",
    color: "#5EA8C7",
    items: [
      { name: "Растяжка всего тела", detail: "5–7 стато-растяжек по 30 сек: грудь, спина, бедро, икры", videoId: "g_tea8ZNk5A" },
      { name: "Дыхательная гимнастика", detail: "4-7-8: вдох 4 сек, задержка 7, выдох 8 — 6 циклов", videoId: "w29a1K0vjEE" },
      { name: "Лёгкая ходьба", detail: "10 мин в спокойном темпе, разгрузить спину после смены", videoId: "_Hla3eEwHqY" },
    ],
  },
  cardio_light: {
    title: "Лёгкое кардио",
    duration: "20–30 мин",
    color: "#5EA8C7",
    items: [
      { name: "Ходьба / велотренажёр", detail: "Пульс 110–130 уд/мин, разговорный темп", videoId: "_Hla3eEwHqY" },
      { name: "Техника", detail: "Держи темп ровным — цель не нагрузка, а расход калорий и разгрузка ЦНС", videoId: "g_tea8ZNk5A" },
    ],
  },
  legs: {
    title: "Ноги + кор",
    duration: "50–60 мин",
    color: "#E5555A",
    items: [
      { name: "Приседания со штангой", detail: "4×8, колено по направлению носка, спина нейтральна, таз назад-вниз", videoId: "bEv6CCg2BC8" },
      { name: "Румынская тяга", detail: "4×10, минимальный сгиб колена, тянуть за счёт таза, гриф вдоль ног", videoId: "2SHsk9A5hVs" },
      { name: "Жим ногами", detail: "3×12, не отрывай поясницу от спинки", videoId: "IZxyjW7MPJQ" },
      { name: "Выпады с гантелями", detail: "3×10 на ногу, колено не выходит за носок", videoId: "D7KaRcUTQeE" },
      { name: "Планка", detail: "3×45 сек, таз не проваливать", videoId: "pSHjTRCQxIw" },
    ],
  },
  active_rest: {
    title: "Активное восстановление",
    duration: "15 мин",
    color: "#5EA8C7",
    items: [
      { name: "Прогулка на свежем воздухе", detail: "15–20 мин, вместо перекура — переключение и никотиновая пауза", videoId: "_Hla3eEwHqY" },
      { name: "Мобилити тазобедренных", detail: "90/90 стретч, по 1 мин на сторону", videoId: "Z7z5iL8bKGE" },
    ],
  },
  recovery_full: {
    title: "Сон и восстановление",
    duration: "по самочувствию",
    color: "#5EA8C7",
    items: [
      { name: "Приоритет — сон", detail: "Компенсируй недосып после ночных смен, 7–8 часов", videoId: "w29a1K0vjEE" },
      { name: "Прогулка 30–40 мин", detail: "Низкий пульс, на свежем воздухе, с семьёй", videoId: "_Hla3eEwHqY" },
      { name: "Растяжка", detail: "10 мин на крупные группы мышц", videoId: "g_tea8ZNk5A" },
    ],
  },
  push: {
    title: "Грудь / плечи / трицепс",
    duration: "55–65 мин",
    color: "#F2A93B",
    items: [
      { name: "Жим штанги лёжа", detail: "4×8, лопатки сведены и прижаты, гриф к нижней части груди", videoId: "rT7DgCr-3pg" },
      { name: "Жим гантелей на наклонной", detail: "3×10, локти под 45° к корпусу", videoId: "8iPEnn-ltC8" },
      { name: "Жим гантелей сидя (плечи)", detail: "3×10, не прогибай поясницу", videoId: "qEwKCR5JCog" },
      { name: "Разведение гантелей в стороны", detail: "3×12, лёгкий вес, без раскачки", videoId: "3VcKaXpzqRo" },
      { name: "Разгибание рук на трицепс", detail: "3×12, локти зафиксированы у корпуса", videoId: "2-LAMcpzODU" },
      { name: "HIIT: 8×20 сек спринт/берпи", detail: "20 сек макс. усилие / 40 сек отдых", videoId: "auBLPXO8F6U" },
    ],
  },
  pull: {
    title: "Спина / бицепс / пресс",
    duration: "55–65 мин",
    color: "#F2A93B",
    items: [
      { name: "Подтягивания", detail: "4×макс, лопатки вниз-назад перед началом тяги", videoId: "eGo4IYlbE5g" },
      { name: "Тяга штанги в наклоне", detail: "3×10, спина прямая, тянуть к низу живота", videoId: "VKFeB7jy8v0" },
      { name: "Тяга верхнего блока", detail: "3×12, не тянуть весом тела назад", videoId: "CAwf7n6Luuc" },
      { name: "Сгибание рук со штангой", detail: "3×10, локти неподвижны", videoId: "in7PaeYlhrM" },
      { name: "Скручивания / подъём ног в висе", detail: "3×15, без рывков", videoId: "Xyd_fa5zoEU" },
    ],
  },
  legs_full: {
    title: "Ноги + метаболический круг",
    duration: "60 мин",
    color: "#E5555A",
    items: [
      { name: "Становая тяга", detail: "4×6, спина прямая, гриф ближе к голеням, тянуть ногами", videoId: "op9kVnSso6Q" },
      { name: "Болгарские выпады", detail: "3×10 на ногу, корпус слегка вперёд", videoId: "2C-uNgKwPLE" },
      { name: "Подъём на голень", detail: "4×15, полная амплитуда", videoId: "3C4sA3Q3Y70" },
      { name: "Круг: приседания/скакалка/отжимания", detail: "4 круга по 40 сек работа / 20 сек отдых", videoId: "auBLPXO8F6U" },
    ],
  },
};
