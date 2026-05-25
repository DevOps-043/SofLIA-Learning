import type { LoadProfile, QaUser } from '../types';

export function assertUserPoolSize(params: {
  allowUserReuse: boolean;
  profile: LoadProfile;
  users: QaUser[];
}) {
  if (params.users.length >= params.profile.maxVus) return;

  const message =
    `User pool has ${params.users.length} users but profile needs ${params.profile.maxVus}. ` +
    `Run load:seed with LOAD_SEED_USERS=${params.profile.maxVus}, or set LOAD_ALLOW_USER_REUSE=true only for an explicit synthetic saturation test.`;

  if (!params.allowUserReuse) throw new Error(message);

  console.warn(`${message} Users will be reused.`);
}
