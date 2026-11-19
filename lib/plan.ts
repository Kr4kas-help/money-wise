import { rub, totalIncome, type Profile } from './types';

export type Row = {
  month: number;
  debts: number;
  reserve: number;
  wishes: number;
  growth: number;
  debtLeft: number;
  wishSaved: number;
  reserveTotal: number;
  growthTotal: number;
};
export type Share = { key: string; label: string; rub: number; pct: number };
export type WishResult = { id: string; name: string; cost: number; wanted: number | null; reachedIn: number | null };
export type Plan = {
  ok: boolean;
  free: number;
  shares: Share[];
  rows: Row[];
  wishes: WishResult[];
  debtFreeIn: number | null;
  tips: string[];
};

const GROWTH_YEAR = 0.08; // условная доходность накоплений, 8% годовых

export function months(n: number): string {
  const y = Math.floor(n / 12);
  const m = n % 12;
  const yy = y % 10 === 1 && y % 100 !== 11 ? 'год' : [2, 3, 4].includes(y % 10) && ![12, 13, 14].includes(y % 100) ? 'года' : 'лет';
  const out: string[] = [];
  if (y) out.push(y + ' ' + yy);
  if (m || !y) out.push(m + ' мес.');
  return out.join(' ');
}

export function buildPlan(p: Profile): Plan {
  // Работаем с общим доходом: своим плюс партнёрским, если он указан.
  const income = totalIncome(p);
  const q: Profile = { ...p, income };
  const tips: string[] = [];
  const minDebt = q.debts.reduce((s, d) => s + d.monthly, 0);
  const free = income - q.mandatory - minDebt;
  const fail: Plan = { ok: false, free, shares: [], rows: [], wishes: [], debtFreeIn: null, tips };
  if (income <= 0) {
    tips.push('Укажите доход фиксированной суммой в месяц: без неё план не посчитать.');
    return fail;
  }
  if (free <= 0) {
    tips.push('Обязательные расходы и платежи по долгам занимают весь доход. Это не провал, это сигнал, с чего начать.');
    tips.push('Проверьте, нет ли в обязательных расходах лишнего: подписки, тарифы, дорогие продукты.');
    tips.push('Если платежи по кредитам непосильны, обратитесь в банк за реструктуризацией или кредитными каникулами.');
    if (p.wishes.length) tips.push('Все хотелки лучше отложить: пока нет свободных денег, они только увеличат долги.');
    return fail;
  }

  const hasDebt = q.debts.some((d) => d.balance > 0);
  const grow = q.goals.includes('grow');
  const debtFirst = q.goals.includes('debt_free') || q.goals.length === 0;
  const W = { debt: debtFirst ? 0.6 : 0.4, reserve: 0.15, wishes: 0.25, growth: 0.2 };
  // Сочетания проблем сдвигают доли: веса потом нормируются, поэтому любые комбинации работают.
  if (q.problems.includes('debts')) W.debt += 0.1;
  if (q.problems.includes('no_money') || q.problems.includes('no_saving')) W.reserve += 0.1;
  if (q.problems.includes('no_plan')) W.reserve += 0.05;
  if (q.problems.includes('impulse')) W.wishes = Math.max(0.1, W.wishes - 0.1);
  if (q.incomeType === 'flexible') W.reserve += 0.1;

  const debts = q.debts.filter((d) => d.balance > 0).map((d) => ({ ...d }));
  const wl = q.wishes.filter((x) => x.cost > 0).sort((a, b) => (a.months ?? 9999) - (b.months ?? 9999));
  const results: WishResult[] = wl.map((x) => ({ id: x.id, name: x.name, cost: x.cost, wanted: x.months, reachedIn: null }));
  const rows: Row[] = [];
  let shares: Share[] = [];
  let pool = 0, wi = 0, resT = 0, grT = 0;
  let debtFreeIn: number | null = hasDebt ? null : 0;
  const limit = !hasDebt && wl.length === 0 ? 12 : 360;

  for (let m = 1; m <= limit; m++) {
    let minPaid = 0;
    for (const d of debts) {
      if (d.balance <= 0) continue;
      d.balance += (d.balance * d.rate) / 1200;
      const x = Math.min(d.monthly, d.balance);
      d.balance -= x;
      minPaid += x;
    }
    const money = Math.max(0, income - q.mandatory - minPaid);
    const debtOn = debts.some((d) => d.balance > 0.5);
    const w = { debt: debtOn ? W.debt : 0, reserve: W.reserve, wishes: wi < wl.length ? W.wishes : 0, growth: grow ? W.growth : 0 };
    const sum = w.debt + w.reserve + w.wishes + w.growth;
    let aDebt = (money * w.debt) / sum;
    let aRes = (money * w.reserve) / sum;
    const aWish = (money * w.wishes) / sum;
    const aGr = (money * w.growth) / sum;

    let left = aDebt;
    for (const d of debts.filter((x) => x.balance > 0.5).sort((a, b) => b.rate - a.rate)) {
      const x = Math.min(left, d.balance);
      d.balance -= x;
      left -= x;
    }
    aDebt -= left;
    aRes += left;

    pool += aWish;
    while (wi < wl.length && pool >= wl[wi].cost) {
      pool -= wl[wi].cost;
      results[wi].reachedIn = m;
      wi++;
    }
    resT += aRes;
    grT = grT * (1 + GROWTH_YEAR / 12) + aGr;
    const debtLeft = debts.reduce((s, d) => s + Math.max(0, d.balance), 0);
    if (hasDebt && debtFreeIn === null && debtLeft <= 0.5) debtFreeIn = m;

    rows.push({ month: m, debts: minPaid + aDebt, reserve: aRes, wishes: aWish, growth: aGr, debtLeft, wishSaved: pool, reserveTotal: resT, growthTotal: grT });

    if (m === 1) {
      const pc = (v: number) => (v / income) * 100;
      shares = [
        { key: 'mandatory', label: 'Обязательные расходы', rub: q.mandatory, pct: pc(q.mandatory) },
        { key: 'debtMin', label: 'Платежи по долгам', rub: minPaid, pct: pc(minPaid) },
        { key: 'debtExtra', label: 'Досрочно в долги', rub: aDebt, pct: pc(aDebt) },
        { key: 'reserve', label: 'Подушка и накопления', rub: aRes, pct: pc(aRes) },
        { key: 'wishes', label: 'Хотелки и мечты', rub: aWish, pct: pc(aWish) },
        { key: 'growth', label: 'Рост (сложный процент)', rub: aGr, pct: pc(aGr) },
      ].filter((s) => s.rub > 0.5);
    }
    if (limit === 360 && debtLeft <= 0.5 && wi >= wl.length) break;
  }

  if (hasDebt && debtFreeIn !== null) tips.push('Все долги закроются примерно через ' + months(debtFreeIn) + '. Дальше эти деньги пойдут на цели.');
  if (hasDebt && debtFreeIn === null) tips.push('При таких платежах долги почти не уменьшаются из-за процентов. Обратитесь в банк, чтобы снизить ставку или рефинансировать кредит.');
  const late = results.filter((r) => r.reachedIn === null || (r.wanted !== null && r.reachedIn > r.wanted));
  for (const r of late) {
    const when = r.reachedIn === null ? 'не удаётся накопить за 30 лет' : 'получится через ' + months(r.reachedIn) + ' вместо ' + months(r.wanted as number);
    tips.push('«' + r.name + '» (' + rub(r.cost) + '): ' + when + '.' + (hasDebt ? ' Пока есть долги, деньги идут сначала на них.' : ''));
  }
  if (late.length) {
    const big = [...late].sort((a, b) => b.cost - a.cost)[0];
    tips.push('Чтобы успеть быстрее, уберите из плана «' + big.name + '» или перенесите её на потом: у хотелок нет срочности.');
  }
  if (shares.length && (shares.find((s) => s.key === 'reserve')?.pct ?? 0) < 10) {
    tips.push('Золотое правило: откладывать хотя бы десятую часть дохода. Когда долги закроются, эта доля вырастет.');
  }
  return { ok: true, free, shares, rows, wishes: results, debtFreeIn, tips };
}

