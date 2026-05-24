import Link from 'next/link';
import { cn } from '@/lib/cn';

type CvStrengthCardProps = {
  score: number;
  improvementItems: string[];
};

const SCORE_SIZE = 120;
const STROKE_WIDTH = 10;
const RADIUS = (SCORE_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function getScoreLabel(score: number) {
  if (score >= 80) return { text: 'Tốt', color: 'text-green-600' };
  if (score >= 60) return { text: 'Khá Tốt', color: 'text-amber-600' };
  return { text: 'Cần cải thiện', color: 'text-red-600' };
}

function getScoreColor(score: number) {
  if (score >= 80) return '#16a34a';
  if (score >= 60) return '#d97706';
  return '#dc2626';
}

export function CvStrengthCard({ score, improvementItems }: CvStrengthCardProps) {
  const label = getScoreLabel(score);
  const dashOffset = CIRCUMFERENCE - (score / 100) * CIRCUMFERENCE;

  return (
    <div className="rounded-xl border border-md-outline-variant/30 bg-md-surface-container-lowest p-5 shadow-sm">
      <h3 className="font-headline-md text-md-on-surface mb-4">
        Điểm mạnh CV
      </h3>

      <div className="flex items-center gap-6">
        {/* Circular progress */}
        <div className="relative shrink-0">
          <svg width={SCORE_SIZE} height={SCORE_SIZE} className="-rotate-90">
            <circle
              cx={SCORE_SIZE / 2}
              cy={SCORE_SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke="currentColor"
              strokeWidth={STROKE_WIDTH}
              className="text-md-surface-container"
            />
            <circle
              cx={SCORE_SIZE / 2}
              cy={SCORE_SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke={getScoreColor(score)}
              strokeWidth={STROKE_WIDTH}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-headline-lg text-md-on-surface">{score}</span>
            <span className={cn('font-label-sm', label.color)}>{label.text}</span>
          </div>
        </div>

        {/* Improvement items */}
        <div className="min-w-0 flex-1">
          {improvementItems.length === 0 ? (
            <p className="font-body-sm text-md-on-surface-variant">
              CV của bạn đã tốt rồi!
            </p>
          ) : (
            <ul className="space-y-2">
              {improvementItems.map((item, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 font-body-sm text-md-on-surface-variant"
                >
                  <span className="mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 border-md-outline-variant" />
                  <span className="min-w-0 break-words">{item}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <Link
        href="/dashboard/candidate/cvs"
        className="mt-4 inline-flex font-label-md text-md-primary hover:underline"
      >
        Nâng cấp CV ngay →
      </Link>
    </div>
  );
}
