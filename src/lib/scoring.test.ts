import { describe, expect, it } from "vitest";
import { chancesForCorrectAnswers, pointsForAnswer } from "./scoring";

describe("pointsForAnswer", () => {
  it("awards points only for a correct answer", () => {
    expect(pointsForAnswer(3, true)).toBe(500);
    expect(pointsForAnswer(3, false)).toBe(0);
  });

  it("rejects unknown difficulty levels", () => {
    expect(pointsForAnswer(9, true)).toBe(0);
  });
});

describe("chancesForCorrectAnswers", () => {
  it("awards one chance for each five correct answers", () => {
    expect(chancesForCorrectAnswers(4)).toBe(0);
    expect(chancesForCorrectAnswers(5)).toBe(1);
    expect(chancesForCorrectAnswers(25)).toBe(5);
  });
});
