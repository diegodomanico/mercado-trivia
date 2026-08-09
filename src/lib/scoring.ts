export const pointsByDifficulty = [100, 200, 500, 1000, 2000] as const;

export function pointsForAnswer(difficulty: number, isCorrect: boolean) {
  if (!isCorrect) return 0;
  return pointsByDifficulty[difficulty - 1] ?? 0;
}

export function chancesForCorrectAnswers(correctAnswers: number) {
  return Math.floor(Math.max(0, correctAnswers) / 5);
}
