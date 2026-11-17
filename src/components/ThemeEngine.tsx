import React, { createContext, useContext, useState, useEffect } from 'react';

export type FrequencyType = 'Extreme Metal' | 'Electronic/Synth' | 'Hip-Hop/Underground' | 'Indie/Alternative';

export interface ThemeConfig {
  canvasBg: string;
  accentOne: string;
  accentTwo: string;
  textColor: string;
  borderColor: string;
  cardBg: string;
  reticleOpacity: number;
}

export const THEME_PRESETS: Record<FrequencyType, ThemeConfig> = {
  'Extreme Metal': {
    canvasBg: '#000000',
    accentOne: '#8A2BE2', // Neon Purple
    accentTwo: '#39FF14', // Toxic Green
    textColor: '#f3f4f6',
    borderColor: 'rgba(138, 43, 226, 0.3)',
    cardBg: '#050505',
    reticleOpacity: 0.25,
  },
  'Electronic/Synth': {
    canvasBg: '#020208',
    accentOne: '#00F0FF', // High-Voltage Cyan
    accentTwo: '#FF007F', // Magenta
    textColor: '#f8fafc',
    borderColor: 'rgba(0, 240, 255, 0.3)',
    cardBg: '#050512',
    reticleOpacity: 0.3,
  },
  'Hip-Hop/Underground': {
    canvasBg: '#070602',
    accentOne: '#FFBF00', // Raw Amber
    accentTwo: '#D4AF37', // Brushed Gold
    textColor: '#fafaf9',
    borderColor: 'rgba(255, 191, 0, 0.3)',
    cardBg: '#0d0c07',
    reticleOpacity: 0.2,
  },
  'Indie/Alternative': {
    canvasBg: '#2F4F4F', // Dark Slate Gray
    accentOne: '#F5F5F5', // Minimalist Chalk White
    accentTwo: '#9ca3af', // Gray accent
    textColor: '#f9fafb',
    borderColor: 'rgba(245, 245, 245, 0.25)',
    cardBg: '#243e3e',
    reticleOpacity: 0.15,
  }
};

