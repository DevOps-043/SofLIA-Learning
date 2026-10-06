export class LiveError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function checked<T>(result: {
  data: T;
  error: { message: string } | null;
}): T {
  if (result.error)
    throw new LiveError(
      503,
      "No se pudo acceder al módulo In Live. Verifica su configuración.",
    );
  return result.data;
}
export function requiredData<T>(result: {
  data: T;
  error: { message: string } | null;
}): NonNullable<T> {
  const value = checked(result);
  if (value === null || value === undefined)
    throw new LiveError(503, "No se encontraron los datos requeridos");
  return value;
}
