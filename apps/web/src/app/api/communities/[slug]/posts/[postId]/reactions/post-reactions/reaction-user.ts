import type { CommunityReactionUserRow } from './types';

export function getReactionUserName(user: CommunityReactionUserRow) {
  return (
    user.display_name ||
    `${user.first_name || ''} ${user.last_name || ''}`.trim() ||
    'Usuario'
  );
}
