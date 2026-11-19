"use client";

import { Choice, Question } from "./Choices";
import { useProfile } from "@/lib/store";
import type { AgeGroup, Family, Goal, IncomeType, Problem, Source } from "@/lib/types";

const ages: [AgeGroup, string, string?][] = [
  ["young", "До 30 лет"],
  ["adult", "От 30 до 59 лет"],
  ["senior", "60 лет и старше", "Сайт станет крупнее и проще"],
];
const families: [Family, string][] = [
  ["single", "Живу один"],
  ["couple", "Живу с партнёром"],
  ["family", "Семья с детьми"],
  ["single_parent", "Воспитываю детей один"],
];
const sources: [Source, string][] = [
  ["salary", "Зарплата"],
  ["pension", "Пенсия"],
  ["business", "Свой бизнес или подработки"],
  ["other", "Другое"],
];
const incomeTypes: [IncomeType, string, string][] = [
  ["stable", "Постоянный", "Одна и та же сумма каждый месяц"],
  ["flexible", "Гибкий", "Сумма меняется от месяца к месяцу"],
];
const problems: [Problem, string][] = [
  ["no_money", "Деньги заканчиваются до следующей выплаты"],
  ["debts", "Много кредитов и долгов"],
  ["no_saving", "Не получается откладывать"],
  ["impulse", "Трачу на лишнее и потом жалею"],
  ["no_plan", "Не понимаю, куда уходят деньги"],
];
const goals: [Goal, string, string][] = [
  ["debt_free", "Наконец избавиться от долгов", "Основная часть денег пойдёт на погашение"],
  ["save", "Откладывать на нужное", "Подушка безопасности и покупки без кредитов"],
  ["grow", "Растить деньги", "Накопления с учётом сложного процента"],
];

export default function ProfileSteps() {
  const { profile: p, update } = useProfile();
  const toggle = (g: Goal) =>
    update({ goals: p.goals.includes(g) ? p.goals.filter((x) => x !== g) : [...p.goals, g] });

  switch (p.step) {
    case 0:
      return (
        <Question title="Сколько вам лет?" hint="Это нужно, чтобы сайт был удобным именно для вас.">
          {ages.map(([v, t, h]) => (
            <Choice
              key={v}
              on={p.ageGroup === v}
              title={t}
              hint={h}
              onClick={() =>
                update({
                  ageGroup: v,
                  largeText: v === "senior",
                  source: v === "senior" && !p.source ? "pension" : p.source,
                })
              }
            />
          ))}
        </Question>
      );
    case 1:
      return (
        <Question title="С кем вы живёте?">
          {families.map(([v, t]) => (
            <Choice key={v} on={p.family === v} title={t} onClick={() => update({ family: v })} />
          ))}
        </Question>
      );
    case 2:
      return (
        <>
          <Question title="Откуда приходят деньги?">
            {sources.map(([v, t]) => (
              <Choice key={v} on={p.source === v} title={t} onClick={() => update({ source: v })} />
            ))}
          </Question>
          <Question title="Какой у вас доход?">
            {incomeTypes.map(([v, t, h]) => (
              <Choice key={v} on={p.incomeType === v} title={t} hint={h} onClick={() => update({ incomeType: v })} />
            ))}
          </Question>
        </>
      );
    case 3:
      return (
        <Question title="Что вас беспокоит?" hint="Можно выбрать несколько вариантов: план учтёт все сразу.">
          {problems.map(([v, t]) => (
            <Choice key={v} on={p.problems.includes(v)} title={t} onClick={() => update({ problems: p.problems.includes(v) ? p.problems.filter((x) => x !== v) : [...p.problems, v] })} />
          ))}
        </Question>
      );
    case 4:
      return (
        <Question title="Чего вы хотите добиться?" hint="Можно выбрать несколько вариантов: план учтёт все.">
          {goals.map(([v, t, h]) => (
            <Choice key={v} on={p.goals.includes(v)} title={t} hint={h} onClick={() => toggle(v)} />
          ))}
        </Question>
      );
    default:
      return null;
  }
}
