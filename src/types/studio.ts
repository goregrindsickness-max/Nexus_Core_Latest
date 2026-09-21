export type CollaboratorRole = 'BAND_MEMBER' | 'SESSION_ARTIST' | 'ENGINEER' | 'GUEST_FEATURE';

export type ProjectStatus = 'DRAFT' | 'IN_PROGRESS' | 'MIXING' | 'MASTERING' | 'COMPLETED';

export interface ProjectCollaborator {
  id: string;
  project_id: string;
  user_id?: string;
  handle?: string;
  email?: string;
  name?: string;
  avatar_url?: string;
  access_level: CollaboratorRole;
  track_role: string;
  joined_at?: string;
}

export interface StemVersion {
  id: string;
  version_number: number;
  file_url: string;
  uploaded_by?: string;
  uploaded_at?: string;
  notes?: string;
}

export interface StemComment {
  id: string;
  timestamp_sec: number;
  user_name: string;
  user_avatar?: string;
  comment: string;
  created_at: string;
}

export interface StemTrack {
  id: string;
  project_id: string;
  title: string;
  track_type?: string;
  volume: number; // 0 to 100
  muted: boolean;
  solo: boolean;
  selected_version_id: string;
  versions: StemVersion[];
  comments?: StemComment[];
}

export interface SongProject {
  id: string;
  title: string;
  bpm: number;
  musical_key: string;
  status: ProjectStatus;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  description?: string;
  collaborators?: ProjectCollaborator[];
  stems?: StemTrack[];
}
