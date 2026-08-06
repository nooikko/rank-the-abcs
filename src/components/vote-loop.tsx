"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { submitVote } from "@/app/actions";
import { QuestionCard } from "@/components/question-card";
import { RevealLedger } from "@/components/reveal-ledger";
import { SettledMeter } from "@/components/settled-meter";
import { SiteFooter } from "@/components/site-footer";
import type { ServedQuestion, SplitRow } from "@/lib/question-service";

export function VoteLoop({
  initial,
  settledness,
}: {
  initial: ServedQuestion | null;
  settledness: number;
}) {
  const [question, setQuestion] = useState(initial);
  const [nextQuestion, setNextQuestion] = useState<ServedQuestion | null>(null);
  const [split, setSplit] = useState<SplitRow[] | null>(null);
  // The raw answer, which is what highlights a cell — for a yes/no question it
  // is "YES", not a letter.
  const [chosen, setChosen] = useState<string | null>(null);
  // The letter that answer resolved to, which is what the ledger marks. The
  // two are only the same value on a pick-a-letter question.
  const [winner, setWinner] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const answer = useCallback(
    (value: string) => {
      if (!question || split) return;
      setChosen(value);
      startTransition(async () => {
        const result = await submitVote(question.token, value);
        if (result.accepted) {
          setSplit(result.split);
          setWinner(result.chosen);
          setNextQuestion(result.next);
          return;
        }
        // A rejected ruling is silent by design: the usual cause is a tab left
        // open past the token's life, and an explanation would only be a hint
        // to anyone probing. The next question simply replaces it.
        setChosen(null);
        setQuestion(result.next);
      });
    },
    [question, split],
  );

  const advance = useCallback(() => {
    setSplit(null);
    setChosen(null);
    setWinner(null);
    setQuestion(nextQuestion);
    setNextQuestion(null);
  }, [nextQuestion]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (split) {
        if (event.key === " " || event.key === "Enter") {
          event.preventDefault();
          advance();
        }
        return;
      }
      if (!question) return;
      if (event.key === "1") answer(question.options[0].value);
      if (event.key === "2") answer(question.options[1].value);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [question, split, answer, advance]);

  return (
    <>
      {/* Takes every pixel the page has left over, so the cells inside can
          stretch into it rather than leaving a void underneath. */}
      <div className="flex flex-1 flex-col pt-s4">
        {question ? (
          <>
            <QuestionCard
              prompt={question.prompt}
              options={question.options}
              chosen={chosen}
              disabled={pending || split !== null}
              onAnswer={answer}
            />
            {/* Reserved whether or not a reveal is showing, so answering does
                not resize the cells above it. */}
            <div className="min-h-[10rem] sm:min-h-[10.5rem]">
              {split && (
                <>
                  <RevealLedger split={split} chosen={winner} />
                  <button
                    type="button"
                    onClick={advance}
                    className="group relative mt-s2 inline-flex min-h-11 items-center font-mono text-meta uppercase tracking-caps"
                  >
                    Next ruling &rarr;
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-x-0 bottom-3 h-px origin-left scale-x-0 bg-signal transition-transform duration-[var(--duration-hairline)] ease-rise group-hover:scale-x-100 group-focus-visible:scale-x-100"
                    />
                  </button>
                </>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center">
            <p className="max-w-lead text-pretty text-lead">
              You have ruled on every question there is. That is genuinely all
              of them. Go and look at what you did to the alphabet.
            </p>
          </div>
        )}
      </div>

      <div>
        <SettledMeter settledness={settledness} />
        <SiteFooter current="vote" />
      </div>
    </>
  );
}
