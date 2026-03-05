import { ProfileResponse } from '@/lib/profile-client';

type ProfileFormProps = {
  profile: ProfileResponse;
  updateAction: (formData: FormData) => Promise<void>;
};

export function ProfileForm({ profile, updateAction }: ProfileFormProps) {
  const candidate = profile.candidate;
  const location = candidate?.location ?? {};

  return (
    <form action={updateAction} className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div>
        <p className="text-sm text-zinc-500">Email</p>
        <p className="font-medium text-zinc-900">{profile.email}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium text-zinc-700">Name</span>
          <input
            name="name"
            defaultValue={profile.name}
            className="h-10 w-full rounded-lg border border-zinc-300 px-3"
            minLength={2}
            required
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-zinc-700">Avatar URL</span>
          <input
            name="avatar"
            defaultValue={profile.avatar ?? ''}
            className="h-10 w-full rounded-lg border border-zinc-300 px-3"
          />
        </label>
      </div>

      {candidate ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium text-zinc-700">Phone</span>
            <input
              name="phone"
              defaultValue={candidate.phone ?? ''}
              className="h-10 w-full rounded-lg border border-zinc-300 px-3"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-zinc-700">City</span>
            <input
              name="locationCity"
              defaultValue={typeof location.city === 'string' ? location.city : ''}
              className="h-10 w-full rounded-lg border border-zinc-300 px-3"
            />
          </label>
          <label className="space-y-2 sm:col-span-2">
            <span className="text-sm font-medium text-zinc-700">Bio</span>
            <textarea
              name="bio"
              defaultValue={candidate.bio ?? ''}
              className="min-h-24 w-full rounded-lg border border-zinc-300 px-3 py-2"
            />
          </label>
        </div>
      ) : null}

      <button
        type="submit"
        className="h-10 rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-700"
      >
        Save profile
      </button>
    </form>
  );
}
