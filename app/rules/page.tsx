import Link from 'next/link';
import { rules } from '@/lib/wisdom';

export const metadata = { title: 'Золотые правила денег' };

export default function RulesPage() {
  return (
    <div>
      <Link href='/' className='btn btn-ghost mb-6'>
        ← Назад
      </Link>
      <h1>Золотые правила денег</h1>
      <p className='prose-line mt-3'>
        Семь мыслей из книги Джорджа Клейсона «Самый богатый человек в Вавилоне», пересказанных простыми словами.
        Они простые, и именно поэтому работают.
      </p>
      <ol className='mt-8 space-y-6'>
        {rules.map((r, i) => (
          <li key={r.title} className='rounded-lg border-l-4 border-honey bg-white p-5'>
            <h2>
              {i + 1}. {r.title}
            </h2>
            <p className='prose-line mt-2'>{r.text}</p>
            <p className='prose-line mt-3 text-spruce'>
              <strong>Что сделать:</strong> {r.tip}
            </p>
          </li>
        ))}
      </ol>
      <Link href='/' className='btn btn-ghost mt-8'>
        ← Назад к анкете
      </Link>
    </div>
  );
}
