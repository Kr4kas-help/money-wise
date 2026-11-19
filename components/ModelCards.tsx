'use client';

import { pickModel } from '@/lib/models';
import { rub, totalIncome, type Profile } from '@/lib/types';

const SIMPLE = [
  { label: 'Жизнь: еда, жильё, транспорт', pct: 70, color: '#8A978F' },
  { label: 'Накопления и цели', pct: 20, color: '#2F6F5E' },
  { label: 'Для себя и радости', pct: 10, color: '#E0A526' },
];

export function ModelIntro({ onStart }: { onStart: () => void }) {
  return (
    <div>
      <h1>Начнём с простого примера</h1>
      <p className='prose-line mt-3'>
        В книге «Самый богатый человек в Вавилоне» совет простой: делите доход на части. Классический вариант 70/20/10.
        Пример для дохода 50 000 ₽ в месяц:
      </p>
      <ul className='mt-5 space-y-3'>
        {SIMPLE.map((s) => (
          <li key={s.label} className='flex items-start gap-3 rounded-lg bg-white p-4'>
            <span aria-hidden className='mt-2 h-3 w-3 shrink-0 rounded-full' style={{ background: s.color }} />
            <span>
              <strong>{s.label}:</strong> {s.pct}%, это {rub((50000 * s.pct) / 100)}
            </span>
          </li>
        ))}
      </ul>
      <p className='prose-line mt-5'>
        Но у каждого своя жизнь: у кого-то долги, у кого-то непостоянный доход. Ответьте на вопросы, и мы подберём
        модель именно для вас.
      </p>
      <button type='button' className='btn btn-primary mt-6' onClick={onStart}>
        Подобрать мою модель
      </button>
    </div>
  );
}

export function ModelCard({ p }: { p: Profile }) {
  const m = pickModel(p);
  const parts = m.parts.filter((x) => x.pct > 0);
  const income = totalIncome(p);
  return (
    <section>
      <h2>Ваша модель: {m.name}</h2>
      <p className='prose-line mt-2'>{m.why}</p>
      <ul className='mt-4 space-y-3'>
        {parts.map((x) => (
          <li key={x.label} className='rounded-lg bg-white p-4'>
            <strong>{x.label}:</strong> {Math.round(x.pct)}%, это {rub((income * x.pct) / 100)} в месяц
          </li>
        ))}
      </ul>
    </section>
  );
}
