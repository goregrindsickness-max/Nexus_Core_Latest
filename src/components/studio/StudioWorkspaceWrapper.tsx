import React, { useState } from 'react';
import { useSongProjects } from '../../hooks/useSongProjects';
import { SongProjectDashboard } from './SongProjectDashboard';
import { SongWorkspace } from './SongWorkspace';

interface StudioWorkspaceWrapperProps {
  onBack?: () => void;
  triggerNotification?: (msg: string) => void;
}

export const StudioWorkspaceWrapper: React.FC<StudioWorkspaceWrapperProps> = ({
  onBack,
  triggerNotification
}) => {
  const {
    projects,
    activeProject,
    loading,
    createProject,
    inviteCollaborator,
    uploadStemTrack,
    addStemVersion,
    updateStemTrack,
    addTimestampComment,
    selectProject
  } = useSongProjects();

  const [workspaceMode, setWorkspaceMode] = useState<boolean>(false);

  const handleSelectProject = (projectId: string) => {
    selectProject(projectId);
    setWorkspaceMode(true);
    triggerNotification?.('Opening Song Workspace & Multi-Track Stems...');
  };

  const handleCreateProject = async (data: any) => {
    const proj = await createProject(data);
    if (proj) {
      triggerNotification?.(`Song Project "${data.title}" Initialized!`);
      setWorkspaceMode(true);
    }
  };

  const handleInvite = async (projectId: string, collabData: any) => {
    await inviteCollaborator(projectId, collabData);
    triggerNotification?.(`Studio Invite Sent to ${collabData.handle_or_email}`);
  };

  const handleUploadStem = async (projectId: string, stemData: any) => {
    await uploadStemTrack(projectId, stemData);
    triggerNotification?.(`Stem "${stemData.title}" Transmitted!`);
  };

  const handleAddVersion = async (projectId: string, stemId: string, file: any, notes?: string) => {
    await addStemVersion(projectId, stemId, file, notes);
    triggerNotification?.(`New Stem Version Uploaded!`);
  };

  if (workspaceMode && activeProject) {
    return (
      <SongWorkspace
        project={activeProject}
        onBack={() => setWorkspaceMode(false)}
        onInviteCollaborator={handleInvite}
        onUploadStem={handleUploadStem}
        onAddStemVersion={handleAddVersion}
        onUpdateStemTrack={updateStemTrack}
        onAddTimestampComment={(projectId, stemId, sec, comment) => {
          addTimestampComment(projectId, stemId, sec, comment);
          triggerNotification?.(`Feedback comment posted @ ${Math.floor(sec / 60)}:${Math.floor(sec % 60) < 10 ? '0' : ''}${Math.floor(sec % 60)}`);
        }}
      />
    );
  }

  return (
    <SongProjectDashboard
      projects={projects}
      loading={loading}
      onSelectProject={handleSelectProject}
      onCreateProject={handleCreateProject}
    />
  );
};

export default StudioWorkspaceWrapper;
