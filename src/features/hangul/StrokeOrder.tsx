import { useState } from 'react';
import { btnSecondary, muted } from '../../components/ui';
import { STROKES } from '../../content/hangul/strokes';

/**
 * Shows how to write a letter, one numbered stroke at a time.
 * The parent passes `key={jamo}` so the step resets for each letter.
 */
export function StrokeOrder({ jamo }: { jamo: string }) {
  const strokes = STROKES[jamo] ?? [];
  const [step, setStep] = useState(0);
  const done = step >= strokes.length;

  return (
    <div className="flex items-center gap-4">
      <svg
        viewBox="0 0 100 100"
        className="size-32 shrink-0 rounded-xl bg-stone-100 dark:bg-stone-800"
        role="img"
        aria-label={`Stroke order for ${jamo}: ${step} of ${strokes.length} strokes drawn`}
      >
        <g fill="none" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round">
          {/* Faint guide of the whole letter */}
          {strokes.map((stroke) => (
            <path key={stroke.d} d={stroke.d} className="stroke-stone-300 dark:stroke-stone-600" />
          ))}
          {strokes.slice(0, step).map((stroke, i) => (
            <path
              key={`${step}-${stroke.d}`}
              d={stroke.d}
              pathLength={1}
              className={`stroke-teal-700 dark:stroke-teal-400 ${i === step - 1 ? 'stroke-draw' : ''}`}
            />
          ))}
        </g>
        {strokes.slice(0, step).map((stroke, i) => (
          <g key={stroke.d}>
            <circle cx={stroke.start[0]} cy={stroke.start[1]} r="6.5" className="fill-amber-400" />
            <text
              x={stroke.start[0]}
              y={stroke.start[1] + 3.2}
              textAnchor="middle"
              fontSize="9"
              fontWeight="700"
              className="fill-stone-900"
            >
              {i + 1}
            </text>
          </g>
        ))}
      </svg>
      <div className="space-y-2">
        <p className={muted}>
          {strokes.length} {strokes.length === 1 ? 'stroke' : 'strokes'}. Top to bottom, left to
          right.
        </p>
        <button type="button" className={btnSecondary} onClick={() => setStep(done ? 0 : step + 1)}>
          {done ? 'Start again' : step === 0 ? 'Show stroke 1' : `Show stroke ${step + 1}`}
        </button>
      </div>
    </div>
  );
}
