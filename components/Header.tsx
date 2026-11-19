'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { quoteIndex, quotes } from '@/lib/wisdom';
import { useProfile } from '@/lib/store';

const ROTATE_MS = 40000;

export default function Header() {
  const { profile, update } = useProfile();
  const [i, setI] = useState(0);

  useEffect(() => {
    setI(quoteIndex());
    const id = window.setInterval(() => setI((n) => (n + 1) % quotes.length), ROTATE_MS);
    return () => window.clearInterval(id);
  }, []);

  return (
    <header className='border-b border-ink/10 bg-paper'>
      <div className='mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3 sm:px-6'>
        <Link href='/' className='font-serif text-xl font-semibold text-spruce'>
          Из долгов — к мечте
        </Link>
        <nav className='flex flex-wrap items-center gap-2' aria-label='Основное меню'>
          <Link href='/rules' className='btn btn-gold'>
            Золотые правила
          </Link>
          <button
            type='button'
            className='btn btn-white'
            aria-pressed={profile.largeText}
            onClick={() => update({ largeText: !profile.largeText })}
          >
            {profile.largeText ? 'Обычный шрифт' : 'Крупный шрифт'}
          </button>
        </nav>
      </div>
      <div className='bg-mist'>
        <p className='prose-line mx-auto max-w-4xl px-4 py-3 font-serif italic text-ink sm:px-6' aria-live='polite'>
          «{quotes[i].text}»
        </p>
      </div>
    </header>
  );
}
