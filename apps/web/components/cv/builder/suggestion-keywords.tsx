'use client';

type Props = {
  keywords: string[];
};

export function SuggestionKeywords({ keywords }: Props) {
  if (keywords.length === 0) return null;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <h4 className="mb-2.5 text-sm font-semibold text-zinc-800">
        🔑 Từ khóa còn thiếu
      </h4>
      <div className="flex flex-wrap gap-2">
        {keywords.map((keyword) => (
          <span
            key={keyword}
            className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-700"
          >
            {keyword}
          </span>
        ))}
      </div>
    </div>
  );
}
