import Link from 'next/link';

export default async function NotFound() {
  const homeUrl = '/';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-9xl font-bold text-blue-600/20">
            404
          </h1>
          <h2 className="text-3xl font-bold text-gray-900">
            Página no encontrada
          </h2>
          <p className="text-gray-600">
            Lo sentimos, la página que estás buscando no existe o ha sido movida.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href={homeUrl}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all"
          >
            Ir al inicio
          </Link>
          <Link
            href={homeUrl}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-blue-600 text-blue-600 bg-transparent rounded-xl font-semibold hover:bg-blue-600 hover:text-white transition-all"
          >
            Explorar
          </Link>
        </div>
      </div>
    </div>
  );
}
