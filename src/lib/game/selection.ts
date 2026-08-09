import { randomInt } from "node:crypto";
import type { CountryCode } from "@/lib/countries";

export type QuestionRecord = {
  id: string;
  competency_id: number;
  difficulty: number;
  applicable_countries: string[];
  prompt: string;
  options: string[];
};

export function shuffle<T>(values: readonly T[]): T[] {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(index + 1);
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

export function selectGameQuestions(records: QuestionRecord[], country: CountryCode) {
  const eligible = records.filter(
    (question) =>
      question.applicable_countries.length === 0 ||
      question.applicable_countries.includes(country),
  );

  const selected: QuestionRecord[] = [];
  for (let difficulty = 1; difficulty <= 5; difficulty += 1) {
    for (let competency = 1; competency <= 5; competency += 1) {
      const candidates = eligible.filter(
        (question) =>
          question.difficulty === difficulty && question.competency_id === competency,
      );
      if (candidates.length === 0) {
        throw new Error(
          `Banco incompleto: competencia ${competency}, nivel ${difficulty}, país ${country}.`,
        );
      }
      selected.push(candidates[randomInt(candidates.length)]);
    }
  }
  return selected;
}

export function shuffledOptionOrder() {
  return shuffle([0, 1, 2, 3]);
}

export function presentQuestion(
  question: Pick<QuestionRecord, "prompt" | "options" | "difficulty" | "competency_id">,
  optionOrder: number[],
  position: number,
) {
  return {
    position,
    prompt: question.prompt,
    options: optionOrder.map((originalIndex) => question.options[originalIndex]),
    difficulty: question.difficulty,
    competencyId: question.competency_id,
  };
}
