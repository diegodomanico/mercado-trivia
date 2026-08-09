import { describe, expect, it } from "vitest";
import { presentQuestion, selectGameQuestions } from "./selection";

const records = Array.from({ length: 25 }, (_, index) => ({
  id: String(index),
  competency_id: (index % 5) + 1,
  difficulty: Math.floor(index / 5) + 1,
  applicable_countries: [],
  prompt: `Pregunta suficientemente extensa número ${index}`,
  options: ["A", "B", "C", "D"],
}));

describe("selectGameQuestions", () => {
  it("selects one question for every competency and level", () => {
    const selected = selectGameQuestions(records, "CL");
    expect(selected).toHaveLength(25);
    expect(new Set(selected.map((question) => `${question.difficulty}-${question.competency_id}`)).size)
      .toBe(25);
  });

  it("fails closed when the approved bank is incomplete", () => {
    expect(() => selectGameQuestions(records.slice(1), "AR")).toThrow("Banco incompleto");
  });
});

describe("presentQuestion", () => {
  it("reorders options without exposing the answer", () => {
    const presented = presentQuestion(records[0], [2, 0, 3, 1], 1);
    expect(presented.options).toEqual(["C", "A", "D", "B"]);
    expect(presented).not.toHaveProperty("correct_index");
  });
});
