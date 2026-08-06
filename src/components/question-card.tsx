import type { AnswerOption } from "@/lib/alphabet";
import { cn } from "@/lib/utils";

export function QuestionCard({
  prompt,
  options,
  chosen,
  disabled,
  onAnswer,
}: {
  prompt: string;
  options: readonly [AnswerOption, AnswerOption];
  chosen: string | null;
  disabled: boolean;
  onAnswer: (value: string) => void;
}) {
  return (
    <>
      <h1 className="mb-s4 text-balance font-name text-name">{prompt}</h1>
      {/* flex-1 so the two cells eat whatever vertical space is left after the
          question and the reveal have taken theirs. They are the thing the
          page exists to make you hit; they should not be a strip. */}
      <div className="flex min-h-[13rem] flex-1 border-border border-t border-b sm:min-h-[16rem]">
        {options.map((option, index) => (
          <button
            key={option.value}
            type="button"
            disabled={disabled}
            onClick={() => onAnswer(option.value)}
            // The selected state is an inset hairline; the focus ring sits
            // outside the cell at an offset. Both are orange and they mean
            // different things, so the separation has to stay.
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-s4 px-s2 py-s4 font-name text-duel transition-colors",
              index > 0 && "border-border border-l",
              chosen === option.value &&
                "shadow-[inset_0_0_0_1px_var(--signal)]",
              !disabled && "hover:text-primary",
            )}
          >
            <span>{option.label}</span>
            <span className="font-mono text-micro uppercase tracking-caps text-muted-foreground">
              press {index + 1}
            </span>
          </button>
        ))}
      </div>
    </>
  );
}
