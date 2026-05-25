import type { AdminModule } from '../../services/adminModules.service';

export interface ModuleModalProps {
  module?: AdminModule | null;
  onClose: () => void;
  onSave: (data: ModuleFormData) => Promise<void>;
}

export interface ModuleFormData {
  is_published: boolean;
  is_required: boolean;
  module_description: string;
  module_title: string;
}
