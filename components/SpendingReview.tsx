"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useProfile } from "@/lib/store";
import { rub, uid, type Expense } from "@/lib/types";
import { categoryLabels, guessCategory, parseExpenses, summarize } from "@/lib/spending";
import { pickAdvice } from "@/lib/stories";

type Stage = "input" | "list" | "pick" | "advice";

const blank = (): Expense => ({ id: uid(), name: "", amount: 0, category: "other", necessary: false });

// Распознавание скриншота прямо в браузере: картинка никуда не отправляется.
async function readImage(file: File): Promise<string> {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("rus+eng");
  try {
    const { data } = await worker.recognize(file);
    return data.text;
  } finally {
    await worker.terminate();
  }
}

export default function SpendingReview() {
  const { profile: p, update, ready } = useProfile();
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("input");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [skipped, setSkipped] = useState(0);

  if (!ready) return null;

  const handleFile = async (file: File) => {
    setError("");
    const isImage = file.type.startsWith("image/");
    setBusy(isImage ? "Распознаю скриншот. В первый раз это может занять до минуты…" : "Читаю файл…");
    try {
      const t = isImage ? await readImage(file) : await file.text();
      setText((prev) => (prev ? prev + "\n" : "") + t);
    } catch {
      setError("Не удалось прочитать файл. Вставьте текст вручную или добавьте траты по одной.");
    } finally {
      setBusy("");
    }
  };

  const onPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const file = Array.from(e.clipboardData.files).find((f) => f.type.startsWith("image/"));
    if (file) {
      e.preventDefault();
      void handleFile(file);
    }
  };

  const analyze = () => {
    const { items, skipped: sk } = parseExpenses(text);
    if (items.length === 0) {
      setError("Не нашёл ни одной траты с суммой. Проверьте текст или добавьте траты вручную.");
      return;
    }
    setError("");
    setSkipped(sk);
    update({ expenses: items });
    setStage("list");
  };

  const manual = () => {
    setError("");
    setSkipped(0);
    update({ expenses: [blank()] });
    setStage("list");
  };

  const setItem = (id: string, patch: Partial<Expense>) =>
    update({ expenses: p.expenses.map((x) => (x.id === id ? { ...x, ...patch } : x)) });
  const removeItem = (id: string) => update({ expenses: p.expenses.filter((x) => x.id !== id) });
  const addItem = () => update({ expenses: [...p.expenses, blank()] });

  const validCount = p.expenses.filter((x) => x.amount > 0).length;

  const goPick = () => {
    const clean = p.expenses
      .filter((x) => x.amount > 0)
      .map((x) => {
        const name = x.name.trim() || "Без названия";
        return { ...x, name, category: x.category === "other" ? guessCategory(name) : x.category };
      });
    update({ expenses: clean });
    setStage("pick");
  };

  const finish = () => {
    update({ reviewDone: true, step: 4 });
    router.push("/");
  };

  const s = summarize(p.expenses);
  const hint = { fontSize: "var(--fs-small)" };

  if (stage === "input") {
    return (
      <div>
        <h1>Разберём, куда уходят деньги</h1>
        <p className="prose-line mt-3">
          Вы отметили вопрос с тратами. Вставьте историю операций из банка: список сам разобьётся на отдельные
          траты. Всё обрабатывается в вашем браузере и никуда не отправляется.
        </p>

        <label className="mt-6 block">
          <span className="mb-1 block font-medium">История операций</span>
          <span className="mb-2 block text-ink/70" style={hint}>
            Скопируйте строки из приложения банка или вставьте скриншот (Ctrl+V) прямо в это поле.
          </span>
          <textarea
            className="field py-3"
            rows={8}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onPaste={onPaste}
            placeholder={"12.11.2026 Пятёрочка −1 250,50 ₽\n13.11.2026 Яндекс Еда −890 ₽"}
          />
        </label>

        <label className="mt-4 block">
          <span className="mb-1 block font-medium">Или загрузите файл</span>
          <span className="mb-2 block text-ink/70" style={hint}>
            Выписка CSV или TXT, либо скриншот PNG или JPG.
          </span>
          <input
            type="file"
            className="field py-2"
            accept=".csv,.txt,.tsv,text/plain,text/csv,image/*"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleFile(f);
              e.target.value = "";
            }}
          />
        </label>

        {busy && (
          <p className="mt-3 text-spruce" aria-live="polite">
            {busy}
          </p>
        )}
        {error && (
          <p className="mt-3 text-rose" role="alert">
            {error}
          </p>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            className="btn btn-primary"
            disabled={!text.trim() || !!busy}
            style={{ opacity: !text.trim() || busy ? 0.5 : 1 }}
            onClick={analyze}
          >
            Разобрать траты
          </button>
          <button type="button" className="btn btn-ghost" disabled={!!busy} onClick={manual}>
            Ввести вручную
          </button>
          <button type="button" className="btn btn-ghost" onClick={finish}>
            Пропустить
          </button>
        </div>
      </div>
    );
  }

  if (stage === "list") {
    return (
      <div>
        <h1>Ваши траты</h1>
        <p className="prose-line mt-3">
          Проверьте список: исправьте название или сумму, уберите лишние строки, добавьте недостающие.
          {skipped > 0 && ` Поступления пропущены: ${skipped}.`}
        </p>

        <ul className="mt-6 space-y-3">
          {p.expenses.map((x) => (
            <li key={x.id} className="flex flex-wrap items-center gap-2">
              <input
                className="field"
                style={{ flex: "1 1 12rem", width: "auto" }}
                aria-label="Название траты"
                value={x.name}
                placeholder="На что потратили"
                onChange={(e) => setItem(x.id, { name: e.target.value })}
              />
              <input
                className="field"
                style={{ flex: "0 0 8rem", width: "8rem" }}
                aria-label="Сумма в рублях"
                inputMode="numeric"
                value={x.amount ? String(x.amount) : ""}
                placeholder="0"
                onChange={(e) => setItem(x.id, { amount: Number(e.target.value.replace(/\D/g, "")) || 0 })}
              />
              <button type="button" className="btn btn-ghost" onClick={() => removeItem(x.id)}>
                Убрать
              </button>
            </li>
          ))}
        </ul>

        <button type="button" className="btn btn-ghost mt-4" onClick={addItem}>
          Добавить трату
        </button>

        <p className="mt-6 font-medium">
          Всего: {rub(p.expenses.reduce((a, x) => a + (x.amount > 0 ? x.amount : 0), 0))}, трат: {validCount}
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" className="btn btn-ghost" onClick={() => setStage("input")}>
            Назад
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={validCount === 0}
            style={{ opacity: validCount === 0 ? 0.5 : 1 }}
            onClick={goPick}
          >
            Дальше
          </button>
        </div>
      </div>
    );
  }

  if (stage === "pick") {
    return (
      <div>
        <h1>Что было по-настоящему необходимо?</h1>
        <p className="prose-line mt-3">
          Отметьте галочкой только то, без чего действительно нельзя было обойтись. Остальное мы посчитаем лишним.
        </p>

        <ul className="mt-6 space-y-3">
          {p.expenses.map((x) => (
            <li key={x.id}>
              <label className="choice" data-on={x.necessary}>
                <input
                  type="checkbox"
                  className="mt-1 h-5 w-5 shrink-0"
                  style={{ accentColor: "#2F6F5E" }}
                  checked={x.necessary}
                  onChange={() => setItem(x.id, { necessary: !x.necessary })}
                />
                <span className="flex-1">
                  <span className="block font-medium">{x.name}</span>
                  <span className="block text-ink/70" style={hint}>
                    {categoryLabels[x.category]}
                  </span>
                </span>
                <span className="font-medium">{rub(x.amount)}</span>
              </label>
            </li>
          ))}
        </ul>

        <p className="mt-6" aria-live="polite">
          Необходимое: {rub(s.necessary)}. Лишнее: {rub(s.waste)}.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" className="btn btn-ghost" onClick={() => setStage("list")}>
            Назад
          </button>
          <button type="button" className="btn btn-primary" onClick={() => setStage("advice")}>
            Дальше
          </button>
        </div>
      </div>
    );
  }

  const a = pickAdvice(s, p.problems);
  const card = "mt-6 rounded-lg border border-ink/15 bg-white p-5";

  return (
    <div>
      <h1>Остановимся и подумаем</h1>
      <p className="prose-line mt-3 font-medium">{a.headline}</p>

      <section className={card} aria-label="Итоги">
        <dl className="grid gap-3 sm:grid-cols-3">
          <div>
            <dt className="text-ink/70" style={hint}>Всего потрачено</dt>
            <dd className="font-medium">{rub(s.total)}</dd>
          </div>
          <div>
            <dt className="text-ink/70" style={hint}>Необходимое</dt>
            <dd className="font-medium text-spruce">{rub(s.necessary)}</dd>
          </div>
          <div>
            <dt className="text-ink/70" style={hint}>Лишнее</dt>
            <dd className="font-medium text-rose">{rub(s.waste)}</dd>
          </div>
        </dl>
      </section>

      <section className={card} aria-label="Мысли из книги">
        <h2>Что об этом говорит книга</h2>
        {a.quotes.map((q) => (
          <blockquote key={q} className="prose-line mt-3 border-l-4 border-honey pl-4 font-serif italic">
            «{q}»
          </blockquote>
        ))}
        <p className="mt-3 text-ink/70" style={hint}>
          По мотивам книги Дж. Клейсона «Самый богатый человек в Вавилоне». Это пересказ, а не дословная цитата.
        </p>
      </section>

      <section className={card} aria-label="История">
        <h2>{a.storyTitle}</h2>
        {a.story.map((t) => (
          <p key={t} className="prose-line mt-3">
            {t}
          </p>
        ))}
      </section>

      <section className={card + " border-honey"} aria-label="Золотое правило">
        <p className="text-ink/70" style={hint}>
          Золотое правило для вас
        </p>
        <h2 className="mt-1">{a.rule.title}</h2>
        <p className="prose-line mt-3">{a.rule.text}</p>
        <p className="prose-line mt-3 text-ink/80">{a.rule.tip}</p>
      </section>

      <section className={card + " bg-mist"} aria-label="Ваш шаг">
        <h2>Ваш шаг на этот месяц</h2>
        <p className="prose-line mt-3">{a.step}</p>
      </section>

      <div className="mt-8 flex flex-wrap gap-3">
        <button type="button" className="btn btn-ghost" onClick={() => setStage("pick")}>
          Назад
        </button>
        <Link href="/rules" className="btn btn-gold">
          Все золотые правила
        </Link>
        <button type="button" className="btn btn-primary" onClick={finish}>
          Продолжить к плану
        </button>
      </div>
    </div>
  );
}
