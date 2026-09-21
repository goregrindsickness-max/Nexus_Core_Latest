// Social network utility functions and helpers

export const isValidUUID = (str: string): boolean => {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
};

export const isValidUUIDLocal = (str: string): boolean => {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
};

export const getAvatarBorderColorClass = (role: string = ''): string => {
  const r = (role || '').toLowerCase();
  if (r.includes('fan')) {
    return 'border-2 border-[#00d2ff] shadow-[0_0_8px_rgba(0,210,255,0.5)]'; // Electric Blue
  }
  if (r.includes('industry') || r.includes('pro')) {
    return 'border-2 border-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]'; // Purple
  }
  if (r.includes('label')) {
    return 'border-2 border-[#ff6c00] shadow-[0_0_8px_rgba(255,108,0,0.6)]'; // Neon Orange
  }
  if (r.includes('band') || r.includes('artist')) {
    return 'border-2 border-[#39ff14] shadow-[0_0_8px_rgba(57,255,20,0.6)]'; // Neon Green
  }
  if (r.includes('promoter') || r.includes('venue')) {
    return 'border-2 border-[#f3ff00] shadow-[0_0_8px_rgba(243,255,0,0.6)]'; // Neon Yellow
  }
  if (r.includes('creative')) {
    return 'border-2 border-[#ff00ff] shadow-[0_0_8px_rgba(255,0,255,0.6)]'; // Magenta
  }
  return 'border border-zinc-800'; // fallback
};

export const getRoleBorderAndGlowClass = (role: string = ''): string => {
  const r = (role || '').toLowerCase();
  if (r === 'industry_pro' || r.includes('industry') || r.includes('pro')) {
    return 'border-2 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.7)]';
  }
  if (r === 'fan_only' || r.includes('fan')) {
    return 'border-2 border-[#00d2ff] shadow-[0_0_15px_rgba(0,210,255,0.7)]';
  }
  if (r === 'band' || r.includes('band') || r.includes('artist')) {
    return 'border-2 border-[#39ff14] shadow-[0_0_15px_rgba(57,255,20,0.7)]';
  }
  if (r === 'label' || r.includes('label')) {
    return 'border-2 border-[#ff6c00] shadow-[0_0_15px_rgba(255,108,0,0.7)]';
  }
  if (r === 'promoter' || r.includes('promoter') || r.includes('venue')) {
    return 'border-2 border-[#f3ff00] shadow-[0_0_15px_rgba(243,255,0,0.7)]';
  }
  if (r === 'creative' || r.includes('creative')) {
    return 'border-2 border-[#ff00ff] shadow-[0_0_15px_rgba(255,0,255,0.7)]';
  }
  return 'border-2 border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.7)]';
};

export const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 1200;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.82));
        } else {
          resolve(e.target?.result as string);
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};
