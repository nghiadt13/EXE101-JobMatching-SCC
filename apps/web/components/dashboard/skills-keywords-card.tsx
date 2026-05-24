type SkillsKeywordsCardProps = {
  skills: string[];
};

export function SkillsKeywordsCard({ skills }: SkillsKeywordsCardProps) {
  return (
    <div className="rounded-xl border border-md-outline-variant/30 bg-md-surface-container-lowest p-5 shadow-sm">
      <h3 className="font-headline-md text-md-on-surface mb-3">
        Kỹ năng & từ khoạ
      </h3>

      {skills.length === 0 ? (
        <p className="font-body-sm text-md-on-surface-variant">
          Chưa có kỹ năng nào được xác định.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {skills.map((skill) => (
            <span
              key={skill}
              className="inline-flex items-center rounded-md bg-md-surface-container px-3 py-1 font-label-sm text-md-on-surface"
            >
              {skill}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
