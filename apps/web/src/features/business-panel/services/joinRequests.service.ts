export interface JoinRequest {
  id: string
  status: string
  message: string | null
  job_title: string | null
  created_at: string
  updated_at: string
  users: {
    id: string
    first_name: string | null
    last_name: string | null
    email: string
    username: string
    avatar_url: string | null
  } | null
}

export class JoinRequestsService {
  static async getJoinRequests(): Promise<{ requests: JoinRequest[]; count: number }> {
    const res = await fetch('/api/business/join-requests', {
      credentials: 'include',
    })

    if (!res.ok) {
      throw new Error('Error al obtener solicitudes')
    }

    const data = await res.json()
    return { requests: data.requests || [], count: data.count || 0 }
  }

  static async reviewJoinRequest(requestId: string, action: 'approve' | 'reject'): Promise<void> {
    const res = await fetch(`/api/business/join-requests/${requestId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ action }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error || 'Error al procesar la solicitud')
    }
  }
}
