import { Geolocation, PermissionStatus } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';

export interface GeoCoords {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

/**
 * Requests location permissions natively via Capacitor on Android/iOS APKs,
 * or checks/requests via browser API when running on the web.
 */
export async function requestLocationPermission(): Promise<PermissionStatus | null> {
  try {
    if (Capacitor.isPluginAvailable('Geolocation')) {
      const permission = await Geolocation.requestPermissions();
      console.log('Location permission status:', permission);
      return permission;
    }
  } catch (error) {
    console.warn('Capacitor Geolocation.requestPermissions error or not available:', error);
  }
  return null;
}

/**
 * Checks the current location permission state.
 */
export async function checkLocationPermission(): Promise<PermissionStatus | null> {
  try {
    if (Capacitor.isPluginAvailable('Geolocation')) {
      const status = await Geolocation.checkPermissions();
      return status;
    }
  } catch (error) {
    console.warn('Capacitor Geolocation.checkPermissions error:', error);
  }
  return null;
}

/**
 * Robust cross-platform coordinate acquisition:
 * Prioritizes native Capacitor Geolocation (ensuring Android OS runtime permissions),
 * and seamlessly falls back to HTML5 navigator.geolocation in browsers.
 */
export async function getCurrentCoordinates(options?: {
  enableHighAccuracy?: boolean;
  timeout?: number;
}): Promise<GeoCoords | null> {
  // 1. Native Capacitor Geolocation for Android APK / iOS
  try {
    if (Capacitor.isPluginAvailable('Geolocation')) {
      await requestLocationPermission();
      const pos = await Geolocation.getCurrentPosition({
        enableHighAccuracy: options?.enableHighAccuracy ?? true,
        timeout: options?.timeout ?? 10000
      });
      if (pos && pos.coords) {
        return {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy
        };
      }
    }
  } catch (nativeErr) {
    console.warn('[locationService] Capacitor native geolocation fallback:', nativeErr);
  }

  // 2. Standard Web Browser HTML5 Geolocation fallback
  if (typeof navigator !== 'undefined' && navigator.geolocation) {
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        (error) => {
          console.warn('[locationService] Browser navigator.geolocation error:', error.message);
          resolve(null);
        },
        {
          enableHighAccuracy: options?.enableHighAccuracy ?? true,
          timeout: options?.timeout ?? 10000,
          maximumAge: 60000
        }
      );
    });
  }

  return null;
}
