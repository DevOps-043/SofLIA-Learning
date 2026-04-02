export interface NodeMember {
  created_at: string;
  id: string;
  is_primary: boolean;
  node_id: string;
  role: string;
  user_id: string;
  users: {
    email: string;
    first_name: string;
    id: string;
    last_name: string;
    profile_picture_url?: string | null;
    username: string;
  };
}
