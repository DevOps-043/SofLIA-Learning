import { Shield } from 'lucide-react';
import type { BulkInviteForm, IndividualInviteForm } from '../types';
import type { RoleSelectorProps } from './types';

export function InviteRoleSelector<TForm extends BulkInviteForm | IndividualInviteForm>({
  form,
  onRoleChange,
  roleLabels,
  status,
  theme,
}: RoleSelectorProps<TForm>) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
      {(['member', 'admin', 'owner'] as const).map((role) => {
        const isActive = form.role === role;
        return (
          <button
            key={role}
            className={`relative shrink-0 rounded-[1.5rem] border p-3 text-left transition-all sm:p-4 ${isActive ? 'scale-[1.02] shadow-2xl' : 'opacity-60 grayscale hover:opacity-100 hover:grayscale-0'}`}
            disabled={status === 'loading'}
            onClick={() => onRoleChange(role)}
            style={{
              backgroundColor: isActive ? theme.primaryColor : theme.inputBg,
              borderColor: isActive ? theme.primaryColor : theme.borderColor,
            }}
            type="button"
          >
            <div className="flex min-w-0 flex-col gap-1">
              <div className="mb-1 flex min-w-0 items-center gap-2">
                <Shield className="h-5 w-5 shrink-0" style={{ color: isActive ? theme.onPrimaryColor : theme.mutedText }} strokeWidth={2.5} />
                <span className="truncate text-[9px] font-black uppercase tracking-tight sm:text-[10px] sm:tracking-widest" style={{ color: isActive ? theme.onPrimaryColor : theme.textColor }}>
                  {roleLabels[role].label}
                </span>
              </div>
              <p className="hidden truncate text-[9px] leading-tight opacity-60 sm:block sm:text-[10px]" style={{ color: isActive ? theme.onPrimaryColor : theme.mutedText }}>
                {roleLabels[role].desc}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
