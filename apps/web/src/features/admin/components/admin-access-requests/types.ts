export interface AccessRequest {
  community: {
    name: string;
    slug: string;
  };
  community_id: string;
  created_at: string;
  id: string;
  note?: string;
  requester: {
    email: string;
    first_name?: string;
    last_name?: string;
    username: string;
  };
  requester_id: string;
  reviewed_at?: string;
  status: 'approved' | 'pending' | 'rejected';
}

export interface AccessRequestStats {
  totalApproved: number;
  totalPending: number;
  totalRejected: number;
  totalRequests: number;
}

export const emptyAccessRequestStats: AccessRequestStats = {
  totalApproved: 0,
  totalPending: 0,
  totalRejected: 0,
  totalRequests: 0,
};