interface ThemeContextType {
  activeFrequency: FrequencyType;
  setActiveFrequency: (freq: FrequencyType) => void;
  theme: ThemeConfig;
  genreMap: Record<string, string>;
  mapTagsToCategories: (tags: string[]) => Record<string, number>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const GENRE_MAP: Record<string, string> = {
  'brutal_death_metal': 'Extreme Metal',
  'grindcore': 'Extreme Metal',
  'slam': 'Extreme Metal',
  'deathcore': 'Extreme Metal',
  'black_metal': 'Extreme Metal',
  'hardcore': 'Extreme Metal',
  'blackened': 'Extreme Metal',
  'death_thrash': 'Extreme Metal',
  'symphonic_black': 'Extreme Metal',
  'melodic_death': 'Extreme Metal',
  'slamming_bdm': 'Extreme Metal',
  'deathgrind': 'Extreme Metal',
  'power_metal': 'Extreme Metal',
  
  'synthwave': 'Electronic/Synth',
  'noise': 'Electronic/Synth',
  'industrial': 'Electronic/Synth',
  'electronic': 'Electronic/Synth',
  'cyberpunk': 'Electronic/Synth',
  'new_wave': 'Electronic/Synth',
  
  'underground_hip_hop': 'Hip-Hop/Underground',
  'trap': 'Hip-Hop/Underground',
  'boom_bap': 'Hip-Hop/Underground',
  'phonk': 'Hip-Hop/Underground',
  
  'indie_alternative': 'Indie/Alternative',
  'shoegaze': 'Indie/Alternative',
  'post_punk': 'Indie/Alternative',
  'grunge': 'Indie/Alternative',
  'alt_rock': 'Indie/Alternative'
};

export const ThemeProvider: React.FC<{ children: React.ReactNode; userProfile?: any }> = ({ children, userProfile }) => {
  const [activeFrequency, setActiveFrequencyState] = useState<FrequencyType>(() => {
    // Attempt local storage resolution first
    try {
      const saved = localStorage.getItem('nexus_core_user_profile');
      if (saved) {
        const u = JSON.parse(saved);
        if (u?.creative_metadata?.primary_frequency) {
          return u.creative_metadata.primary_frequency as FrequencyType;
        }
        if (u?.genre_tags?.length) {
          for (const tag of u.genre_tags) {
            const mapped = GENRE_MAP[tag.toLowerCase()];
            if (mapped) return mapped as FrequencyType;
          }
        }
      }
    } catch (_) {}

    if (userProfile?.creative_metadata?.primary_frequency) {
      return userProfile?.creative_metadata.primary_frequency as FrequencyType;
    }
    // Infer from user tags if matching
    if (userProfile?.genre_tags?.length) {
      for (const tag of userProfile?.genre_tags) {
        const mapped = GENRE_MAP[tag.toLowerCase()];
        if (mapped) return mapped as FrequencyType;
      }
    }
    try {
      const savedFreq = localStorage.getItem('nexus_core_active_frequency');
      if (savedFreq) return savedFreq as FrequencyType;
    } catch (_) {}
    return 'Extreme Metal';
  });

  const setActiveFrequency = (freq: FrequencyType) => {
    setActiveFrequencyState(freq);
    // Persist in localStorage and update runtime profile if needed
    try {
      localStorage.setItem('nexus_core_active_frequency', freq);
    } catch (_) {}
  };

  useEffect(() => {
    if (userProfile?.creative_metadata?.primary_frequency) {
      setActiveFrequencyState(userProfile?.creative_metadata.primary_frequency as FrequencyType);
    }
  }, [userProfile?.creative_metadata?.primary_frequency]);

  const theme = THEME_PRESETS[activeFrequency] || THEME_PRESETS['Extreme Metal'];

  // Dynamic CSS Variables injector
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--canvas-bg', theme.canvasBg);
    root.style.setProperty('--accent-one', theme.accentOne);
    root.style.setProperty('--accent-two', theme.accentTwo);
    root.style.setProperty('--text-color', theme.textColor);
    root.style.setProperty('--border-color', theme.borderColor);
    root.style.setProperty('--card-bg', theme.cardBg);
    
    // Inject custom inline style to override container backgrounds if needed
    const styleId = 'nexus-dynamic-theme-style';
    let styleEl = document.getElementById(styleId);
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = `
      .theme-bg-canvas { background-color: ${theme.canvasBg} !important; }
      .theme-text-accent1 { color: ${theme.accentOne} !important; }
      .theme-text-accent2 { color: ${theme.accentTwo} !important; }
      .theme-border-accent1 { border-color: ${theme.accentOne} !important; }
      .theme-border-accent2 { border-color: ${theme.accentTwo} !important; }
      .theme-bg-card { background-color: ${theme.cardBg} !important; }
      .theme-border-custom { border-color: ${theme.borderColor} !important; }
      #root { background-color: ${theme.canvasBg} !important; }
      body { background-color: ${theme.canvasBg} !important; }
    `;
  }, [theme]);

  const mapTagsToCategories = (tags: string[]): Record<string, number> => {
    if (!tags || tags.length === 0) return {};
    const counts: Record<string, number> = {};
    let total = 0;
    tags.forEach(t => {
      const parent = GENRE_MAP[t.toLowerCase()];
      if (parent) {
        counts[parent] = (counts[parent] || 0) + 1;
        total++;
      }
    });

    // Convert to percentages
    const report: Record<string, number> = {};
    if (total > 0) {
      Object.keys(counts).forEach(k => {
        report[k] = Math.round((counts[k] / total) * 100);
      });
    }
    return report;
  };

  return (
    <ThemeContext.Provider value={{ activeFrequency, setActiveFrequency, theme, genreMap: GENRE_MAP, mapTagsToCategories }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
