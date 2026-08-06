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
    <div>
      <h1 className="mb-s5 text-balance font-name text-name">{prompt}</h1>
      <div className="flex border-border border-t">
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
              "flex-1 border-border border-b px-s2 py-s5 text-center font-name text-duel transition-colors",
              index > 0 && "border-l",
              chosen === option.value &&
                "shadow-[inset_0_0_0_1px_var(--signal)]",
              !disabled && "hover:text-primary",
            )}
          >
            {option.label}
            <span className="mt-s3 block font-mono text-micro uppercase tracking-caps text-muted-foreground">
              press {index + 1}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
