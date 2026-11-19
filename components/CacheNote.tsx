import { FRESH_START } from '@/lib/config';

export default function CacheNote() {
  if (FRESH_START) {
    return (
      <aside role='note' className='rounded-lg border border-spruce/40 bg-[#E3EEE8] p-4'>
        <p className='prose-line'>
          <strong>Демо-режим:</strong> сейчас каждый заход на сайт начинается как первый. Введённые цифры не
          сохраняются между посещениями, поэтому можно спокойно пробовать разные варианты.
        </p>
      </aside>
    );
  }
  return (
    <aside role='note' className='rounded-lg border border-honey bg-[#FBF1D6] p-4'>
      <p className='prose-line'>
        <strong>Важно:</strong> ваши данные хранятся только в этом браузере, на вашем устройстве, и нигде больше.
        Не очищайте историю, кеш и данные сайтов: тогда введённые цифры и план пропадут. Если собираетесь чистить
        браузер, сначала сделайте снимок экрана с планом.
      </p>
    </aside>
  );
}