export type Verdict = { id: string; name: string; cost: number; kind: 'keep' | 'postpone' | 'drop'; title: string; reason: string };

// Разбор желаний: пересчитываем план без каждого желания и смотрим, что оно сдвигает.
export function analyzeWishes(p: Profile): Verdict[] {
  const list = p.wishes.filter((w) => w.cost > 0);
  const minDebt = p.debts.reduce((s, d) => s + d.monthly, 0);
  const free = totalIncome(p) - p.mandatory - minDebt;
  const base = free > 0 ? buildPlan(p) : null;
  return list.map((w) => {
    const name = w.name || 'Без названия';
    const head = { id: w.id, name, cost: w.cost };
    if (!base || !base.ok) {
      return { ...head, kind: 'postpone' as const, title: 'Отложить', reason: 'Сейчас свободных денег нет, а «' + name + '» (' + rub(w.cost) + ') не срочная: без неё жизнь не остановится. Вернитесь к ней, когда долги и обязательные платежи перестанут съедать весь доход.' };
    }
    const without = buildPlan({ ...p, wishes: p.wishes.filter((x) => x.id !== w.id) });
    const mine = base.wishes.find((x) => x.id === w.id);
    const r = mine ? mine.reachedIn : null;
    const wanted = mine ? mine.wanted : null;
    const late = r === null || (wanted !== null && r > wanted);
    const debtNever = base.debtFreeIn === null && without.debtFreeIn !== null;
    const debtGain = base.debtFreeIn !== null && without.debtFreeIn !== null ? base.debtFreeIn - without.debtFreeIn : 0;
    const othersGain = without.wishes.reduce((s, x) => {
      const b = base.wishes.find((y) => y.id === x.id);
      return s + (b && b.reachedIn !== null && x.reachedIn !== null ? Math.max(0, b.reachedIn - x.reachedIn) : 0);
    }, 0);
    if (r === null) {
      return { ...head, kind: 'drop' as const, title: 'Лишняя, уберите', reason: 'Накопить на «' + name + '» (' + rub(w.cost) + ') не получится за 30 лет при текущих данных. Срочности в ней нет, поэтому уберите её из плана: пока она там, она только создаёт ощущение невыполнимой цели.' };
    }
    if (debtNever) {
      return { ...head, kind: 'drop' as const, title: 'Лишняя сейчас', reason: 'Без «' + name + '» долги закрылись бы примерно через ' + months(without.debtFreeIn as number) + ', а с ней они не закрываются вовсе. Желание не срочное, поэтому уберите его до выплаты долгов.' };
    }
    if (debtGain >= 2 && (late || w.cost >= totalIncome(p) * 2)) {
      return { ...head, kind: 'drop' as const, title: 'Лишняя сейчас', reason: '«' + name + '» (' + rub(w.cost) + ') не срочная, а из-за неё долги закроются на ' + months(debtGain) + ' позже' + (othersGain > 0 ? ', и другие желания сдвинутся суммарно на ' + months(othersGain) : '') + '. Уберите её до выплаты долгов.' };
    }
    if (late) {
      return { ...head, kind: 'postpone' as const, title: 'Отложить или сдвинуть срок', reason: 'Успеть к сроку не получится: накопим через ' + months(r) + (wanted !== null ? ' вместо ' + months(wanted) : '') + '. Сдвиньте срок или отложите желание на потом.' };
    }
    return { ...head, kind: 'keep' as const, title: 'Можно оставить', reason: 'Укладывается' + (wanted !== null ? ' в желаемый срок' : '') + ': накопим через ' + months(r) + '.' };
  });
}
