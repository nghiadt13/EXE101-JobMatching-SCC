'use client';

import { toast } from 'sonner';

type CvUploadFormProps = {
  uploadAction: (formData: FormData) => Promise<void>;
};

export function CvUploadForm({ uploadAction }: CvUploadFormProps) {
  const handleAction = async (formData: FormData) => {
    const file = formData.get('file') as File;
    if (file && file.size > 5 * 1024 * 1024) {
      toast.error('CV file size must be less than 5MB');
      return;
    }
    
    return uploadAction(formData);
  };

  return (
    <form
      action={handleAction}
      className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
    >
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.15em] text-zinc-500">
          Upload CV
        </p>
        <p className="mt-2 text-sm text-zinc-600">Only PDF or DOCX. Maximum 5MB.</p>
      </div>

      <input
        name="file"
        type="file"
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        required
        className="block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
      />

      <button
        type="submit"
        className="h-10 rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-700"
      >
        Upload
      </button>
    </form>
  );
}
