import { totalIncome, type Profile } from './types';

export type Part = { label: string; pct: number };
export type Model = { name: string; why: string; parts: Part[] };

// Подбор модели распределения по ситуации человека. Доли в каждой модели дают 100%.
export function pickModel(p: Profile): Model {
  const income = totalIncome(p);
  const monthly = p.debts.reduce((s, d) => s + d.monthly, 0);
  const owed = p.debts.reduce((s, d) => s + d.balance, 0);
  const ratio = income > 0 ? monthly / income : 0;
  const free = income - p.mandatory - monthly;
  const hasDebt = owed > 0;

  if (income > 0 && free <= 0) {
    return {
      name: 'Антикризисная',
      why: 'Обязательные расходы и платежи занимают весь доход. Сначала нужно освободить деньги, а не копить: пересмотрите расходы и договоритесь с банком об условиях.',
      parts: [{ label: 'Жизнь и обязательные расходы', pct: 100 - Math.min(ratio * 100, 60) }, { label: 'Платежи по долгам', pct: Math.min(ratio * 100, 60) }],
    };
  }
  if (hasDebt && (ratio >= 0.3 || p.goals.includes('debt_free') || p.problems.includes('debts'))) {
    return {
      name: 'Лавина: сначала долги',
      why: 'У вас есть долги и цель их закрыть. Основная часть свободных денег идёт на досрочное погашение, начиная с самой высокой ставки. Небольшая подушка нужна, чтобы не брать новый кредит при первой же неприятности.',
      parts: [{ label: 'Жизнь', pct: 50 }, { label: 'Долги', pct: 35 }, { label: 'Подушка', pct: 10 }, { label: 'Желания', pct: 5 }],
    };
  }
  if (p.incomeType === 'flexible') {
    return {
      name: 'Запас на нестабильный доход',
      why: 'Доход меняется, поэтому подушка здесь важнее всего: в хороший месяц откладываете больше, в плохой живёте за счёт запаса.',
      parts: [{ label: 'Жизнь', pct: 60 }, { label: 'Долги', pct: hasDebt ? 10 : 0 }, { label: 'Подушка', pct: hasDebt ? 25 : 35 }, { label: 'Желания', pct: 5 }],
    };
  }
  if (!hasDebt && p.goals.includes('grow')) {
    return {
      name: 'Рост денег',
      why: 'Долгов нет и вы хотите растить деньги. Часть уходит в накопления с расчётом на сложный процент, часть на желания, чтобы не терять мотивацию.',
      parts: [{ label: 'Жизнь', pct: 60 }, { label: 'Подушка', pct: 15 }, { label: 'Рост', pct: 15 }, { label: 'Желания', pct: 10 }],
    };
  }
  if (p.ageGroup === 'senior') {
    return {
      name: 'Спокойная',
      why: 'Стабильная пенсия и забота о спокойствии. Основная часть на жизнь, но небольшой запас на лекарства и непредвиденное остаётся всегда.',
      parts: [{ label: 'Жизнь', pct: 75 }, { label: 'Подушка', pct: 15 }, { label: 'Желания', pct: 10 }],
    };
  }
  return {
    name: 'Классика 70/20/10',
    why: 'Нет острых проблем, поэтому подходит модель из книги: 70% на жизнь, 20% на накопления и цели, 10% на себя.',
    parts: [{ label: 'Жизнь', pct: 70 }, { label: 'Накопления и цели', pct: 20 }, { label: 'Для себя', pct: 10 }],
  };
}
