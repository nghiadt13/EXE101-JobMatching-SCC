import { Alert } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

type ConstraintFlagsProps = {
  failed: string[];
};

export function ConstraintFlags({ failed }: ConstraintFlagsProps) {
  if (!failed.length) return null;

  return (
    <Alert variant="error" className="mt-4 flex flex-col gap-2">
      <div className="flex items-center gap-2 font-semibold">
        <AlertTriangle className="h-4 w-4" />
        <span>Hard Constraints Failed</span>
      </div>
      <div>
        <p className="mb-2">Review required! The candidate did not meet the following critical constraints:</p>
        <ul className="list-disc list-inside space-y-1">
          {failed.map((f, i) => (
            <li key={i}>{f}</li>
          ))}
        </ul>
      </div>
    </Alert>
  );
}
