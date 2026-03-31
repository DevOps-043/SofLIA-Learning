import type { DeleteModuleModalProps } from './types'

export function DeleteModuleModal({ deletingModule, onCancel, onConfirm }: DeleteModuleModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-xl font-bold text-white mb-4">Confirmar Eliminación</h3>
        <p className="text-gray-300 mb-6">
          ¿Estás seguro de que deseas eliminar el módulo &quot;{deletingModule.module_title}&quot;?
          Esta acción no se puede deshacer y eliminará todas las lecciones asociadas.
        </p>
        <div className="flex justify-end space-x-3">
          <button onClick={onCancel} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white">
            Cancelar
          </button>
          <button onClick={onConfirm} className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white">
            Eliminar
          </button>
        </div>
      </div>
    </div>
  )
}
