
// Tipos customizados para evitar erros de TypeScript enquanto o schema não está sincronizado
export interface SystemStats {
  id: string;
  stat_date: string;
  visits: number;
  signups: number;
  content_created: number;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  entity: string;
  entity_id?: string;
  details: any;
  ip_address?: string;
  created_at: string;
}

export interface Comment {
  id: string;
  author_name: string;
  gallery_item_id: string;
  content: string;
  is_approved: boolean;
  created_at: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  image: string;
  description?: string;
  motivation?: string;
  personal_message?: string;
  media_type?: string;
  is_external_link?: boolean;
  created_at: string;
}

export interface AdminProfile {
  id: string;
  role: 'admin' | 'super_admin';
  is_active?: boolean;
  created_at: string;
}

export interface UserData {
  id: string;
  email: string;
  last_sign_in_at?: string;
}
