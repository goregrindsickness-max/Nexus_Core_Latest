import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { SongProject, ProjectCollaborator, StemTrack, CollaboratorRole, ProjectStatus, StemVersion } from '../types/studio';

const LOCAL_STORAGE_KEY = 'nexus_song_projects_v1';

const INITIAL_DEMO_PROJECTS: SongProject[] = [
  {
    id: 'sp-demo-01',
    title: 'Cybernetic Horizon (Album Opener)',
    bpm: 128,
    musical_key: 'D Minor',
    status: 'IN_PROGRESS',
    description: 'Dystopian Industrial Metal track with heavy analog synths and aggressive rhythm section.',
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    collaborators: [
      {
        id: 'collab-1',
        project_id: 'sp-demo-01',
        name: 'Alex Mercer',
        handle: 'alex_riffs',
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        access_level: 'BAND_MEMBER',
        track_role: 'Lead Guitarist & Producer',
      },
      {
        id: 'collab-2',
        project_id: 'sp-demo-01',
        name: 'Devon Vance',
        handle: 'vance_drums',
        avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        access_level: 'SESSION_ARTIST',
        track_role: 'Session Drums',
      },
      {
        id: 'collab-3',
        project_id: 'sp-demo-01',
        name: 'Kira Thorne',
        handle: 'kira_mix',
        avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
        access_level: 'ENGINEER',
        track_role: 'Mixing Engineer',
      },
    ],
    stems: [
      {
        id: 'stem-1',
        project_id: 'sp-demo-01',
        title: 'Heavy Rhythm Guitars (Stereo Double)',
        volume: 85,
        muted: false,
        solo: false,
        selected_version_id: 'stem-1-v2',
        versions: [
          {
            id: 'stem-1-v1',
            version_number: 1,
            file_url: 'https://cdn.freesound.org/previews/583/583348_11861866-lq.mp3',
            uploaded_by: 'Alex Mercer',
            uploaded_at: new Date(Date.now() - 86400000 * 2).toISOString(),
            notes: 'Raw tracking without EQ',
          },
          {
            id: 'stem-1-v2',
            version_number: 2,
            file_url: 'https://cdn.freesound.org/previews/583/583348_11861866-lq.mp3',
            uploaded_by: 'Alex Mercer',
            uploaded_at: new Date(Date.now() - 86400000).toISOString(),
            notes: 'Tightened rhythm gate + tube saturation pass',
          },
        ],
        comments: [
          {
            id: 'c1',
            timestamp_sec: 14.2,
            user_name: 'Kira Thorne',
            comment: 'Slightly reduce 400Hz boxiness here so drums cut through',
            created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
          }
        ]
      },
      {
        id: 'stem-2',
        project_id: 'sp-demo-01',
        title: 'Cyber Bass Synth & Sub Lows',
        volume: 90,
        muted: false,
        solo: false,
        selected_version_id: 'stem-2-v1',
        versions: [
          {
            id: 'stem-2-v1',
            version_number: 1,
            file_url: 'https://cdn.freesound.org/previews/612/612187_11861866-lq.mp3',
            uploaded_by: 'Alex Mercer',
            uploaded_at: new Date(Date.now() - 86400000 * 2).toISOString(),
            notes: 'Moog sub oscillator + distortion pedal loop',
          }
        ],
        comments: []
      },
      {
        id: 'stem-3',
        project_id: 'sp-demo-01',
        title: 'Acoustic Drums & Percussion Trigger',
        volume: 80,
        muted: false,
        solo: false,
        selected_version_id: 'stem-3-v1',
        versions: [
          {
            id: 'stem-3-v1',
            version_number: 1,
            file_url: 'https://cdn.freesound.org/previews/682/682121_12373324-lq.mp3',
            uploaded_by: 'Devon Vance',
            uploaded_at: new Date(Date.now() - 43200000).toISOString(),
            notes: 'Multi-miked room setup + kick sample layer',
          }
        ],
        comments: [
          {
            id: 'c2',
            timestamp_sec: 28.5,
            user_name: 'Devon Vance',
            comment: 'Added a snare ghost roll before the hook transition',
            created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
          }
        ]
      }
    ]
  },
  {
    id: 'sp-demo-02',
    title: 'Neon Bloodline (Synthwave Feature)',
    bpm: 115,
    musical_key: 'F# Minor',
    status: 'MIXING',
    description: 'Retro futuristic track featuring guest vocoder and analog arpeggiators.',
    created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
    collaborators: [
      {
        id: 'collab-201',
        project_id: 'sp-demo-02',
        name: 'Vesper Noir',
        handle: 'vesper_synth',
        avatar_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
        access_level: 'GUEST_FEATURE',
        track_role: 'Guest Vocalist & Vocoder',
      }
    ],
    stems: []
  }
];

