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
import android.webkit.CookieManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import androidx.core.content.ContextCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private boolean isAudioInterruptionReceiverRegistered = false;

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
                        bridge.getWebView().evaluateJavascript(
                            "window.dispatchEvent(new CustomEvent('nexus_native_audio_interruption', { detail: { action: 'resume' } }));",
                            null
                        );
                    }
                }
            });
        }
    };

    public class NativeAudioBridge {
        @JavascriptInterface
        public void startForegroundAudio(String title, String artist, String genre) {
            try {
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
                    // Crucial: allow media playback without requiring direct user gesture per track transition
                    settings.setMediaPlaybackRequiresUserGesture(false);
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
                    }
                }

                // Register native audio bridge into JavaScript window.NexusNativeAudio
                webView.addJavascriptInterface(new NativeAudioBridge(), "NexusNativeAudio");
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        // Request Notification Permission on Android 13+ (API 33+) for persistent foreground service notifications
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (checkSelfPermission(android.Manifest.permission.POST_NOTIFICATIONS) != android.content.pm.PackageManager.PERMISSION_GRANTED) {
                requestPermissions(new String[]{android.Manifest.permission.POST_NOTIFICATIONS}, 101);
            }
        }

        // Register interruption receivers for headphones disconnect & audio focus events using ContextCompat
        IntentFilter filter = new IntentFilter();
        filter.addAction("com.nexus.core.AUDIO_INTERRUPTION_PAUSE");
        filter.addAction("com.nexus.core.AUDIO_INTERRUPTION_RESUME");
        ContextCompat.registerReceiver(this, audioInterruptionReceiver, filter, ContextCompat.RECEIVER_NOT_EXPORTED);
        isAudioInterruptionReceiverRegistered = true;
    }

    @Override
    public void onPause() {
        super.onPause();
        // Ensure WebView continues executing JavaScript audio streaming when backgrounded or locked
        if (this.bridge != null && this.bridge.getWebView() != null) {
            this.bridge.getWebView().onResume();
        }
    }

    @Override
    public void onStop() {
        super.onStop();
        // Ensure WebView continues running in background/lockscreen
        if (this.bridge != null && this.bridge.getWebView() != null) {
            this.bridge.getWebView().onResume();
        }
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
