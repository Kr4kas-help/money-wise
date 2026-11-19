'use client';

import { useEffect, useState } from 'react';
import { FRESH_START } from '@/lib/config';

const KEY = 'money-wise:warning-ack';

export default function WarningModal() {
  const [open, setOpen] = useState(false);
  const [ack, setAck] = useState(false);

  useEffect(() => {
    let seen = false;
    try {
      seen = window.sessionStorage.getItem(KEY) === '1';
    } catch {}
    if (!seen) setOpen(true);
  }, []);

  // Пока окно открыто, страница под ним не прокручивается.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const close = () => {
    try {
      window.sessionStorage.setItem(KEY, '1');
    } catch {}
    setOpen(false);
  };

  return (
    <div
      role='dialog'
      aria-modal='true'
      aria-labelledby='warn-title'
      className='fixed inset-0 z-50 overflow-y-auto bg-ink/75 p-4'
    >
      <div className='mx-auto my-8 flex min-h-[calc(100vh-4rem)] max-w-2xl items-center'>
        <div className='w-full rounded-xl bg-white p-6 shadow-xl sm:p-8'>
          <p className='font-medium text-rose' style={{ fontSize: 'var(--fs-small)' }}>
            Обязательно прочитайте
          </p>
          <h2 id='warn-title' className='mt-2'>Важно</h2>
          {FRESH_START ? (
            <>
              <p className='prose-line mt-3'>
                Сейчас сайт работает в демо-режиме: каждый заход начинается как первый, а введённые цифры не
                сохраняются между посещениями. Внутри одной сессии всё считается нормально, можно спокойно пробовать
                разные варианты.
              </p>
              <p className='prose-line mt-3'>
                Не вводите настоящие номера счетов и карт. Здесь нужны только суммы: доход, расходы, долги и цены
                желаний.
              </p>
            </>
          ) : (
            <>
              <p className='prose-line mt-3'>
                Ваши данные хранятся только в этом браузере, на вашем устройстве, и нигде больше. Мы не передаём их
                на сервер.
              </p>
              <p className='prose-line mt-3'>
                Не очищайте историю, кеш и данные сайтов: тогда введённые цифры и план пропадут. Если собираетесь
                чистить браузер, сначала сделайте снимок экрана с планом.
              </p>
            </>
          )}
          <p className='prose-line mt-3'>
            Это не финансовая консультация, а ориентир. Расчёты упрощены: доходность накоплений взята условная.
          </p>

          <label className='mt-6 flex cursor-pointer items-start gap-3 rounded-lg border border-ink/20 p-4'>
            <input
              type='checkbox'
              checked={ack}
              onChange={(e) => setAck(e.target.checked)}
              className='mt-1 h-5 w-5 shrink-0'
            />
            <span>Я ознакомился с предупреждением и понимаю, как здесь хранятся данные.</span>
          </label>

          <button type='button' className='btn btn-primary mt-5 w-full' disabled={!ack} onClick={close} style={{ opacity: ack ? 1 : 0.5 }}>
            Понятно, продолжить
          </button>
          {!ack && <p className='mt-2 text-ink/70'>Поставьте галочку, чтобы закрыть окно.</p>}
        </div>
      </div>
    </div>
  );
}
