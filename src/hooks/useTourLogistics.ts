import React, { useState, useEffect, useRef } from 'react';
import { getCurrentCoordinates } from '../services/locationService';

export function useTourLogistics() {
  // Navigation & Logistics Section States
  const [isWeatherForecastExpanded, setIsWeatherForecastExpanded] = useState<boolean>(false);
  const [customNavDestination, setCustomNavDestination] = useState<string>('');
  const [isWaypointsExpanded, setIsWaypointsExpanded] = useState<boolean>(false);
  const [isInteractiveMapExpanded, setIsInteractiveMapExpanded] = useState<boolean>(false);
  const [isFuelCalculatorExpanded, setIsFuelCalculatorExpanded] = useState<boolean>(false);
  const [isPreDriveChecklistExpanded, setIsPreDriveChecklistExpanded] = useState<boolean>(false);
  const [isDriverRotationExpanded, setIsDriverRotationExpanded] = useState<boolean>(false);

  // Fuel calculator specific states
  const [vehicleType, setVehicleType] = useState<'van' | 'bus' | 'car'>('van');
  const [fuelPrice, setFuelPrice] = useState<string>('3.89');
  const [customMpg, setCustomMpg] = useState<string>('12');

  // Driver Rotation specific states
  const [activeDriver, setActiveDriver] = useState<string>('Driver A (Guitarist)');
  const [driveHoursElapsed, setDriveHoursElapsed] = useState<number>(1.5);

  // Custom pre-drive checklist state
  const [checkedPreDriveItems, setCheckedPreDriveItems] = useState<Record<string, boolean>>({
    tires: true,
    trailer: true,
    instruments: true,
    merch: false,
    fluids: true,
    gps: true
  });

  // Waypoints state
  const [waypoints, setWaypoints] = useState<Array<{ id: string; name: string; type: string; distance: string }>>([
    { id: 'wp-1', name: 'Interstate Oasis / Rest Area', type: 'Rest Stop', distance: '45 mi' },
    { id: 'wp-2', name: 'Pilot Travel Center (Diesel & Coffee)', type: 'Fuel / Food', distance: '120 mi' }
  ]);
  const [newWaypointName, setNewWaypointName] = useState('');
  const [newWaypointType, setNewWaypointType] = useState('Rest Stop');

  // Real-time Geolocation Weather States & Fetcher
  const [localWeather, setLocalWeather] = useState<{
    temp: string;
    condition: string;
    wind: string;
    humidity: string;
    cityName: string;
    iconType: 'clear' | 'cloudy' | 'fog' | 'drizzle' | 'rain' | 'snow' | 'thunder' | 'unknown';
    forecast: { day: string; tempMax: string; tempMin: string; condition: string; iconType: string }[];
  } | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [currentCoords, setCurrentCoords] = useState<{ latitude: number; longitude: number } | null>(null);

  const fetchLocalWeather = async () => {
    setWeatherLoading(true);
    setWeatherError(null);

    const coords = await getCurrentCoordinates({ enableHighAccuracy: false, timeout: 8000 });
    if (!coords) {
      console.warn('Geolocation failed or permission denied, using fallback');
      setCurrentCoords({ latitude: 40.7128, longitude: -74.0060 });
      setWeatherError('Location access blocked');
      setWeatherLoading(false);
      return;
    }

    try {
      const { latitude, longitude } = coords;
      setCurrentCoords({ latitude, longitude });

          let cityNameStr = 'Current Location';
          try {
            const geoRes = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
            );
            if (geoRes.ok) {
              const geoData = await geoRes.json();
              const city = geoData.city || geoData.locality;
              const subdivision = geoData.principalSubdivision;
              if (city && subdivision) {
                cityNameStr = `${city}, ${subdivision}`;
              } else if (city) {
                cityNameStr = city;
              } else if (geoData.countryName) {
                cityNameStr = geoData.countryName;
              }
            }
          } catch (geoErr) {
            console.warn('Reverse geocoding fetch failed (maybe adblocker):', geoErr);
          }

          const weatherRes = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,weather_code&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto`
          );
          if (!weatherRes.ok) {
            throw new Error('Weather status not OK');
          }
          const weatherData = await weatherRes.json();
          if (weatherData && weatherData.current) {
            const current = weatherData.current;
            const tempVal = Math.round(current.temperature_2m);
            const relativeHumidity = Math.round(current.relative_humidity_2m || 0);
            const windSpeed = Math.round(current.wind_speed_10m || 0);
            const code = current.weather_code;

            let conditionStr = 'Clear Sky';
            let iconType: 'clear' | 'cloudy' | 'fog' | 'drizzle' | 'rain' | 'snow' | 'thunder' | 'unknown' = 'clear';

            if (code === 0) {
              conditionStr = 'Clear Sky';
              iconType = 'clear';
            } else if ([1, 2, 3].includes(code)) {
              conditionStr = 'Partly Cloudy';
              iconType = 'cloudy';
            } else if ([45, 48].includes(code)) {
              conditionStr = 'Foggy';
              iconType = 'fog';
            } else if ([51, 53, 55, 56, 57].includes(code)) {
              conditionStr = 'Drizzle';
              iconType = 'drizzle';
            } else if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
              conditionStr = 'Raining';
              iconType = 'rain';
            } else if ([71, 73, 75, 77, 85, 86].includes(code)) {
              conditionStr = 'Snowing';
              iconType = 'snow';
            } else if ([95, 96, 99].includes(code)) {
              conditionStr = 'Thunderstorm';
              iconType = 'thunder';
            }

            const forecastDays: { day: string; tempMax: string; tempMin: string; condition: string; iconType: string }[] = [];
            if (weatherData.daily && Array.isArray(weatherData.daily.time)) {
              for (let i = 0; i < Math.min(3, weatherData.daily.time.length); i++) {
                const fCode = weatherData.daily.weather_code[i];
                let fCondition = 'Clear';
                let fIcon = 'clear';
                if (fCode === 0) {
                  fCondition = 'Sunny';
                  fIcon = 'clear';
                } else if ([1, 2, 3].includes(fCode)) {
                  fCondition = 'Partly Cloudy';
                  fIcon = 'cloudy';
                } else if ([45, 48].includes(fCode)) {
                  fCondition = 'Foggy';
                  fIcon = 'fog';
                } else if ([51, 53, 55, 56, 57].includes(fCode)) {
                  fCondition = 'Drizzle';
                  fIcon = 'drizzle';
                } else if ([61, 63, 65, 66, 67, 80, 81, 82].includes(fCode)) {
                  fCondition = 'Rainy';
                  fIcon = 'rain';
                } else if ([71, 73, 75, 77, 85, 86].includes(fCode)) {
                  fCondition = 'Snowy';
                  fIcon = 'snow';
                } else if ([95, 96, 99].includes(fCode)) {
                  fCondition = 'Stormy';
                  fIcon = 'thunder';
                }

                const dateObj = new Date(weatherData.daily.time[i] + 'T00:00:00');
                const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });

                forecastDays.push({
                  day: dayName,
                  tempMax: `${Math.round(weatherData.daily.temperature_2m_max[i])}°F`,
                  tempMin: `${Math.round(weatherData.daily.temperature_2m_min[i])}°F`,
                  condition: fCondition,
                  iconType: fIcon
                });
              }
            }

            setLocalWeather({
              temp: `${tempVal}°F`,
              condition: conditionStr,
              wind: `${windSpeed} mph`,
              humidity: `${relativeHumidity}%`,
              cityName: cityNameStr,
              iconType,
              forecast: forecastDays
            });
            setWeatherError(null);
          } else {
            throw new Error('Fields missing');
          }
        } catch (err: any) {
          console.warn('Failed to parse weather fetch:', err.message);
          setWeatherError('Weather unavailable');
        } finally {
          setWeatherLoading(false);
        }
    };

  useEffect(() => {
    fetchLocalWeather();
  }, []);

  // Tour Status Box Auto-switching carousel states
  const [tourStatusIndex, setTourStatusIndex] = useState(0); // 0 = Countdown, 1 = Weather & Logistics, 2 = Core Crew Checklist
  const [isTourStatusPaused, setIsTourStatusPaused] = useState(false);
  const [isHoveringTourStatus, setIsHoveringTourStatus] = useState(false);
  const [lastInteractionTime, setLastInteractionTime] = useState<number>(Date.now());

  const registerTourStatusInteraction = () => {
    setLastInteractionTime(Date.now());
  };

  const touchStartXRef = useRef<number | null>(null);
  const touchEndXRef = useRef<number | null>(null);

  const handleStatusTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.targetTouches[0].clientX;
    touchEndXRef.current = e.targetTouches[0].clientX;
    setIsTourStatusPaused(true);
    registerTourStatusInteraction();
  };

  const handleStatusTouchMove = (e: React.TouchEvent) => {
    touchEndXRef.current = e.targetTouches[0].clientX;
    registerTourStatusInteraction();
  };

  const handleStatusTouchEnd = () => {
    registerTourStatusInteraction();
    if (touchStartXRef.current === null || touchEndXRef.current === null) {
      setIsTourStatusPaused(false);
      return;
    }
    const diffX = touchStartXRef.current - touchEndXRef.current;
    if (Math.abs(diffX) > 50) {
      if (diffX > 0) {
        setTourStatusIndex((prev) => (prev + 1) % 4);
      } else {
        setTourStatusIndex((prev) => (prev - 1 + 4) % 4);
      }
    }
    setIsTourStatusPaused(false);
    touchStartXRef.current = null;
    touchEndXRef.current = null;
  };

  return {
    isWeatherForecastExpanded,
    setIsWeatherForecastExpanded,
    customNavDestination,
    setCustomNavDestination,
    isWaypointsExpanded,
    setIsWaypointsExpanded,
    isInteractiveMapExpanded,
    setIsInteractiveMapExpanded,
    isFuelCalculatorExpanded,
    setIsFuelCalculatorExpanded,
    isPreDriveChecklistExpanded,
    setIsPreDriveChecklistExpanded,
    isDriverRotationExpanded,
    setIsDriverRotationExpanded,
    vehicleType,
    setVehicleType,
    fuelPrice,
    setFuelPrice,
    customMpg,
    setCustomMpg,
    activeDriver,
    setActiveDriver,
    driveHoursElapsed,
    setDriveHoursElapsed,
    checkedPreDriveItems,
    setCheckedPreDriveItems,
    waypoints,
    setWaypoints,
    newWaypointName,
    setNewWaypointName,
    newWaypointType,
    setNewWaypointType,
    localWeather,
    weatherLoading,
    weatherError,
    currentCoords,
    fetchLocalWeather,
    tourStatusIndex,
    setTourStatusIndex,
    isTourStatusPaused,
    setIsTourStatusPaused,
    isHoveringTourStatus,
    setIsHoveringTourStatus,
    lastInteractionTime,
    registerTourStatusInteraction,
    handleStatusTouchStart,
    handleStatusTouchMove,
    handleStatusTouchEnd
  };
}
