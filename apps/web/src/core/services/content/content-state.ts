export interface ContentState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

export async function resolveContentState<T>(
  loader: () => Promise<T>,
): Promise<ContentState<T>> {
  try {
    return {
      data: await loader(),
      loading: false,
      error: null,
    }
  } catch (error) {
    return {
      data: null,
      loading: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    }
  }
}
