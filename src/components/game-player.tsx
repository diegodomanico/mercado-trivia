"use client";

import { useState } from "react";
import type { CountryCode } from "@/lib/countries";

type PublicQuestion = {
  position: number;
  prompt: string;
  options: string[];
  difficulty: number;
  competencyId: number;
};

type Props = {
  mode: "practice" | "campaign";
  country: CountryCode;
  campaign?: string;
};

export function GamePlayer({ mode, country, campaign }: Props) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [question, setQuestion] = useState<PublicQuestion | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [chances, setChances] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function startGame() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/game/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, country, campaign }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "No se pudo iniciar.");
      setSessionId(result.sessionId);
      setQuestion(result.question);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo iniciar.");
    } finally {
      setBusy(false);
    }
  }

  async function answer(selectedIndex: number) {
    if (!sessionId || !question) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/game/sessions/${sessionId}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ position: question.position, selectedIndex }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "No se pudo responder.");
      setScore(result.score);
      setChances(result.chances);
      setFeedback(`${result.correct ? "Correcto." : "Incorrecto."} ${result.explanation}`);
      setCompleted(result.completed);
      setQuestion(result.nextQuestion);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo responder.");
    } finally {
      setBusy(false);
    }
  }

  if (!sessionId) {
    return (
      <div className="game-entry">
        <button className="button button-primary" type="button" onClick={startGame} disabled={busy}>
          {busy ? "Preparando partida..." : "Comenzar las 25 preguntas"}
        </button>
        {error && <p className="form-message" role="alert">{error}</p>}
      </div>
    );
  }

  if (completed) {
    return (
      <section className="game-summary" aria-live="polite">
        <p className="eyebrow">Partida completa</p>
        <h2>{score.toLocaleString("es")} puntos</h2>
        <p>{chances} chances obtenidas.</p>
        {feedback && <p>{feedback}</p>}
      </section>
    );
  }

  return question && (
    <section className="game-card" aria-labelledby="question-title">
      <div className="game-meta">
        <span>Pregunta {question.position} de 25</span>
        <span>Nivel {question.difficulty}</span>
        <span>{score.toLocaleString("es")} pts.</span>
      </div>
      {feedback && <p className="feedback" role="status">{feedback}</p>}
      <h2 id="question-title">{question.prompt}</h2>
      <div className="answer-grid">
        {question.options.map((option, index) => (
          <button key={`${question.position}-${index}`} type="button" disabled={busy} onClick={() => answer(index)}>
            <span>{String.fromCharCode(65 + index)}</span>{option}
          </button>
        ))}
      </div>
      {error && <p className="form-message" role="alert">{error}</p>}
    </section>
  );
}
