'use client';

import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

type JdUploadFormProps = {
  uploadAction: (formData: FormData) => Promise<void>;
};

export function JdUploadForm({ uploadAction }: JdUploadFormProps) {
  const handleAction = async (formData: FormData) => {
    const file = formData.get('file') as File;
    if (file && file.size > 5 * 1024 * 1024) {
      toast.error('JD file size must be less than 5MB');
      return;
    }
    toast.info('Uploading JD…');
    return uploadAction(formData);
  };

  return (
    <form
      action={handleAction}
      className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
    >
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.15em] text-zinc-500">Upload JD</p>
        <h2 className="text-lg font-semibold text-zinc-900">Create a draft from a PDF or DOCX</h2>
        <p className="text-sm text-zinc-600">
          Upload creates a new draft job. Review the parsed fields before you publish it.
        </p>
      </div>

      <input
        name="file"
        type="file"
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        required
        className="block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-zinc-100 file:px-3 file:py-1 file:text-sm file:font-medium file:text-zinc-700"
      />

      <Button type="submit" size="sm">Upload JD</Button>
    </form>
  );
}
