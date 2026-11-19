'use client';

import { NumberField, Question } from './Choices';
import { useProfile } from '@/lib/store';
import { uid, type Debt, type DebtKind, type Wish } from '@/lib/types';

// Партнёрский доход нужен, если человек живёт с партнёром или в семье.
const hasPartner = (family: string | null) => family === 'couple' || family === 'family';

const kinds: [DebtKind, string][] = [
  ['credit', 'Кредит'],
  ['mortgage', 'Ипотека'],
  ['installment', 'Рассрочка'],
  ['card', 'Кредитная карта'],
  ['other', 'Другое'],
];

export default function MoneySteps() {
  const { profile: p, update } = useProfile();

  const patchDebt = (id: string, patch: Partial<Debt>) =>
    update({ debts: p.debts.map((d) => (d.id === id ? { ...d, ...patch } : d)) });
  const patchWish = (id: string, patch: Partial<Wish>) =>
    update({ wishes: p.wishes.map((w) => (w.id === id ? { ...w, ...patch } : w)) });

  if (p.step === 5) {
    return (
      <Question
        title='Ваши деньги в месяц'
        hint='Нужна одна фиксированная цифра. Если доход меняется, возьмите самую низкую обычную сумму.'
      >
        <NumberField label='Доход в месяц' value={p.income} onChange={(n) => update({ income: n })} />
        {hasPartner(p.family) && (
          <NumberField
            label='Зарплата партнёра в месяц'
            hint='Если партнёр работает. Оставьте пустым, если дохода нет. Сумма прибавится к вашему доходу в расчёте.'
            value={p.partnerIncome}
            onChange={(n) => update({ partnerIncome: n })}
          />
        )}
        <NumberField
          label='Обязательные расходы без долгов'
          hint='Жильё, коммуналка, еда, транспорт, лекарства.'
          value={p.mandatory}
          onChange={(n) => update({ mandatory: n })}
        />
      </Question>
    );
  }

  if (p.step === 6) {
    return (
      <Question
        title='Ваши долги'
        hint='Добавьте каждый кредит, ипотеку и рассрочку. Если долгов нет, просто нажмите «Дальше».'
      >
        {p.debts.map((d, i) => (
          <div key={d.id} className='space-y-3 rounded-lg border border-ink/15 bg-white p-4'>
            <div className='flex items-center justify-between gap-3'>
              <strong>Долг {i + 1}</strong>
              <button
                type='button'
                className='btn btn-ghost'
                onClick={() => update({ debts: p.debts.filter((x) => x.id !== d.id) })}
              >
                Удалить
              </button>
            </div>
            <label className='block'>
              <span className='mb-1 block font-medium'>Вид долга</span>
              <select
                className='field'
                value={d.kind}
                onChange={(e) => {
                  const kind = e.target.value as DebtKind;
                  patchDebt(d.id, { kind, rate: kind === 'installment' ? 0 : d.rate });
                }}
              >
                {kinds.map(([v, t]) => (
                  <option key={v} value={v}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <label className='block'>
              <span className='mb-1 block font-medium'>Название</span>
              <input
                className='field'
                value={d.name}
                placeholder='Например, кредит в банке'
                onChange={(e) => patchDebt(d.id, { name: e.target.value })}
              />
            </label>
            <NumberField label='Сколько осталось выплатить' value={d.balance} onChange={(n) => patchDebt(d.id, { balance: n })} />
            <NumberField label='Платёж в месяц' value={d.monthly} onChange={(n) => patchDebt(d.id, { monthly: n })} />
            {d.kind !== 'installment' && (
              <NumberField
                label='Ставка в год'
                hint='Указана в договоре. Если не знаете, оставьте пустым.'
                suffix='%'
                value={d.rate}
                onChange={(n) => patchDebt(d.id, { rate: Math.min(n, 100) })}
              />
            )}
          </div>
        ))}
        <button
          type='button'
          className='btn btn-primary'
          onClick={() =>
            update({ debts: [...p.debts, { id: uid(), kind: 'credit', name: '', balance: 0, monthly: 0, rate: 0 }] })
          }
        >
          Добавить долг
        </button>
      </Question>
    );
  }

  if (p.step === 7) {
    return (
      <Question
        title='Ваши хотелки и мечты'
        hint='Отпуск, долгожданная вещь, любая покупка. Срок можно не указывать: тогда план сам посчитает, когда получится.'
      >
        {p.wishes.map((w, i) => (
          <div key={w.id} className='space-y-3 rounded-lg border border-ink/15 bg-white p-4'>
            <div className='flex items-center justify-between gap-3'>
              <strong>Желание {i + 1}</strong>
              <button
                type='button'
                className='btn btn-ghost'
                onClick={() => update({ wishes: p.wishes.filter((x) => x.id !== w.id) })}
              >
                Удалить
              </button>
            </div>
            <label className='block'>
              <span className='mb-1 block font-medium'>Что хотите</span>
              <input
                className='field'
                value={w.name}
                placeholder='Например, отпуск на море'
                onChange={(e) => patchWish(w.id, { name: e.target.value })}
              />
            </label>
            <NumberField label='Сколько это стоит' value={w.cost} onChange={(n) => patchWish(w.id, { cost: n })} />
            <NumberField
              label='Желаемый срок'
              hint='Через сколько месяцев хотите получить. Необязательно.'
              suffix='мес.'
              value={w.months ?? 0}
              onChange={(n) => patchWish(w.id, { months: n > 0 ? n : null })}
            />
          </div>
        ))}
        <button
          type='button'
          className='btn btn-primary'
          onClick={() => update({ wishes: [...p.wishes, { id: uid(), name: '', cost: 0, months: null }] })}
        >
          Добавить желание
        </button>
      </Question>
    );
  }

  return null;
}
