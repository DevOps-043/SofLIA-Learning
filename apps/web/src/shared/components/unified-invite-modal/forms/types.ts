import type {
  BulkInviteForm,
  IndividualInviteForm,
  InviteRole,
  ModalStatus,
  UnifiedInviteModalController,
  UnifiedInviteTheme,
} from '../types';

export interface FormsViewProps {
  controller: UnifiedInviteModalController;
  mode: 'bulk' | 'individual';
  onClose: () => void;
  theme: UnifiedInviteTheme;
}

export interface RoleSelectorProps<TForm extends BulkInviteForm | IndividualInviteForm> {
  allowedRoles?: readonly InviteRole[];
  form: TForm;
  onRoleChange: (role: InviteRole) => void;
  roleLabels: UnifiedInviteModalController['roleLabels'];
  status: ModalStatus;
  theme: UnifiedInviteTheme;
}
