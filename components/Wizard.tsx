'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ModelIntro } from './ModelCards';
import ProfileSteps from './ProfileSteps';
import MoneySteps from './MoneySteps';
import CacheNote from './CacheNote';
import { useProfile } from '@/lib/store';
import type { Problem } from '@/lib/types';

const LAST = 7;

// Проблемы с тратами: для них после шага 3 открывается разбор трат (/review).
const REVIEW_TRIGGERS: Problem[] = ['no_money', 'no_saving', 'impulse', 'no_plan'];

export default function Wizard() {
  const { profile: p, update, ready } = useProfile();
  const router = useRouter();
  const [seen, setSeen] = useState(false);
  if (!ready) return null;
  // Первый визит: сначала простой пример 70/20/10, потом анкета.
  if (p.step === 0 && !p.ageGroup && !seen) return <ModelIntro onStart={() => setSeen(true)} />;

  const hasSpendingProblem = p.problems.some((x) => REVIEW_TRIGGERS.includes(x));
  const needsReview = hasSpendingProblem && !p.reviewDone;

  const canNext =
    (p.step === 0 && !!p.ageGroup) ||
    (p.step === 1 && !!p.family) ||
    (p.step === 2 && !!p.source && !!p.incomeType) ||
    (p.step === 3 && p.problems.length > 0) ||
    (p.step === 4 && p.goals.length > 0) ||
    (p.step === 5 && p.income > 0) ||
    p.step >= 6;

  const next = () => {
    if (p.step === 3 && needsReview) {
      router.push('/review');
      return;
    }
    if (p.step >= LAST) {
      router.push('/plan');
      return;
    }
    update({ step: p.step + 1 });
  };
  const back = () => update({ step: Math.max(0, p.step - 1) });

  return (
    <div>
      {p.step === 0 && (
        <div className='mb-6'>
          <h1>Спокойный план для ваших денег</h1>
          <p className='prose-line mt-3'>
            Ответьте на несколько вопросов о доходе, долгах и мечтах. Мы посчитаем, сколько отдавать, сколько
            откладывать и когда исполнится задуманное.
          </p>
        </div>
      )}
      <p className='font-medium text-spruce' aria-live='polite'>
        Шаг {p.step + 1} из {LAST + 1}
      </p>
      <div className='mt-2 h-2 rounded bg-mist' role='progressbar' aria-valuemin={1} aria-valuemax={LAST + 1} aria-valuenow={p.step + 1}>
        <div className='h-2 rounded bg-spruce' style={{ width: ((p.step + 1) / (LAST + 1)) * 100 + '%' }} />
      </div>

      <ProfileSteps />
      <MoneySteps />

      {p.step === 3 && hasSpendingProblem && (
        <section className='mt-6 rounded-lg border-2 border-honey bg-white p-4' aria-live='polite'>
          <h2>Разберём ваши траты</h2>
          <p className='prose-line mt-2'>
            Вы отметили вопрос с тратами. Вставьте историю операций из банка (текстом, файлом или скриншотом): мы сами
            разобьём её на траты, вы отметите нужные, а мы подберём золотое правило именно для вас.
          </p>
          <div className='mt-4 flex flex-wrap gap-3'>
            <button type='button' className='btn btn-gold' onClick={() => router.push('/review')}>
              Внести траты из банка
            </button>
          </div>
          <p className='mt-3 text-ink/70' style={{ fontSize: 'var(--fs-small)' }}>
            Всё обрабатывается в вашем браузере и никуда не отправляется.
          </p>
        </section>
      )}

      <div className='mt-8 flex flex-wrap gap-3'>
        {p.step > 0 && (
          <button type='button' className='btn btn-ghost' onClick={back}>
            Назад
          </button>
        )}
        <button type='button' className='btn btn-primary' disabled={!canNext} onClick={next} style={{ opacity: canNext ? 1 : 0.5 }}>
          {p.step >= LAST ? 'Показать мой план' : 'Дальше'}
        </button>
      </div>
      {!canNext && <p className='mt-3 text-ink/70'>Выберите вариант или заполните поле, чтобы продолжить.</p>}

      <div className='mt-10'>
        <CacheNote />
      </div>
    </div>
  );
}
