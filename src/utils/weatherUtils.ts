import { Show } from '../types';

export interface ShowWeatherWarning {
  type: 'STORM' | 'COLD' | 'HEAT' | 'WIND' | 'INFO';
  severity: 'SEVERE' | 'WARNING' | 'ADVISORY' | 'INFO';
  title: string;
  description: string;
  color: string;
  badgeColor: string;
}

export interface ShowWeather {
  temp: number;
  conditions: string;
  windSpeed: number;
  humidity: number;
  isOutdoor: boolean;
  warnings: ShowWeatherWarning[];
}

export const getShowWeatherAndWarnings = (show: Show): ShowWeather => {
  const city = show.city || show.name || "Fort Wayne";
  const showName = (show.festival_name || show.name || '').toLowerCase();
  const isOutdoor = !!show.festival_name || 
                     showName.includes('festival') || 
                     showName.includes('fest') || 
                     showName.includes('park') || 
                     showName.includes('lawn') || 
                     showName.includes('stadium') || 
                     showName.includes('field') || 
                     showName.includes('amphitheater') || 
                     showName.includes('fair') || 
                     showName.includes('outdoor') || 
                     showName.includes('riot');

  // Deterministic seed based on city name + show ID/date to make each stop's weather unique but persistent
  const seedString = `${city}-${show.date || '2026-07-03'}-${show.id || ''}`;
  const sum = seedString.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // Parse date month to adjust temperature for winter/summer
  let month = 6; // default June
  if (show.date) {
    const parts = show.date.split('-');
    if (parts.length >= 2) {
      month = parseInt(parts[1], 10);
    }
  }

  // Base temperature depending on month
  let baseTemp = 65;
  if ([11, 12, 1, 2].includes(month)) {
    baseTemp = 24 + (sum % 18); // 24°F to 42°F
  } else if ([6, 7, 8].includes(month)) {
    baseTemp = 75 + (sum % 20); // 75°F to 95°F
  } else {
    baseTemp = 48 + (sum % 22); // 48°F to 70°F
  }

  let conditions = 'Partly Cloudy';
  let windSpeed = 4 + (sum % 18); // 4 to 22 mph
  let humidity = 40 + (sum % 50); // 40% to 90%

  const conditionPools = {
    winter: ['Heavy Snow', 'Blizzard Conditions', 'Freezing Rain', 'Overcast', 'Clear & Freezing', 'Chilly Wind'],
    summer: ['Sunny & Clear', 'Extreme Heat Warning', 'Severe Thunderstorms', 'Passing Showers', 'Humid & Overcast', 'Breezy & Sunny'],
    normal: ['Partly Cloudy', 'Sunny & Warm', 'Clear Skies', 'Mild & Overcast', 'Breezy & Cool', 'Steady Rain']
  };

  if ([11, 12, 1, 2].includes(month)) {
    conditions = conditionPools.winter[sum % conditionPools.winter.length];
  } else if ([6, 7, 8].includes(month)) {
    conditions = conditionPools.summer[sum % conditionPools.summer.length];
  } else {
    conditions = conditionPools.normal[sum % conditionPools.normal.length];
  }

  const warnings: ShowWeatherWarning[] = [];

  // 1. Extreme Winter Cold / Blizzard Warning
  if (baseTemp < 32 && (conditions.toLowerCase().includes('snow') || conditions.toLowerCase().includes('blizzard') || conditions.toLowerCase().includes('freezing'))) {
    warnings.push({
      type: 'COLD',
      severity: 'SEVERE',
      title: '❄️ Blizzard & Ice Hazard Warning',
      description: 'Severe travel risk for tour bus and equipment semi-trailers. Protect water systems and gear from sub-freezing temperatures.',
      color: 'border-red-500/30 bg-red-950/20 text-red-400',
      badgeColor: 'bg-red-500/20 text-red-400 border-red-500/40'
    });
  } else if (baseTemp < 38) {
    warnings.push({
      type: 'COLD',
      severity: 'WARNING',
      title: '🥶 Extreme Winter Cold Advisory',
      description: 'Temperatures below freezing. Road freeze risk during overnight hauls. Monitor trailer heater status and load-in freeze alerts.',
      color: 'border-blue-500/30 bg-blue-950/20 text-blue-400',
      badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/40'
    });
  }

  // 2. High Wind Warning
  if (windSpeed > 15) {
    if (isOutdoor) {
      warnings.push({
        type: 'WIND',
        severity: 'SEVERE',
        title: '💨 Severe Gale Stage Hazard',
        description: `High winds of ${windSpeed}mph forecast. Extreme safety risk for outdoor festival stage canvas, banner rigging, and line-array PA hangs. Secure all loose hardware!`,
        color: 'border-amber-500/30 bg-amber-950/20 text-amber-400',
        badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/40'
      });
    } else {
      warnings.push({
        type: 'WIND',
        severity: 'ADVISORY',
        title: '🌬️ High Wind Advisory',
        description: `Wind gusts up to ${windSpeed}mph. Potential trailer sway on open interstate routes. Exercise caution while driving.`,
        color: 'border-zinc-500/30 bg-zinc-950/20 text-zinc-400',
        badgeColor: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/40'
      });
    }
  }

  // 3. Severe Storms & Lightning Warning
  if (conditions.toLowerCase().includes('thunderstorms') || conditions.toLowerCase().includes('rain') || conditions.toLowerCase().includes('storm')) {
    if (isOutdoor) {
      warnings.push({
        type: 'STORM',
        severity: 'SEVERE',
        title: '⛈️ Lightning & Heavy Storm Danger',
        description: 'Severe thunderstorm threat. Outdoor event risk. Prepare stage evacuation protocols and line-array power isolation checklists.',
        color: 'border-red-500/30 bg-red-950/20 text-red-400 font-bold',
        badgeColor: 'bg-red-500/20 text-red-400 border-red-500/40'
      });
    } else {
      warnings.push({
        type: 'STORM',
        severity: 'WARNING',
        title: '🌧️ Heavy Rain Warning',
        description: 'Flooding risk in local low-lying venue entrance/load-in zones. Expect loading dock delay. Keep sensitive cables off ground.',
        color: 'border-amber-500/30 bg-amber-950/20 text-amber-400',
        badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/40'
      });
    }
  }

  // 4. Heat Warnings
  if (baseTemp > 88) {
    warnings.push({
      type: 'HEAT',
      severity: 'WARNING',
      title: '🔥 Extreme Heat Advisory',
      description: `High temp of ${baseTemp}°F. Outdoor stage thermal load alert: protect amplifiers and lighting ballasts from overheating. Crew hydration priority.`,
      color: 'border-orange-500/30 bg-orange-950/20 text-orange-400',
      badgeColor: 'bg-orange-500/20 text-orange-400 border-orange-500/40'
    });
  }

  // 5. Outdoor Venue general notices
  if (isOutdoor && warnings.length === 0) {
    warnings.push({
      type: 'INFO',
      severity: 'INFO',
      title: '🎪 Outdoor Venue Operational Standard',
      description: 'Outdoor setting. Keep stage power distribution cables covered. Monitor hourly weather radar changes for wind or rain shifts.',
      color: 'border-[#00ffcc]/20 bg-[#00ffcc]/5 text-zinc-300',
      badgeColor: 'bg-[#00ffcc]/10 text-[#00ffcc] border-[#00ffcc]/30'
    });
  }

  return {
    temp: baseTemp,
    conditions,
    windSpeed,
    humidity,
    isOutdoor,
    warnings
  };
};
