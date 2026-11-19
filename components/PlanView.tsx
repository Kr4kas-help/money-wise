'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useProfile } from '@/lib/store';
import { analyzeWishes, buildPlan, months } from '@/lib/plan';
import WishReview from './WishReview';
import { ModelCard } from './ModelCards';
import { rub, totalIncome } from '@/lib/types';
import { quoteOfDay } from '@/lib/wisdom';
import CacheNote from './CacheNote';

const COLORS: Record<string, string> = {
  mandatory: '#8A978F',
  debtMin: '#B5544A',
  debtExtra: '#C9776D',
  reserve: '#2F6F5E',
  wishes: '#E0A526',
  growth: '#5B8FB9',
};

export default function PlanView() {
  const { profile: p, update, reset, ready } = useProfile();
  const [view, setView] = useState<'lines' | 'table'>('lines');
  const [all, setAll] = useState(false);
  const plan = useMemo(() => buildPlan(p), [p]);
  const verdicts = useMemo(() => analyzeWishes(p), [p]);

  if (!ready) return null;

  if (!plan.ok) {
    return (
      <div>
        <h1>Пока план не получается</h1>
        <ul className='prose-line mt-4 list-disc space-y-2 pl-6'>
          {plan.tips.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
        {verdicts.length > 0 && (
          <div className='mt-8'>
            <WishReview verdicts={verdicts} />
          </div>
        )}
        <Link href='/' className='btn btn-primary mt-6' onClick={() => update({ step: p.income > 0 ? 6 : 5 })}>
          Изменить данные
        </Link>
      </div>
    );
  }

  const shown = all ? plan.rows : plan.rows.slice(0, 12);
  const rule = quoteOfDay();

  return (
    <div className='space-y-10'>
      <section>
        <h1>Ваш план на месяц</h1>
        <p className='prose-line mt-3'>
          Свободно после обязательных расходов и платежей: <strong>{rub(plan.free)}</strong>. Вот как лучше
          распределить доход {rub(totalIncome(p))}.
        </p>
        <div
          className='mt-5 flex h-5 w-full overflow-hidden rounded-full'
          role='img'
          aria-label='Доли дохода по статьям'
        >
          {plan.shares.map((s) => (
            <div key={s.key} style={{ width: s.pct + '%', background: COLORS[s.key] }} />
          ))}
        </div>
        <div className='mt-5 inline-flex rounded-lg border border-spruce/40 p-1' role='group' aria-label='Вид плана'>
          <button type='button' className={'btn ' + (view === 'lines' ? 'btn-primary' : '')} aria-pressed={view === 'lines'} onClick={() => setView('lines')}>
            Строки
          </button>
          <button type='button' className={'btn ' + (view === 'table' ? 'btn-primary' : '')} aria-pressed={view === 'table'} onClick={() => setView('table')}>
            Таблица
          </button>
        </div>

        {view === 'lines' ? (
          <ul className='mt-5 space-y-3'>
            {plan.shares.map((s) => (
              <li key={s.key} className='flex items-start gap-3 rounded-lg bg-white p-4'>
                <span aria-hidden className='mt-2 h-3 w-3 shrink-0 rounded-full' style={{ background: COLORS[s.key] }} />
                <span>
                  <strong>{s.label}:</strong> {rub(s.rub)} в месяц, это {s.pct.toFixed(0)}% дохода
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <div className='mt-5 overflow-x-auto rounded-lg bg-white'>
            <table className='w-full text-left'>
              <caption className='sr-only'>Распределение дохода за месяц</caption>
              <thead>
                <tr className='border-b border-ink/15'>
                  <th scope='col' className='p-3'>Статья</th>
                  <th scope='col' className='p-3'>Сумма</th>
                  <th scope='col' className='p-3'>Доля</th>
                </tr>
              </thead>
              <tbody>
                {plan.shares.map((s) => (
                  <tr key={s.key} className='border-b border-ink/10'>
                    <td className='p-3'>{s.label}</td>
                    <td className='whitespace-nowrap p-3'>{rub(s.rub)}</td>
                    <td className='p-3'>{s.pct.toFixed(0)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <ModelCard p={p} />

      {plan.wishes.length > 0 && (
        <section>
          <h2>Когда исполнятся желания</h2>
          <ul className='mt-4 space-y-3'>
            {plan.wishes.map((w) => {
              const late = w.reachedIn === null || (w.wanted !== null && w.reachedIn > w.wanted);
              return (
                <li key={w.id} className={'rounded-lg border-l-4 bg-white p-4 ' + (late ? 'border-rose' : 'border-spruce')}>
                  <strong>{w.name || 'Без названия'}</strong>, {rub(w.cost)}
                  <br />
                  {w.reachedIn === null ? 'Накопить не получится за 30 лет при таких данных.' : 'Накопим через ' + months(w.reachedIn) + '.'}
                  {w.wanted !== null && <> Вы хотели через {months(w.wanted)}.</>}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {verdicts.length > 0 && <WishReview verdicts={verdicts} />}

      {plan.tips.length > 0 && (
        <section>
          <h2>Рекомендации</h2>
          <ul className='prose-line mt-4 list-disc space-y-2 pl-6'>
            {plan.tips.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2>План по месяцам</h2>
        {view === 'lines' ? (
          <ul className='mt-4 space-y-3'>
            {shown.map((r) => (
              <li key={r.month} className='rounded-lg bg-white p-4'>
                <strong>Месяц {r.month}:</strong> в долги {rub(r.debts)}, в накопления {rub(r.reserve)}, на желания {rub(r.wishes)}
                {r.growth > 0 && <>, на рост {rub(r.growth)}</>}. Остаток долгов: {rub(r.debtLeft)}.
              </li>
            ))}
          </ul>
        ) : (
          <div className='mt-4 overflow-x-auto rounded-lg bg-white'>
            <table className='w-full text-left'>
              <caption className='sr-only'>План по месяцам</caption>
              <thead>
                <tr className='border-b border-ink/15'>
                  <th scope='col' className='p-3'>Месяц</th>
                  <th scope='col' className='p-3'>Долги</th>
                  <th scope='col' className='p-3'>Накопления</th>
                  <th scope='col' className='p-3'>Желания</th>
                  <th scope='col' className='p-3'>Рост</th>
                  <th scope='col' className='p-3'>Остаток долгов</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((r) => (
                  <tr key={r.month} className='border-b border-ink/10'>
                    <td className='p-3'>{r.month}</td>
                    <td className='whitespace-nowrap p-3'>{rub(r.debts)}</td>
                    <td className='whitespace-nowrap p-3'>{rub(r.reserve)}</td>
                    <td className='whitespace-nowrap p-3'>{rub(r.wishes)}</td>
                    <td className='whitespace-nowrap p-3'>{rub(r.growth)}</td>
                    <td className='whitespace-nowrap p-3'>{rub(r.debtLeft)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {plan.rows.length > 12 && (
          <button type='button' className='btn btn-ghost mt-4' onClick={() => setAll(!all)}>
            {all ? 'Показать первый год' : 'Показать все ' + plan.rows.length + ' мес.'}
          </button>
        )}
      </section>

      <blockquote className='rounded-lg bg-mist p-5 font-serif italic'>«{rule.text}»</blockquote>

      <div className='flex flex-wrap gap-3'>
        <Link href='/' className='btn btn-primary' onClick={() => update({ step: 5 })}>
          Изменить данные
        </Link>
        <button
          type='button'
          className='btn btn-ghost'
          onClick={() => {
            if (window.confirm('Удалить все введённые данные и начать заново?')) reset();
          }}
        >
          Удалить данные и начать заново
        </button>
      </div>
      <CacheNote />
    </div>
  );
}
