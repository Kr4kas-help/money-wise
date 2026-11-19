export type AgeGroup = "young" | "adult" | "senior";
export type Family = "single" | "couple" | "family" | "single_parent";
export type IncomeType = "stable" | "flexible";
export type Source = "salary" | "pension" | "business" | "other";
export type Goal = "debt_free" | "save" | "grow";
export type Problem = "no_money" | "debts" | "no_saving" | "impulse" | "no_plan";
export type DebtKind = "credit" | "mortgage" | "installment" | "card" | "other";

export type ExpenseCategory =
  | "food"
  | "housing"
  | "health"
  | "transport"
  | "debts"
  | "cafe"
  | "fun"
  | "shopping"
  | "other";

// Одна трата из истории операций.
export type Expense = {
  id: string;
  name: string;
  amount: number; // руб.
  category: ExpenseCategory;
  necessary: boolean; // человек отметил, что без неё нельзя было обойтись
};

export type Debt = {
  id: string;
  kind: DebtKind;
  name: string;
  balance: number; // сколько осталось выплатить, руб.
  monthly: number; // обязательный платёж в месяц, руб.
  rate: number; // годовая ставка, %, 0 для рассрочки
};

export type Wish = {
  id: string;
  name: string;
  cost: number; // руб.
  months: number | null; // желаемый срок, мес.
};

export type Profile = {
  ageGroup: AgeGroup | null;
  family: Family | null;
  source: Source | null;
  incomeType: IncomeType | null;
  problems: Problem[];
  goals: Goal[];
  income: number; // фиксированная сумма в месяц, руб.
  partnerIncome: number; // зарплата партнёра, если живёт с партнёром или в семье
  mandatory: number; // обязательные расходы без долгов: жильё, еда, транспорт
  debts: Debt[];
  wishes: Wish[];
  expenses: Expense[]; // разобранная история трат (экран /review)
  reviewDone: boolean; // разбор трат пройден, повторно не предлагать
  largeText: boolean;
  step: number;
};

export const emptyProfile: Profile = {
  ageGroup: null,
  family: null,
  source: null,
  incomeType: null,
  problems: [],
  goals: [],
  income: 0,
  partnerIncome: 0,
  mandatory: 0,
  debts: [],
  wishes: [],
  expenses: [],
  reviewDone: false,
  largeText: false,
  step: 0,
};

export const uid = () => Math.random().toString(36).slice(2, 10);

// Общий доход семьи: свой плюс партнёрский, если он указан.
export const totalIncome = (p: Profile) => p.income + (p.partnerIncome || 0);

export const rub = (n: number) =>
  new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(Math.round(n)) + " ₽";
