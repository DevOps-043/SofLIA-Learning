import type { HourDetailData } from './types';

interface UsersTabProps {
  users: HourDetailData['topUsers'];
}

export function UsersTab({ users }: UsersTabProps) {
  if (users.length === 0) {
    return <p className="py-8 text-center text-gray-500">No hay datos de usuarios</p>;
  }

  return (
    <div className="space-y-3">
      {users.map((user, index) => (
        <div
          key={`${user.email || user.name}-${index}`}
          className="rounded-xl bg-gray-50 p-4 transition-colors hover:bg-gray-100 dark:bg-gray-700/50 dark:hover:bg-gray-700"
        >
          <div className="flex items-start gap-3">
            <UserAvatar avatar={user.avatar} name={user.name} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate font-semibold text-gray-900 dark:text-white">{user.name}</p>
                {index < 3 && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                    #{index + 1}
                  </span>
                )}
              </div>
              {user.email && <p className="truncate text-xs text-gray-500 dark:text-gray-400">{user.email}</p>}
              <div className="mt-2 flex items-center gap-3 text-xs text-gray-600 dark:text-gray-300">
                <span>{user.messageCount} msgs</span>
                <span>-</span>
                <span>{user.conversationCount} conv</span>
                <span>-</span>
                <span>{user.tokens.toLocaleString()} tokens</span>
                <span>-</span>
                <span>${user.cost.toFixed(4)}</span>
              </div>
              {user.questions.length > 0 && (
                <div className="mt-2 space-y-1">
                  {user.questions.slice(0, 2).map((question, qIndex) => (
                    <p key={qIndex} className="truncate text-xs italic text-gray-500 dark:text-gray-400">
                      "{question}..."
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function UserAvatar({ avatar, name }: { avatar?: string; name: string }) {
  if (avatar) return <img alt={name} className="h-10 w-10 rounded-full" src={avatar} />;

  return (
    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 font-bold text-white">
      {name.charAt(0).toUpperCase()}
    </div>
  );
}