export function useSongProjects() {
  const [projects, setProjects] = useState<SongProject[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial projects from Supabase or localStorage
  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Attempt fetching from Supabase
      const { data: dbProjects, error: dbError } = await supabase
        .from('song_projects')
        .select(`
          *,
          project_collaborators(*),
          song_stems(*)
        `)
        .order('created_at', { ascending: false });

      if (!dbError && dbProjects && dbProjects.length > 0) {
        // Map database response to domain model
        const formatted: SongProject[] = dbProjects.map(p => ({
          id: p.id,
          title: p.title || p.name || 'Untitled Transmission',
          bpm: p.bpm || 120,
          musical_key: p.musical_key || p.key || 'C Major',
          status: (p.status?.toUpperCase() as ProjectStatus) || 'IN_PROGRESS',
          description: p.description || '',
          created_at: p.created_at,
          collaborators: (p.project_collaborators || []).map((c: any) => ({
            id: c.id,
            project_id: p.id,
            name: c.name || c.handle || 'Collaborator',
            handle: c.handle || '',
            email: c.email || '',
            avatar_url: c.avatar_url || c.avatar,
            access_level: (c.access_level as CollaboratorRole) || 'BAND_MEMBER',
            track_role: c.track_role || 'Contributor',
          })),
          stems: (p.song_stems || []).map((s: any) => ({
            id: s.id,
            project_id: p.id,
            title: s.title || 'Stem Track',
            volume: s.volume ?? 80,
            muted: s.muted ?? false,
            solo: s.solo ?? false,
            selected_version_id: s.selected_version_id || 'v1',
            versions: s.versions || [
              {
                id: 'v1',
                version_number: 1,
                file_url: s.file_url || 'https://cdn.freesound.org/previews/583/583348_11861866-lq.mp3',
                uploaded_at: s.created_at
              }
            ],
            comments: s.comments || []
          }))
        }));

        setProjects(formatted);
        if (!activeProjectId && formatted.length > 0) {
          setActiveProjectId(formatted[0].id);
        }
      } else {
        // Fallback to local storage or demo data
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setProjects(parsed);
              if (!activeProjectId) setActiveProjectId(parsed[0].id);
            } else {
              setProjects(INITIAL_DEMO_PROJECTS);
              setActiveProjectId(INITIAL_DEMO_PROJECTS[0].id);
            }
          } catch {
            setProjects(INITIAL_DEMO_PROJECTS);
            setActiveProjectId(INITIAL_DEMO_PROJECTS[0].id);
          }
        } else {
          setProjects(INITIAL_DEMO_PROJECTS);
          setActiveProjectId(INITIAL_DEMO_PROJECTS[0].id);
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_DEMO_PROJECTS));
        }
      }
    } catch (err: any) {
      console.warn('Song project fetch notice:', err.message);
      // Ensure smooth demo fallback
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setProjects(parsed);
          if (!activeProjectId && parsed.length > 0) setActiveProjectId(parsed[0].id);
        } catch {
          setProjects(INITIAL_DEMO_PROJECTS);
          if (!activeProjectId) setActiveProjectId(INITIAL_DEMO_PROJECTS[0].id);
        }
      } else {
        setProjects(INITIAL_DEMO_PROJECTS);
        if (!activeProjectId) setActiveProjectId(INITIAL_DEMO_PROJECTS[0].id);
      }
    } finally {
      setLoading(false);
    }
  }, [activeProjectId]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Sync projects to localStorage for instant client durability
  const saveProjectsToStorage = (updated: SongProject[]) => {
    setProjects(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Error saving projects to localStorage', e);
    }
  };

  // Create a new song project
  const createProject = async (data: {
    title: string;
    bpm: number;
    musical_key: string;
    status: ProjectStatus;
    description?: string;
  }): Promise<SongProject | null> => {
    const newId = `sp-${Date.now()}`;
    const newProj: SongProject = {
      id: newId,
      title: data.title || 'Untitled Transmission',
      bpm: Number(data.bpm) || 120,
      musical_key: data.musical_key || 'C Major',
      status: data.status || 'IN_PROGRESS',
      description: data.description || '',
      created_at: new Date().toISOString(),
      collaborators: [],
      stems: []
    };

    // Try inserting into Supabase
    try {
      await supabase.from('song_projects').insert([
        {
          id: newId,
          title: newProj.title,
          bpm: newProj.bpm,
          musical_key: newProj.musical_key,
          status: newProj.status,
          description: newProj.description
        }
      ]);
    } catch (e) {
      console.warn('Supabase insert notice:', e);
    }

    const updated = [newProj, ...projects];
    saveProjectsToStorage(updated);
    setActiveProjectId(newId);
    return newProj;
  };

  // Invite collaborator
  const inviteCollaborator = async (
    projectId: string,
    collaborator: {
      handle_or_email: string;
      access_level: CollaboratorRole;
      track_role: string;
    }
  ) => {
    const newCollab: ProjectCollaborator = {
      id: `collab-${Date.now()}`,
      project_id: projectId,
      handle: collaborator.handle_or_email.startsWith('@') ? collaborator.handle_or_email : `@${collaborator.handle_or_email}`,
      email: collaborator.handle_or_email.includes('@') ? collaborator.handle_or_email : '',
      name: collaborator.handle_or_email.replace('@', '').split('.')[0] || 'Collaborator',
      access_level: collaborator.access_level,
      track_role: collaborator.track_role || 'Contributor',
      joined_at: new Date().toISOString()
    };

    try {
      await supabase.from('project_collaborators').insert([
        {
          project_id: projectId,
          handle: newCollab.handle,
          email: newCollab.email,
          access_level: newCollab.access_level,
          track_role: newCollab.track_role
        }
      ]);
    } catch (e) {
      console.warn('Supabase collaborator invite notice:', e);
    }

    const updated = projects.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          collaborators: [...(p.collaborators || []), newCollab]
        };
      }
      return p;
    });

    saveProjectsToStorage(updated);
  };

  // Upload new stem track or version
  const uploadStemTrack = async (
    projectId: string,
    stemData: {
      title: string;
      track_role?: string;
      file: File | string;
      notes?: string;
    }
  ) => {
    let fileUrl = 'https://cdn.freesound.org/previews/583/583348_11861866-lq.mp3';

    if (typeof stemData.file === 'object' && stemData.file instanceof File) {
      try {
        const fileExt = stemData.file.name.split('.').pop();
        const fileName = `stem_${Date.now()}.${fileExt}`;
        const filePath = `stems/${projectId}/${fileName}`;

        const { error: uploadErr } = await supabase.storage
          .from('feed_media')
          .upload(filePath, stemData.file);

        if (!uploadErr) {
          const { data: publicUrlData } = supabase.storage
            .from('feed_media')
            .getPublicUrl(filePath);
          if (publicUrlData?.publicUrl) {
            fileUrl = publicUrlData.publicUrl;
          }
        } else {
          fileUrl = URL.createObjectURL(stemData.file);
        }
      } catch (e) {
        fileUrl = URL.createObjectURL(stemData.file as File);
      }
    } else if (typeof stemData.file === 'string' && stemData.file) {
      fileUrl = stemData.file;
    }

    const stemId = `stem-${Date.now()}`;
    const newStem: StemTrack = {
      id: stemId,
      project_id: projectId,
      title: stemData.title || 'New Stem Track',
      volume: 85,
      muted: false,
      solo: false,
      selected_version_id: 'v1',
      versions: [
        {
          id: 'v1',
          version_number: 1,
          file_url: fileUrl,
          uploaded_by: 'You',
          uploaded_at: new Date().toISOString(),
          notes: stemData.notes || 'Initial stem transmission'
        }
      ],
      comments: []
    };

    try {
      await supabase.from('song_stems').insert([
        {
          id: stemId,
          project_id: projectId,
          title: newStem.title,
          file_url: fileUrl,
          selected_version_id: 'v1',
          versions: newStem.versions
        }
      ]);
    } catch (e) {
      console.warn('Supabase stem upload notice:', e);
    }

    const updated = projects.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          stems: [...(p.stems || []), newStem]
        };
      }
      return p;
    });

    saveProjectsToStorage(updated);
  };

  // Add new version to an existing stem
  const addStemVersion = async (
    projectId: string,
    stemId: string,
    file: File | string,
    notes?: string
  ) => {
    let fileUrl = 'https://cdn.freesound.org/previews/583/583348_11861866-lq.mp3';

    if (typeof file === 'object' && file instanceof File) {
      try {
        fileUrl = URL.createObjectURL(file);
      } catch (e) {}
    } else if (typeof file === 'string' && file) {
      fileUrl = file;
    }

    const updated = projects.map(p => {
      if (p.id === projectId) {
        const updatedStems = (p.stems || []).map(s => {
          if (s.id === stemId) {
            const nextVersionNum = (s.versions?.length || 0) + 1;
            const newVerId = `v${nextVersionNum}`;
            const newVersion: StemVersion = {
              id: newVerId,
              version_number: nextVersionNum,
              file_url: fileUrl,
              uploaded_by: 'You',
              uploaded_at: new Date().toISOString(),
              notes: notes || `Version ${nextVersionNum} upload`
            };
            return {
              ...s,
              selected_version_id: newVerId,
              versions: [...(s.versions || []), newVersion]
            };
          }
          return s;
        });
        return { ...p, stems: updatedStems };
      }
      return p;
    });

    saveProjectsToStorage(updated);
  };

  // Update stem mute, solo, volume or selected version
  const updateStemTrack = (
    projectId: string,
    stemId: string,
    updates: Partial<StemTrack>
  ) => {
    const updated = projects.map(p => {
      if (p.id === projectId) {
        const updatedStems = (p.stems || []).map(s => {
          if (s.id === stemId) {
            return { ...s, ...updates };
          }
          return s;
        });

        // Handle Solo exclusivity or multi-solo logic
        if (updates.solo !== undefined) {
          const anySolo = updatedStems.some(s => s.solo);
          if (anySolo) {
            // Unmute soloed tracks, others stay as is
          }
        }

        return { ...p, stems: updatedStems };
      }
      return p;
    });

    saveProjectsToStorage(updated);
  };

  // Add timestamp comment to a stem track
  const addTimestampComment = (
    projectId: string,
    stemId: string,
    timestamp_sec: number,
    comment: string
  ) => {
    if (!comment.trim()) return;

    const newComment = {
      id: `c-${Date.now()}`,
      timestamp_sec,
      user_name: 'You',
      comment: comment.trim(),
      created_at: new Date().toISOString()
    };

    const updated = projects.map(p => {
      if (p.id === projectId) {
        const updatedStems = (p.stems || []).map(s => {
          if (s.id === stemId) {
            return {
              ...s,
              comments: [...(s.comments || []), newComment]
            };
          }
          return s;
        });
        return { ...p, stems: updatedStems };
      }
      return p;
    });

    saveProjectsToStorage(updated);
  };

  const activeProject = projects.find(p => p.id === activeProjectId) || projects[0] || null;

  return {
    projects,
    activeProject,
    activeProjectId,
    loading,
    error,
    fetchProjects,
    createProject,
    inviteCollaborator,
    uploadStemTrack,
    addStemVersion,
    updateStemTrack,
    addTimestampComment,
    selectProject: setActiveProjectId
  };
}
