package com.nexus.core;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.PowerManager;
import android.provider.Settings;
import android.view.KeyEvent;
import android.webkit.CookieManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.GeolocationPermissions;
import android.webkit.WebChromeClient;
import androidx.activity.OnBackPressedCallback;
import androidx.core.content.ContextCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private boolean isAudioInterruptionReceiverRegistered = false;
    private static volatile boolean isAudioActive = false;
    private static final int REQUEST_LOCATION_PERMISSIONS = 101;
    private static final int REQUEST_NOTIFICATION_PERMISSIONS = 102;

    private final BroadcastReceiver audioInterruptionReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            if (intent == null || intent.getAction() == null) return;
            final String action = intent.getAction();

            runOnUiThread(() -> {
                if (bridge != null && bridge.getWebView() != null) {
                    if ("com.nexus.core.AUDIO_INTERRUPTION_PAUSE".equals(action)) {
                        bridge.getWebView().evaluateJavascript(
                            "window.dispatchEvent(new CustomEvent('nexus_native_audio_interruption', { detail: { action: 'pause' } }));",
                            null
                        );
                    } else if ("com.nexus.core.AUDIO_INTERRUPTION_RESUME".equals(action)) {
                        isAudioActive = true;
                        bridge.getWebView().evaluateJavascript(
                            "window.dispatchEvent(new CustomEvent('nexus_native_audio_interruption', { detail: { action: 'resume' } }));",
                            null
                        );
                    } else if ("com.nexus.core.AUDIO_CONTROL_NEXT".equals(action)) {
                        bridge.getWebView().evaluateJavascript(
                            "window.dispatchEvent(new CustomEvent('nexus_native_audio_interruption', { detail: { action: 'next' } }));",
                            null
                        );
                    } else if ("com.nexus.core.AUDIO_CONTROL_PREVIOUS".equals(action)) {
                        bridge.getWebView().evaluateJavascript(
                            "window.dispatchEvent(new CustomEvent('nexus_native_audio_interruption', { detail: { action: 'previous' } }));",
                            null
                        );
                    } else if ("com.nexus.core.AUDIO_CONTROL_STOP".equals(action)) {
                        isAudioActive = false;
                        bridge.getWebView().evaluateJavascript(
                            "window.dispatchEvent(new CustomEvent('nexus_native_audio_interruption', { detail: { action: 'stop' } }));",
                            null
                        );
                    }
                }
            });
        }
    };

    public class NativeAudioBridge {
        @JavascriptInterface
        public void setAudioActive(boolean active) {
            isAudioActive = active;
        }

        @JavascriptInterface
        public void startForegroundAudio(String title, String artist, String genre) {
            try {
                isAudioActive = true;
                Intent serviceIntent = new Intent(MainActivity.this, BackgroundAudioService.class);
                serviceIntent.setAction(BackgroundAudioService.ACTION_START);
                serviceIntent.putExtra(BackgroundAudioService.EXTRA_TRACK_TITLE, title);
                serviceIntent.putExtra(BackgroundAudioService.EXTRA_ARTIST, artist);
                serviceIntent.putExtra(BackgroundAudioService.EXTRA_GENRE, genre);

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    try {
                        startForegroundService(serviceIntent);
                    } catch (Exception ex) {
                        startService(serviceIntent);
                    }
                } else {
                    startService(serviceIntent);
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        }

        @JavascriptInterface
        public void updateMetadata(String title, String artist) {
            try {
                Intent serviceIntent = new Intent(MainActivity.this, BackgroundAudioService.class);
                serviceIntent.setAction(BackgroundAudioService.ACTION_UPDATE);
                serviceIntent.putExtra(BackgroundAudioService.EXTRA_TRACK_TITLE, title);
                serviceIntent.putExtra(BackgroundAudioService.EXTRA_ARTIST, artist);

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    try {
                        startForegroundService(serviceIntent);
                    } catch (Exception ex) {
                        startService(serviceIntent);
                    }
                } else {
                    startService(serviceIntent);
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        }

        @JavascriptInterface
        public void pauseForegroundAudio() {
            try {
                Intent serviceIntent = new Intent(MainActivity.this, BackgroundAudioService.class);
                serviceIntent.setAction(BackgroundAudioService.ACTION_PAUSE);
                startService(serviceIntent);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }

        @JavascriptInterface
        public void stopForegroundAudio() {
            try {
                isAudioActive = false;
                Intent serviceIntent = new Intent(MainActivity.this, BackgroundAudioService.class);
                serviceIntent.setAction(BackgroundAudioService.ACTION_STOP);
                startService(serviceIntent);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }

        @JavascriptInterface
        public void requestBatteryExemption() {
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
                    if (pm != null && !pm.isIgnoringBatteryOptimizations(getPackageName())) {
                        Intent intent = new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
                        intent.setData(Uri.parse("package:" + getPackageName()));
                        startActivity(intent);
                    }
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Configure CookieManager to accept third-party cookies for embedded players like Bandcamp
        try {
            CookieManager cookieManager = CookieManager.getInstance();
            cookieManager.setAcceptCookie(true);
            if (this.bridge != null && this.bridge.getWebView() != null) {
                cookieManager.setAcceptThirdPartyCookies(this.bridge.getWebView(), true);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        // Configure WebView settings to enable persistent background audio, Web Audio, and media playback
        try {
            if (this.bridge != null && this.bridge.getWebView() != null) {
                WebView webView = this.bridge.getWebView();
                WebSettings settings = webView.getSettings();
                if (settings != null) {
                    settings.setDomStorageEnabled(true);
                    settings.setJavaScriptEnabled(true);
                    settings.setAllowFileAccess(true);
                    settings.setAllowContentAccess(true);
                    settings.setDatabaseEnabled(true);
                    settings.setGeolocationEnabled(true);
                    // Crucial: allow media playback without requiring direct user gesture per track transition
                    settings.setMediaPlaybackRequiresUserGesture(false);
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
                    }
                }

                // Grant Geolocation permissions inside the WebView seamlessly
                webView.setWebChromeClient(new WebChromeClient() {
                    @Override
                    public void onGeolocationPermissionsShowPrompt(String origin, GeolocationPermissions.Callback callback) {
                        callback.invoke(origin, true, false);
                    }
                });

                // Register native audio bridge into JavaScript window.NexusNativeAudio
                webView.addJavascriptInterface(new NativeAudioBridge(), "NexusNativeAudio");
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        // Request Location permission first, followed sequentially by Notification permission
        requestStartupPermissions();

        // Support for Android 13+ (API 33+) Predictive Back / OnBackPressedDispatcher
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (isAudioActive) {
                    moveTaskToBack(true);
                } else {
                    setEnabled(false);
                    getOnBackPressedDispatcher().onBackPressed();
                }
            }
        });

        // Register interruption & control receivers for headset disconnect, audio focus & media notifications
        IntentFilter filter = new IntentFilter();
        filter.addAction("com.nexus.core.AUDIO_INTERRUPTION_PAUSE");
        filter.addAction("com.nexus.core.AUDIO_INTERRUPTION_RESUME");
        filter.addAction("com.nexus.core.AUDIO_CONTROL_NEXT");
        filter.addAction("com.nexus.core.AUDIO_CONTROL_PREVIOUS");
        filter.addAction("com.nexus.core.AUDIO_CONTROL_STOP");
        ContextCompat.registerReceiver(this, audioInterruptionReceiver, filter, ContextCompat.RECEIVER_NOT_EXPORTED);
        isAudioInterruptionReceiverRegistered = true;
    }

    private void requestStartupPermissions() {
        boolean fineLoc = checkSelfPermission(android.Manifest.permission.ACCESS_FINE_LOCATION) == android.content.pm.PackageManager.PERMISSION_GRANTED;
        boolean coarseLoc = checkSelfPermission(android.Manifest.permission.ACCESS_COARSE_LOCATION) == android.content.pm.PackageManager.PERMISSION_GRANTED;

        if (!fineLoc || !coarseLoc) {
            requestPermissions(new String[]{
                android.Manifest.permission.ACCESS_FINE_LOCATION,
                android.Manifest.permission.ACCESS_COARSE_LOCATION
            }, REQUEST_LOCATION_PERMISSIONS);
        } else {
            checkAndRequestNotificationPermission();
        }
    }

    private void checkAndRequestNotificationPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (checkSelfPermission(android.Manifest.permission.POST_NOTIFICATIONS) != android.content.pm.PackageManager.PERMISSION_GRANTED) {
                requestPermissions(new String[]{android.Manifest.permission.POST_NOTIFICATIONS}, REQUEST_NOTIFICATION_PERMISSIONS);
            }
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == REQUEST_LOCATION_PERMISSIONS) {
            // After location dialog concludes, immediately prompt for notifications on Android 13+
            checkAndRequestNotificationPermission();
        }
    }

    @Override
    public void onBackPressed() {
        // If background audio is active, move task to back instead of finishing/destroying Activity
        if (isAudioActive) {
            moveTaskToBack(true);
            return;
        }
        super.onBackPressed();
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_BACK && isAudioActive) {
            moveTaskToBack(true);
            return true;
        }
        return super.onKeyDown(keyCode, event);
    }

    @Override
    public void onResume() {
        super.onResume();
        if (this.bridge != null && this.bridge.getWebView() != null) {
            this.bridge.getWebView().resumeTimers();
        }
    }

    @Override
    public void onPause() {
        if (isAudioActive) {
            // Keep WebView timers and audio processing running in background
            if (this.bridge != null && this.bridge.getWebView() != null) {
                this.bridge.getWebView().resumeTimers();
            }
            return;
        }
        super.onPause();
    }

    @Override
    public void onStop() {
        if (isAudioActive) {
            // Prevent OS from halting active background audio playback
            if (this.bridge != null && this.bridge.getWebView() != null) {
                this.bridge.getWebView().resumeTimers();
            }
            return;
        }
        super.onStop();
    }

    @Override
    public void onDestroy() {
        if (isAudioInterruptionReceiverRegistered) {
            try {
                unregisterReceiver(audioInterruptionReceiver);
                isAudioInterruptionReceiverRegistered = false;
            } catch (Exception ignored) {}
        }
        super.onDestroy();
    }
}
