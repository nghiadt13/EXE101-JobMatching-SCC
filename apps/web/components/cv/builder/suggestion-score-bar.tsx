'use client';

type Props = {
  score: number;
};

export function SuggestionScoreBar({ score }: Props) {
  const getScoreColor = (s: number) => {
    if (s >= 80) return { bar: 'bg-emerald-500', text: 'text-emerald-600', label: 'Tốt' };
    if (s >= 60) return { bar: 'bg-amber-500', text: 'text-amber-600', label: 'Trung bình' };
    return { bar: 'bg-red-500', text: 'text-red-600', label: 'Cần cải thiện' };
  };

  const colors = getScoreColor(score);

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-zinc-700">Điểm phù hợp</span>
        <span className={`text-2xl font-bold ${colors.text}`}>
          {score}<span className="text-sm font-normal text-zinc-400">/100</span>
        </span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-100">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${colors.bar}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <p className={`mt-1.5 text-xs font-medium ${colors.text}`}>{colors.label}</p>
    </div>
  );
}
