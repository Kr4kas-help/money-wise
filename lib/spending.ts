import { uid, type Expense, type ExpenseCategory } from "./types";

export const categoryLabels: Record<ExpenseCategory, string> = {
  food: "Продукты",
  housing: "Жильё и связь",
  health: "Здоровье",
  transport: "Транспорт",
  debts: "Кредиты и долги",
  cafe: "Кафе и доставка",
  fun: "Развлечения и подписки",
  shopping: "Покупки и маркетплейсы",
  other: "Прочее",
};

// Категория нужна только для подсказки: «больше всего ушло на ...».
const categoryRules: [ExpenseCategory, RegExp][] = [
  ["debts", /кредит|ипотек|рассрочк|займ|погашен/i],
  ["housing", /жкх|коммунал|аренд|квартплат|электроэнерг|водоканал|интернет|связь|мтс|билайн|мегафон|теле2|tele2/i],
  ["health", /аптек|клиник|врач|стоматолог|лекарств|медцентр|анализ/i],
  ["transport", /метро|такси|uber|убер|азс|бензин|лукойл|роснефть|транспорт|парковк|каршеринг|ситимобил/i],
  ["food", /пят[её]рочк|магнит|перекр[её]ст|вкусвилл|лента|ашан|дикси|окей|продукт|супермаркет/i],
  ["cafe", /кафе|ресторан|кофе|кофейн|пицц|суши|бургер|макдоналдс|mcdonald|kfc|burger|starbucks|яндекс\s*еда|delivery|доставк|самокат|додо|вкусно/i],
  ["fun", /кино|театр|игр|steam|playstation|подписк|netflix|кинопоиск|okko|ivi|spotify|яндекс\s*плюс|музык|клуб|алкогол|винлаб|красное|бристоль|ставк|лотере/i],
  ["shopping", /wildberries|вайлдберриз|\bwb\b|ozon|озон|алиэкспресс|aliexpress|одежд|обув|маркет|днс|м\.видео|эльдорадо|zara|lamoda|ламода|косметик|летуаль|золотое яблоко/i],
];

export function guessCategory(name: string): ExpenseCategory {
  for (const [cat, re] of categoryRules) {
    if (re.test(name)) return cat;
  }
  return "other";
}

const ISO = /\b\d{4}-\d{2}-\d{2}\b/g;
const DATE = /\b\d{1,2}[./]\d{1,2}[./]\d{2,4}\b/g;
const DATE_WORDS = /\b\d{1,2}\s+(?:янв|фев|мар|апр|мая|май|июн|июл|авг|сен|окт|ноя|дек)[а-я]*\.?(?:\s+\d{4})?/gi;
const TIME = /\b\d{1,2}:\d{2}(?::\d{2})?\b/g;
const MASK = /\*+\s?\d{2,4}/g;

// 1: знак, 2: целая часть (с пробелами тысяч), 3: копейки, 4: валюта
const AMOUNT = /([+\-−–—])?\s*(\d{1,3}(?:[\s  ]\d{3})+|\d+)(?:[.,](\d{1,2}))?(?!\d)\s*(₽|руб\.?|rub)?/i;

const HEADER = /остаток|баланс|итого|всего|выписка|доступно|лимит/i;
const INCOME = /зарплат|аванс|пополнен|поступлен|возврат|кэшбэк|кешбэк|перевод от|пенси|начислен/i;

type Found = { raw: string; neg: boolean; plus: boolean; cur: boolean; value: number };

function findAmounts(line: string): Found[] {
  const re = new RegExp(AMOUNT.source, "gi");
  const out: Found[] = [];
  let m: RegExpExecArray | null = re.exec(line);
  while (m !== null) {
    const int = m[2].replace(/[\s  ]/g, "");
    const value = Number(int + (m[3] ? "." + m[3] : ""));
    const sign = m[1] ?? "";
    out.push({ raw: m[0], neg: sign !== "" && sign !== "+", plus: sign === "+", cur: !!m[4], value });
    m = re.exec(line);
  }
  return out;
}

// Разбирает вставленный текст (копия из банка, CSV, результат распознавания скриншота)
// на отдельные траты. Поступления и итоговые строки пропускаются.
export function parseExpenses(text: string): { items: Expense[]; skipped: number } {
  const items: Expense[] = [];
  let skipped = 0;
  for (const rawLine of text.split(/\r?\n/)) {
    if (items.length >= 300) break;
    const line = rawLine.trim();
    if (line.length < 3 || HEADER.test(line)) continue;

    const cleaned = line
      .replace(ISO, " ")
      .replace(DATE, " ")
      .replace(DATE_WORDS, " ")
      .replace(TIME, " ")
      .replace(MASK, " ");
    const found = findAmounts(cleaned).filter((f) => Number.isFinite(f.value) && f.value > 0);
    if (found.length === 0) continue;

    // Сначала сумма со знаком минус, потом сумма с валютой, потом первая.
    const main = found.find((f) => f.neg) ?? found.find((f) => f.cur) ?? found[0];
    if (main.plus || INCOME.test(line)) {
      skipped++;
      continue;
    }
    const amount = Math.round(main.value);
    if (amount < 1 || amount > 10000000) continue;

    let name = cleaned;
    for (const f of found) name = name.replace(f.raw, " ");
    name = name
      .replace(/[|;\t"]+/g, " ")
      .replace(/\s+/g, " ")
      .replace(/^[\s\-–—:,.]+|[\s\-–—:,.]+$/g, "")
      .slice(0, 60);
    if (!name) name = "Без названия";

    items.push({ id: uid(), name, amount, category: guessCategory(name), necessary: false });
  }
  return { items, skipped };
}

export type Summary = {
  total: number;
  necessary: number;
  waste: number;
  wasteShare: number; // 0..1
  wasteCount: number;
  topCategory: ExpenseCategory | null;
  topAmount: number;
};

export function summarize(items: Expense[]): Summary {
  let necessary = 0;
  let waste = 0;
  let wasteCount = 0;
  const byCat: Partial<Record<ExpenseCategory, number>> = {};
  for (const x of items) {
    if (x.necessary) {
      necessary += x.amount;
    } else {
      waste += x.amount;
      wasteCount++;
      byCat[x.category] = (byCat[x.category] ?? 0) + x.amount;
    }
  }
  let topCategory: ExpenseCategory | null = null;
  let topAmount = 0;
  for (const key of Object.keys(byCat) as ExpenseCategory[]) {
    const v = byCat[key] ?? 0;
    if (v > topAmount) {
      topAmount = v;
      topCategory = key;
    }
  }
  const total = necessary + waste;
  return { total, necessary, waste, wasteShare: total > 0 ? waste / total : 0, wasteCount, topCategory, topAmount };
}
