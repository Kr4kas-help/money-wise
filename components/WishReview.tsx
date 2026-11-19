import type { Verdict } from '@/lib/plan';
import { rub } from '@/lib/types';

const BORDER = { keep: 'border-spruce', postpone: 'border-honey', drop: 'border-rose' } as const;

export default function WishReview({ verdicts }: { verdicts: Verdict[] }) {
  return (
    <section>
      <h2>Разбор желаний</h2>
      <p className='prose-line mt-2'>
        У желаний нет срочности: без них можно прожить. Вот что система советует сделать с каждым и почему.
      </p>
      <ul className='mt-4 space-y-3'>
        {verdicts.map((v) => (
          <li key={v.id} className={'rounded-lg border-l-4 bg-white p-4 ' + BORDER[v.kind]}>
            <strong>{v.name}</strong>, {rub(v.cost)}
            <br />
            <strong>{v.title}.</strong> {v.reason}
          </li>
        ))}
      </ul>
    </section>
  );
}
