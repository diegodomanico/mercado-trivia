import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { canAccessSession } from "@/lib/game/access";
import { presentQuestion, type QuestionRecord } from "@/lib/game/selection";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const answerSchema = z.object({
  position: z.number().int().min(1).max(25),
  selectedIndex: z.number().int().min(0).max(3),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const { sessionId } = await params;
    const input = answerSchema.parse(await request.json());
    const admin = createSupabaseAdminClient();
    const { data: session } = await admin
      .from("game_sessions")
      .select("id,mode,user_id,guest_token_hash,status")
      .eq("id", sessionId)
      .single();
    if (!session || session.status !== "playing") {
      return NextResponse.json({ error: "La partida no está activa." }, { status: 404 });
    }
    if (!await canAccessSession(request, session)) {
      return NextResponse.json({ error: "No tenés acceso a esta partida." }, { status: 403 });
    }

    const { data: result, error: answerError } = await admin.rpc("submit_game_answer", {
      p_session_id: sessionId,
      p_position: input.position,
      p_selected_index: input.selectedIndex,
    });
    if (answerError) throw answerError;
    const feedback = Array.isArray(result) ? result[0] : result;

    let nextQuestion = null;
    if (!feedback.completed) {
      const nextPosition = input.position + 1;
      const { data: sessionQuestion, error: nextRowError } = await admin
        .from("game_session_questions")
        .select("question_id,option_order")
        .eq("session_id", sessionId)
        .eq("position", nextPosition)
        .single();
      if (nextRowError || !sessionQuestion) throw new Error("Next question not found");

      const { data: question, error: nextQuestionError } = await admin
        .from("questions")
        .select("prompt,options,difficulty,competency_id")
        .eq("id", sessionQuestion.question_id)
        .single();
      if (nextQuestionError || !question) throw new Error("Question content not found");
      await admin.from("game_session_questions")
        .update({ presented_at: new Date().toISOString() })
        .eq("session_id", sessionId)
        .eq("position", nextPosition);
      nextQuestion = presentQuestion(
        question as QuestionRecord,
        sessionQuestion.option_order,
        nextPosition,
      );
    }

    return NextResponse.json({
      correct: feedback.is_correct,
      explanation: feedback.explanation,
      pointsAwarded: feedback.points_awarded,
      score: feedback.total_score,
      correctAnswers: feedback.correct_answers,
      chances: feedback.chances,
      completed: feedback.completed,
      nextQuestion,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Respuesta inválida." }, { status: 400 });
    }
    return NextResponse.json({ error: "No se pudo registrar la respuesta." }, { status: 409 });
  }
}
