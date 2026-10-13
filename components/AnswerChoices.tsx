// Shows a graded question's choices with the learner's pick and the correct
// answer marked. Used on the mini-exam results screen and the attempt
// review page so both read the same way.
export default function AnswerChoices({
  choices,
  selectedChoiceIds,
  correctChoiceIds,
}: {
  choices: { id: string; text: string }[]
  selectedChoiceIds: string[]
  correctChoiceIds: string[]
}) {
  return (
    <ul className="space-y-1.5 mb-3">
      {choices.map((c) => {
        const picked = selectedChoiceIds.includes(c.id)
        const isRight = correctChoiceIds.includes(c.id)
        let cls = 'border-brand-muted/20 text-brand-text/80'
        if (isRight) cls = 'border-brand-primary/60 bg-brand-primary/10 text-brand-text'
        else if (picked) cls = 'border-red-500/60 bg-red-500/10 text-brand-text'
        return (
          <li key={c.id} className={`flex items-start justify-between gap-3 rounded-md border px-3 py-2 text-sm ${cls}`}>
            <span>{c.text}</span>
            <span className="shrink-0 text-xs">
              {isRight && picked && <span className="text-brand-primary">Your answer · Correct</span>}
              {isRight && !picked && <span className="text-brand-primary">Correct answer</span>}
              {!isRight && picked && <span className="text-red-400">Your answer</span>}
            </span>
          </li>
        )
      })}
    </ul>
  )
}
