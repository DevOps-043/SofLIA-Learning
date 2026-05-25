/**
 * Componente de Loading para páginas de administración
 * Usado durante lazy loading de componentes pesados
 */
export function AdminLoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-white dark:bg-carbon-900">
      <div className="text-center">
        <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-accent/20 border-t-accent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]">
          <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
            Cargando...
          </span>
        </div>
        <p 
          className="mt-4 text-sm text-primary dark:text-white"
          style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
        >
          Cargando panel de administración...
        </p>
      </div>
    </div>
  );
}
