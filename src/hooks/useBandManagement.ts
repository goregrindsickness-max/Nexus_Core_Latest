import React, { useState, useEffect, useRef } from 'react';
import { uploadBase64ToStorage, uploadCommunityBandMedia, getSupabase, executeWithSchemaResilience, sanitizeBandPayload, upsertBandToDatabase, verifyAndResyncBandLogo } from '../supabase';

interface UseBandManagementParams {
  activeBand: any;
  setBands: React.Dispatch<React.SetStateAction<any[]>>;
  userProfile: any;
  setUserProfile: React.Dispatch<React.SetStateAction<any>>;
  triggerNotification?: (msg: string) => void;
  addLog?: (msg: string) => void;
  editingBand?: any;
  setEditingBand?: (band: any) => void;
}

export function useBandManagement({
  activeBand,
  setBands,
  userProfile,
  setUserProfile,
  triggerNotification,
  addLog,
  editingBand,
  setEditingBand
}: UseBandManagementParams) {
  const [newBandForm, setNewBandForm] = useState({
    name: '',
    genre: '',
    logo_url: '',
    is_managed_client: false,
    management_role: 'tour_manager' as 'tour_manager' | 'booking_agent' | 'executive_producer' | 'owner',
    management_commission_pct: 15,
    management_day_rate: 250,
    executive_contact_name: userProfile?.name || 'Miguel (@bdmCEO)',
    executive_contact_email: userProfile?.email || 'goregrindsickness@gmail.com',
    executive_contact_phone: '',
    client_roster_notes: ''
  });

  const [customLogoPreset, setCustomLogoPreset] = useState(0);
  const logoPresets = [
    'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=120',
    'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=120',
    'https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=120',
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=120',
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=120',
    'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=120'
  ];

  // Roster Editing & Deleting State
  const [editName, setEditName] = useState('');
  const [editGenre, setEditGenre] = useState('');
  const [editLogoUrl, setEditLogoUrl] = useState('');
  const [editLogoPresetIdx, setEditLogoPresetIdx] = useState(-1);
  const [editIsManagedClient, setEditIsManagedClient] = useState(false);
  const [editManagementRole, setEditManagementRole] = useState<'tour_manager' | 'booking_agent' | 'executive_producer' | 'owner'>('tour_manager');
  const [editCommissionPct, setEditCommissionPct] = useState(15);
  const [editDayRate, setEditDayRate] = useState(250);
  const [editExecutiveContactName, setEditExecutiveContactName] = useState('');
  const [editExecutiveContactEmail, setEditExecutiveContactEmail] = useState('');
  const [editExecutiveContactPhone, setEditExecutiveContactPhone] = useState('');
  const [editClientRosterNotes, setEditClientRosterNotes] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const rosterFileInputRef = useRef<HTMLInputElement | null>(null);
  const editRosterFileInputRef = useRef<HTMLInputElement | null>(null);

  // Band Information edit states
  const [bandInfoName, setBandInfoName] = useState('');
  const [bandInfoHomebase, setBandInfoHomebase] = useState('');
  const [bandInfoFoundedYear, setBandInfoFoundedYear] = useState('');
  const [bandInfoBio, setBandInfoBio] = useState('');
  const [bandInfoCustomSlug, setBandInfoCustomSlug] = useState('');
  const [bandInfoBookingEmail, setBandInfoBookingEmail] = useState('');
  const [bandInfoBookingPhone, setBandInfoBookingPhone] = useState('');
  const [bandInfoYoutubeVideo, setBandInfoYoutubeVideo] = useState('');
  const [bandInfoStreamingUrl, setBandInfoStreamingUrl] = useState('');
  const [bandInfoTechRider, setBandInfoTechRider] = useState('');
  const [bandInfoTourVehicle, setBandInfoTourVehicle] = useState('');
  const [bandInfoMetalArchivesUrl, setBandInfoMetalArchivesUrl] = useState('');
  const [selectedMicroGenres, setSelectedMicroGenres] = useState<string[]>([]);
  const [bandLogoUrl, setBandLogoUrl] = useState('');
  const [bandCoverUrl, setBandCoverUrl] = useState('');

  const [logoUploaderDragActive, setLogoUploaderDragActive] = useState(false);
  const [coverUploaderDragActive, setCoverUploaderDragActive] = useState(false);
  const bandInfoLogoFileInputRef = useRef<HTMLInputElement | null>(null);
  const bandInfoCoverFileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (activeBand) {
      setBandInfoName(activeBand.name || '');
      setBandInfoHomebase(activeBand.homebase || '');
      setBandInfoFoundedYear(activeBand.founded_year || '');
      setBandInfoBio(activeBand.bio || '');
      setBandInfoCustomSlug(activeBand.custom_slug || '');
      setBandInfoBookingEmail(activeBand.booking_email || '');
      setBandInfoBookingPhone(activeBand.booking_phone || '');
      setBandInfoYoutubeVideo(activeBand.featured_youtube_url || '');
      setBandInfoStreamingUrl(activeBand.streaming_url || '');
      setBandInfoTechRider(activeBand.tech_rider_url || '');
      setBandInfoTourVehicle(activeBand.tour_vehicle || '');
      setBandInfoMetalArchivesUrl(activeBand.metal_archives_url || '');
      const parsedGenres = Array.isArray(activeBand.micro_genres) 
        ? activeBand.micro_genres 
        : (activeBand.genre ? activeBand.genre.split(' / ').filter((g: string) => g !== 'Alternative') : []);
      setSelectedMicroGenres(parsedGenres);
      setBandLogoUrl(activeBand.logo_url || '');
      setBandCoverUrl(activeBand.cover_url || '');
    }
  }, [activeBand]);

  const compressLogoImage = (dataUrl: string, maxDimension: number, callback: (compressed: string) => void) => {
    const img = document.createElement('img');
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width <= 0 || height <= 0) {
          callback(dataUrl);
          return;
        }

        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        if (width <= 0 || height <= 0) {
          callback(dataUrl);
          return;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);
          try {
            const compressedUrl = canvas.toDataURL('image/webp', 0.92);
            callback(compressedUrl);
          } catch (e) {
            callback(dataUrl);
          }
        } else {
          callback(dataUrl);
        }
      } catch (err) {
        console.error('Logo compression failed:', err);
        callback(dataUrl);
      }
    };
    img.onerror = () => {
      callback(dataUrl);
    };
    img.src = dataUrl;
  };

  const handleBandInfoLogoUpload = (file: File) => {
    if (file.size > 20 * 1024 * 1024) {
      triggerNotification?.('Please upload a smaller image (under 20MB).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        compressLogoImage(dataUrl, 400, async (compressedUrl) => {
          try {
            const bandIdToUse = activeBand?.id || 'band';
            triggerNotification?.('⏳ Storing logo in community-bands bucket...');
            const publicUrl = await uploadCommunityBandMedia(compressedUrl, bandIdToUse, 'logo');
            if (publicUrl && !publicUrl.startsWith('data:')) {
              setBandLogoUrl(publicUrl);
              verifyAndResyncBandLogo(publicUrl, activeBand?.id);
              if (activeBand?.id) {
                localStorage.setItem(`nexus_core_band_logo_${activeBand.id}`, publicUrl);
              }
              const updated = { 
                ...activeBand, 
                logo_url: publicUrl, 
                avatar_url: publicUrl, 
                avatar: publicUrl, 
                image: publicUrl 
              };
              setBands(prev => prev.map(b => b.id === activeBand?.id ? updated : b));
              
              if (activeBand?.id) {
                await upsertBandToDatabase(updated);
              }
              triggerNotification?.('✨ Band logo stored in community-bands bucket & synced!');
            } else {
              triggerNotification?.('⚠️ Failed to store logo.');
            }
          } catch (err) {
            console.error('Failed to upload logo:', err);
            triggerNotification?.('⚠️ Failed to upload logo.');
          }
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleBandInfoCoverUpload = (file: File) => {
    if (file.size > 20 * 1024 * 1024) {
      triggerNotification?.('Please upload a smaller image (under 20MB).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        compressLogoImage(dataUrl, 1000, async (compressedUrl) => {
          try {
            const bandIdToUse = activeBand?.id || 'band';
            triggerNotification?.('⏳ Storing cover banner in community-bands bucket...');
            const publicUrl = await uploadCommunityBandMedia(compressedUrl, bandIdToUse, 'cover');
            if (publicUrl && !publicUrl.startsWith('data:')) {
              setBandCoverUrl(publicUrl);
              const updated = { ...activeBand, cover_url: publicUrl };
              setBands(prev => prev.map(b => b.id === activeBand?.id ? updated : b));
              
              if (activeBand?.id) {
                await upsertBandToDatabase(updated);
              }
              triggerNotification?.('✨ Band cover banner stored in community-bands bucket & synced!');
            } else {
              triggerNotification?.('⚠️ Failed to store cover banner in community-bands bucket.');
            }
          } catch (err) {
            console.error('Failed to upload cover:', err);
            triggerNotification?.('⚠️ Failed to upload cover.');
          }
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleLogoUpload = (file: File, isEdit: boolean) => {
    if (file.size > 20 * 1024 * 1024) {
      triggerNotification?.('Please upload a smaller image (under 20MB).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        triggerNotification?.('Compressing logo image...');
        compressLogoImage(dataUrl, 400, async (compressedUrl) => {
          try {
            triggerNotification?.('⏳ Storing logo in community-bands bucket...');
            const userProfileId = userProfile?.id || editingBand?.creator_id || 'profile_anonymous';
            const publicUrl = await uploadBase64ToStorage(compressedUrl, 'community-bands', userProfileId, 'band-logo');
            const finalLogo = (publicUrl && !publicUrl.startsWith('data:')) ? publicUrl : publicUrl;
            if (isEdit) {
              setEditLogoUrl(finalLogo);
              setEditLogoPresetIdx(-1);
            } else {
              setNewBandForm(prev => ({ ...prev, logo_url: finalLogo }));
              setCustomLogoPreset(-1); // Deselect preset
            }
            triggerNotification?.('✨ Band logo uploaded and stored in community-bands bucket!');
          } catch (err) {
            console.error('Failed to upload logo:', err);
            triggerNotification?.('⚠️ Failed to upload logo.');
          }
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateBand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBand) return;
    if (!editName.trim()) {
      triggerNotification?.('Artist name is required.');
      return;
    }

    let updatedLogo = editLogoUrl || (editLogoPresetIdx >= 0 ? logoPresets[editLogoPresetIdx] : editingBand?.logo_url);
    if (updatedLogo && updatedLogo.startsWith('data:')) {
      try {
        const userProfileId = userProfile?.id || editingBand?.creator_id || 'profile_anonymous';
        const publicUrl = await uploadBase64ToStorage(updatedLogo, 'community-bands', userProfileId, 'band-logo');
        if (publicUrl && !publicUrl.startsWith('data:')) {
          updatedLogo = publicUrl;
        }
      } catch (err) {
        console.warn('Failed to upload logo in handleUpdateBand:', err);
      }
    }

    const updatedBandObj = {
      ...editingBand,
      name: editName.trim(),
      band_name: editName.trim(),
      genre: editGenre.trim() || '',
      logo_url: updatedLogo || '',
      is_managed_client: editIsManagedClient,
      management_role: editManagementRole,
      management_commission_pct: editCommissionPct,
      management_day_rate: editDayRate,
      executive_contact_name: editExecutiveContactName,
      executive_contact_email: editExecutiveContactEmail,
      executive_contact_phone: editExecutiveContactPhone,
      client_roster_notes: editClientRosterNotes
    };

    setBands(prev => prev.map(b => b.id === editingBand.id ? updatedBandObj : b));

    try {
      if (editingBand.id) {
        await upsertBandToDatabase(updatedBandObj);
      }
    } catch (err) {
      console.warn('Failed to sync updated band to Supabase:', err);
    }

    addLog?.(`Updated details for managed artist: ${editName.trim()}`);
    triggerNotification?.(`Updated profile: ${editName.trim()}`);
    setEditingBand?.(null);
  };

  return {
    newBandForm,
    setNewBandForm,
    customLogoPreset,
    setCustomLogoPreset,
    logoPresets,
    editName,
    setEditName,
    editGenre,
    setEditGenre,
    editLogoUrl,
    setEditLogoUrl,
    editLogoPresetIdx,
    setEditLogoPresetIdx,
    editIsManagedClient,
    setEditIsManagedClient,
    editManagementRole,
    setEditManagementRole,
    editCommissionPct,
    setEditCommissionPct,
    editDayRate,
    setEditDayRate,
    editExecutiveContactName,
    setEditExecutiveContactName,
    editExecutiveContactEmail,
    setEditExecutiveContactEmail,
    editExecutiveContactPhone,
    setEditExecutiveContactPhone,
    editClientRosterNotes,
    setEditClientRosterNotes,
    dragActive,
    setDragActive,
    rosterFileInputRef,
    editRosterFileInputRef,
    bandInfoName,
    setBandInfoName,
    bandInfoHomebase,
    setBandInfoHomebase,
    bandInfoFoundedYear,
    setBandInfoFoundedYear,
    bandInfoBio,
    setBandInfoBio,
    bandInfoCustomSlug,
    setBandInfoCustomSlug,
    bandInfoBookingEmail,
    setBandInfoBookingEmail,
    bandInfoBookingPhone,
    setBandInfoBookingPhone,
    bandInfoYoutubeVideo,
    setBandInfoYoutubeVideo,
    bandInfoStreamingUrl,
    setBandInfoStreamingUrl,
    bandInfoTechRider,
    setBandInfoTechRider,
    bandInfoTourVehicle,
    setBandInfoTourVehicle,
    bandInfoMetalArchivesUrl,
    setBandInfoMetalArchivesUrl,
    selectedMicroGenres,
    setSelectedMicroGenres,
    bandLogoUrl,
    setBandLogoUrl,
    bandCoverUrl,
    setBandCoverUrl,
    logoUploaderDragActive,
    setLogoUploaderDragActive,
    coverUploaderDragActive,
    setCoverUploaderDragActive,
    bandInfoLogoFileInputRef,
    bandInfoCoverFileInputRef,
    handleBandInfoLogoUpload,
    handleBandInfoCoverUpload,
    compressLogoImage,
    handleLogoUpload,
    handleUpdateBand
  };
}
