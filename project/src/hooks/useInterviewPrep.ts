import { useEffect, useMemo, useRef, useState } from 'react';
import { interviewService, InterviewQuestion, ScoredAnswer } from '../services/interviewService';

export function useInterviewPrep(initial: {
  profile?: any;
  resumeSections?: any;
  targetRole?: string;
  numQuestions?: number;
} = {}) {
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Array<{ questionId: string; answer: string; result?: ScoredAnswer }>>([]);
  const [timeLeft, setTimeLeft] = useState<number>(120);
  const timerRef = useRef<number | null>(null);

  const currentQuestion = questions[currentIndex] || null;
  const progress = useMemo(() => {
    return questions.length ? Math.round((currentIndex / questions.length) * 100) : 0;
  }, [questions.length, currentIndex]);

  useEffect(() => {
    if (!currentQuestion) return;
    // reset timer each question
    setTimeLeft(120);
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          if (timerRef.current) window.clearInterval(timerRef.current);
          return 0;
        }
        return t - 1;
      });
    }, 1000) as unknown as number;
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [currentQuestion?.id]);

  const generate = async (override?: Partial<typeof initial>) => {
    setLoading(true);
    setError(null);
    try {
      const qs = await interviewService.generateQuestions({
        profile: override?.profile ?? initial.profile,
        resumeSections: override?.resumeSections ?? initial.resumeSections,
        targetRole: override?.targetRole ?? initial.targetRole,
        numQuestions: override?.numQuestions ?? initial.numQuestions ?? 10,
      });
      setQuestions(qs);
      setAnswers([]);
      setCurrentIndex(0);
    } catch (e: any) {
      setError(e?.message || 'Failed to generate questions');
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async (answer: string) => {
    if (!currentQuestion) return;
    setLoading(true);
    try {
      const result = await interviewService.scoreAnswer({
        question: currentQuestion,
        answer,
        context: { targetRole: initial.targetRole },
      });
      setAnswers(prev => {
        const copy = [...prev];
        const existingIdx = copy.findIndex(a => a.questionId === currentQuestion.id);
        if (existingIdx >= 0) copy[existingIdx] = { ...copy[existingIdx], answer, result };
        else copy.push({ questionId: currentQuestion.id, answer, result });
        return copy;
      });
      // move to next
      setCurrentIndex(i => Math.min(i + 1, Math.max(questions.length - 1, 0)));
    } catch (e: any) {
      setError(e?.message || 'Failed to score answer');
    } finally {
      setLoading(false);
    }
  };

  const saveSession = async (userEmail: string) => {
    if (!userEmail) throw new Error('Missing user email');
    const id = await interviewService.saveSession({
      userEmail,
      targetRole: initial.targetRole,
      questions,
      answers: answers.map(a => ({ questionId: a.questionId, answer: a.answer, result: a.result! })),
    });
    return id;
  };

  return {
    state: {
      questions,
      currentIndex,
      currentQuestion,
      progress,
      timeLeft,
      loading,
      error,
      answers,
    },
    actions: {
      generate,
      submitAnswer,
      saveSession,
      setCurrentIndex,
    },
  } as const;
}


