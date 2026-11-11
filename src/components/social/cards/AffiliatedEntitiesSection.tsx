import React, { useState, useEffect } from 'react';
import {
  Plus,
  Calendar,
  Edit3,
  ExternalLink,
  Link2,
  Unlink,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Building2,
  MapPin,
} from 'lucide-react';
import {
  NetworkEntity,
  FestivalEdition,
  ENTITY_CATEGORY_META,
  getUserManagedEntities,
  getEditionsForEntity,
  getLineupForEdition,
  openTaggedBandOrEntityProfile,
  getLinkedEntityForPromoterWorkspace,
  linkEntityToPromoterWorkspace,
} from '../../../services/networkEntitiesService';
import { CreateEntityModal } from '../modals/CreateEntityModal';
import { FestivalLineupEditorModal } from '../modals/FestivalLineupEditorModal';
import { FestivalLineupCard } from './FestivalLineupCard';

export interface AffiliatedEntitiesSectionProps {
  userProfile?: any;
  setUserProfile?: (profile: any) => void;
  isOwnProfile?: boolean;
  showPromoterWorkspacePointer?: boolean;
  triggerNotification?: (msg: string) => void;
  onSelectPostAsEntity?: (entity: NetworkEntity) => void;
}

export const AffiliatedEntitiesSection: React.FC<AffiliatedEntitiesSectionProps> = ({
  userProfile,
  setUserProfile,
  isOwnProfile = true,
  showPromoterWorkspacePointer = false,
  triggerNotification,
  onSelectPostAsEntity,
}) => {
  const [entities, setEntities] = useState<NetworkEntity[]>([]);
  const [linkedEntity, setLinkedEntity] = useState<NetworkEntity | null>(null);
  const [expandedFestivalEntityId, setExpandedFestivalEntityId] = useState<string | null>(null);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingEntity, setEditingEntity] = useState<NetworkEntity | null>(null);
  const [lineupModalEntity, setLineupModalEntity] = useState<NetworkEntity | null>(null);
  const [lineupModalEditionId, setLineupModalEditionId] = useState<string | undefined>(undefined);

  const refreshEntities = () => {
    const list = getUserManagedEntities(userProfile?.id);
    setEntities(list);
    setLinkedEntity(getLinkedEntityForPromoterWorkspace(userProfile));
  };

  useEffect(() => {
    refreshEntities();
    const onUpdated = () => refreshEntities();
    window.addEventListener('nexus_entities_updated', onUpdated);
    return () => window.removeEventListener('nexus_entities_updated', onUpdated);
  }, [userProfile?.id, userProfile?.linked_entity_id]);

  return (
    <div className="mt-3 bg-zinc-950/90 border border-zinc-800/90 rounded-xl p-3.5 space-y-3 text-left">
      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-amber-400 shrink-0" />
          <div>
            <h4 className="text-[11px] font-mono font-black uppercase tracking-widest text-white">
              Affiliated Projects & Public Entities
            </h4>
            <p className="text-[9.5px] font-mono text-zinc-400">
              Festivals, Labels/Distros, Booking Collectives & Press Pages
            </p>
          </div>
        </div>

        {isOwnProfile && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setEditingEntity(null);
              setShowCreateModal(true);
            }}
            className="px-2.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 font-mono font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-3 h-3" />
            <span>Create Public Page</span>
          </button>
        )}
      </div>

      {/* Optional Promoter Workspace Pointer/Reference Model Banner */}
      {showPromoterWorkspacePointer && (
        <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-amber-300 uppercase">
              <Link2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Promoter Workspace Public Brand Pointer (linked_entity_id)</span>
            </div>
            {linkedEntity ? (
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-bold">
                LINKED: @{linkedEntity.slug}
              </span>
            ) : (
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                UNLINKED
              </span>
            )}
          </div>
          <p className="text-[10px] font-mono text-zinc-400 leading-relaxed">
            Workspaces read public branding and festival editions directly from <code className="text-amber-300">linked_entity_id</code> without duplicating or migrating posts or followers.
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <select
              value={linkedEntity?.id || ''}
              onChange={async (e) => {
                const nextId = e.target.value || null;
                await linkEntityToPromoterWorkspace(nextId, userProfile, setUserProfile);
                refreshEntities();
                triggerNotification?.(
                  nextId
                    ? '🔗 Linked Promoter Workspace to public entity via linked_entity_id!'
                    : 'Unlinked public entity from Promoter Workspace.'
                );
              }}
              className="flex-1 min-w-[200px] bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white cursor-pointer"
            >
              <option value="">-- Select Public Entity to Link to Workspace --</option>
              {entities.map((ent) => (
                <option key={ent.id} value={ent.id}>
                  {ENTITY_CATEGORY_META[ent.category]?.icon || '🎪'} {ent.display_name} (@{ent.slug})
                </option>
              ))}
            </select>
            {linkedEntity && (
              <button
                type="button"
                onClick={async () => {
                  await linkEntityToPromoterWorkspace(null, userProfile, setUserProfile);
                  refreshEntities();
                  triggerNotification?.('Unlinked public entity pointer from Promoter Workspace.');
                }}
                className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-rose-950/60 border border-zinc-700 hover:border-rose-500/40 text-zinc-300 hover:text-rose-300 text-[10px] font-mono font-bold uppercase flex items-center gap-1 cursor-pointer"
              >
                <Unlink className="w-3 h-3" />
                <span>Unlink</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Entities List or Empty CTA Card */}
      {entities.length === 0 ? (
        <div className="p-4 rounded-xl bg-zinc-900/50 border border-dashed border-zinc-800 text-center space-y-2">
          <p className="text-xs font-mono font-bold text-zinc-300">
            No Affiliated Public Pages Registered Yet
          </p>
          <p className="text-[10px] font-mono text-zinc-500 max-w-md mx-auto">
            Launch a public Festival, Record Label/Distro, Booking Collective, or Media page to post updates and build interactive festival lineups.
          </p>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setEditingEntity(null);
              setShowCreateModal(true);
            }}
            className="mt-1 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-mono font-black text-[10px] uppercase tracking-wider cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Create Public Page or Entity</span>
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {entities.map((ent) => {
            const catMeta = ENTITY_CATEGORY_META[ent.category] || ENTITY_CATEGORY_META.festival;
            const editions = ent.category === 'festival' ? getEditionsForEntity(ent.id) : [];
            const primaryEdition = editions[0] || null;
            const lineupCount = primaryEdition ? getLineupForEdition(primaryEdition.id).length : 0;
            const isExpanded = expandedFestivalEntityId === ent.id;

            return (
              <div
                key={ent.id}
                className="rounded-xl bg-zinc-900/60 border border-zinc-800/90 hover:border-zinc-700 p-3 transition-all space-y-2.5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      openTaggedBandOrEntityProfile(ent, triggerNotification);
                    }}
                    className="flex items-center gap-2.5 min-w-0 cursor-pointer group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-zinc-950 border border-zinc-700 overflow-hidden shrink-0 flex items-center justify-center">
                      {ent.avatar_url ? (
                        <img
                          src={ent.avatar_url}
                          alt={ent.display_name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span className="text-base">{catMeta.icon}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-black uppercase text-white group-hover:text-amber-300 transition-colors truncate">
                          {ent.display_name}
                        </span>
                        <span
                          className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase ${catMeta.badgeBg} ${catMeta.badgeText} ${catMeta.badgeBorder}`}
                        >
                          {catMeta.icon} {catMeta.shortLabel}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-400 truncate mt-0.5">
                        <span className="text-amber-300/90">@{ent.slug}</span>
                        {ent.location && (
                          <span className="inline-flex items-center gap-0.5">
                            <MapPin className="w-2.5 h-2.5 text-rose-400" />
                            {ent.location}
                          </span>
                        )}
                        {ent.category === 'festival' && (
                          <span className="text-emerald-400 font-bold">
                            • {editions.length} {editions.length === 1 ? 'Edition' : 'Editions'} ({lineupCount} Bands)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Entity Action Buttons */}
                  <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                    {ent.category === 'festival' && (
                      <>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedFestivalEntityId(isExpanded ? null : ent.id);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-zinc-950 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 font-mono font-bold text-[9.5px] uppercase flex items-center gap-1 cursor-pointer"
                        >
                          <Calendar className="w-3 h-3 text-amber-400" />
                          <span>{isExpanded ? 'Hide Lineup' : 'View Billing'}</span>
                          {isExpanded ? (
                            <ChevronUp className="w-3 h-3" />
                          ) : (
                            <ChevronDown className="w-3 h-3" />
                          )}
                        </button>

                        {isOwnProfile && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setLineupModalEntity(ent);
                              setLineupModalEditionId(primaryEdition?.id);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 font-mono font-bold text-[9.5px] uppercase flex items-center gap-1 cursor-pointer"
                          >
                            <Sparkles className="w-3 h-3 text-amber-400" />
                            <span>Manage Lineup</span>
                          </button>
                        )}
                      </>
                    )}

                    {isOwnProfile && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingEntity(ent);
                          setShowCreateModal(true);
                        }}
                        className="p-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white cursor-pointer"
                        title="Edit Public Entity"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openTaggedBandOrEntityProfile(ent, triggerNotification);
                      }}
                      className="p-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white cursor-pointer"
                      title="Open Public Entity Page"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Expandable Interactive Festival Lineup Poster Card */}
                {ent.category === 'festival' && isExpanded && (
                  <div className="pt-2 border-t border-zinc-800/80">
                    <FestivalLineupCard
                      entityId={ent.id}
                      editionId={primaryEdition?.id}
                      isEditable={isOwnProfile}
                      onEditLineup={(entityObj, editionObj) => {
                        setLineupModalEntity(entityObj);
                        setLineupModalEditionId(editionObj.id);
                      }}
                      triggerNotification={triggerNotification}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <CreateEntityModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setEditingEntity(null);
        }}
        userProfile={userProfile}
        initialEntity={editingEntity}
        onEntityCreated={(created, createdEditionId) => {
          refreshEntities();
          onSelectPostAsEntity?.(created);
          if (created.category === 'festival' && createdEditionId) {
            setLineupModalEntity(created);
            setLineupModalEditionId(createdEditionId);
          }
        }}
        triggerNotification={triggerNotification}
      />

      <FestivalLineupEditorModal
        isOpen={Boolean(lineupModalEntity)}
        onClose={() => {
          setLineupModalEntity(null);
          setLineupModalEditionId(undefined);
        }}
        entity={lineupModalEntity}
        initialEditionId={lineupModalEditionId}
        onSaved={() => {
          refreshEntities();
        }}
        triggerNotification={triggerNotification}
      />
    </div>
  );
};

export default AffiliatedEntitiesSection;
