package com.nexus.core;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.ServiceInfo;
import android.media.AudioAttributes;
import android.media.AudioFormat;
import android.media.AudioManager;
import android.media.AudioTrack;
import android.media.MediaMetadata;
import android.media.session.MediaSession;
import android.media.session.PlaybackState;
import android.net.wifi.WifiManager;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;
import android.os.SystemClock;
import android.util.Log;
import androidx.core.content.ContextCompat;

public class BackgroundAudioService extends Service {
    private static final String TAG = "NexusBackgroundAudio";
    public static final String CHANNEL_ID = "nexus_audio_stream_channel";
    private static final int NOTIFICATION_ID = 40401;

    public static final String ACTION_START = "com.nexus.core.action.START_AUDIO";
    public static final String ACTION_UPDATE = "com.nexus.core.action.UPDATE_META";
    public static final String ACTION_PAUSE = "com.nexus.core.action.PAUSE_AUDIO";
    public static final String ACTION_STOP = "com.nexus.core.action.STOP_AUDIO";
    public static final String ACTION_NEXT = "com.nexus.core.action.NEXT_TRACK";
    public static final String ACTION_PREVIOUS = "com.nexus.core.action.PREVIOUS_TRACK";

    public static final String EXTRA_TRACK_TITLE = "extra_track_title";
    public static final String EXTRA_ARTIST = "extra_artist";
    public static final String EXTRA_GENRE = "extra_genre";

    private PowerManager.WakeLock wakeLock;
    private WifiManager.WifiLock wifiLock;
    private MediaSession mediaSession;
    private AudioTrack silentAudioTrack;
    private boolean isRegisteredNoisyReceiver = false;
    private String currentTitle = "Scene Radio";
    private String currentArtist = "Nexus Underground Radio";
    private String currentGenre = "Scene Radio";
    private boolean isCurrentlyPlaying = false;

    private final BroadcastReceiver becomingNoisyReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            if (AudioManager.ACTION_AUDIO_BECOMING_NOISY.equals(intent.getAction())) {
                Log.d(TAG, "Audio becoming noisy (headphones disconnected). Pausing playback.");
                isCurrentlyPlaying = false;
                stopSilentNativeAudioTrack();
                releaseWakeLock();
                updateMediaSession(currentTitle, currentArtist, currentGenre, false);
                startForegroundWithNotification(currentTitle, currentArtist, false);
                Intent pauseIntent = new Intent("com.nexus.core.AUDIO_INTERRUPTION_PAUSE");
                pauseIntent.setPackage(getPackageName());
                sendBroadcast(pauseIntent);
            }
        }
    };

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
        initMediaSession();

        // Acquire partial wake lock to keep CPU active for continuous stream processing
        PowerManager powerManager = (PowerManager) getSystemService(Context.POWER_SERVICE);
        if (powerManager != null) {
            wakeLock = powerManager.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "NexusCore::AudioWakeLock");
            wakeLock.setReferenceCounted(false);
        }

        // Acquire high-performance Wi-Fi lock to prevent network drop when screen is off
        try {
            WifiManager wifiManager = (WifiManager) getApplicationContext().getSystemService(Context.WIFI_SERVICE);
            if (wifiManager != null) {
                int lockType = Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q
                        ? WifiManager.WIFI_MODE_FULL_LOW_LATENCY
                        : WifiManager.WIFI_MODE_FULL_HIGH_PERF;
                wifiLock = wifiManager.createWifiLock(lockType, "NexusCore::AudioWifiLock");
                wifiLock.setReferenceCounted(false);
            }
        } catch (Exception e) {
            Log.w(TAG, "Could not create WifiLock", e);
        }

        // Register noisy receiver using ContextCompat.RECEIVER_EXPORTED for ACTION_AUDIO_BECOMING_NOISY
        IntentFilter filter = new IntentFilter(AudioManager.ACTION_AUDIO_BECOMING_NOISY);
        ContextCompat.registerReceiver(this, becomingNoisyReceiver, filter, ContextCompat.RECEIVER_EXPORTED);
        isRegisteredNoisyReceiver = true;
    }

    private void initMediaSession() {
        try {
            mediaSession = new MediaSession(this, "NexusSceneRadioSession");
            mediaSession.setCallback(new MediaSession.Callback() {
                @Override
                public void onPlay() {
                    super.onPlay();
                    isCurrentlyPlaying = true;
                    acquireWakeLock();
                    startSilentNativeAudioTrack();
                    updateMediaSession(currentTitle, currentArtist, currentGenre, true);
                    startForegroundWithNotification(currentTitle, currentArtist, true);
                    Intent resumeIntent = new Intent("com.nexus.core.AUDIO_INTERRUPTION_RESUME");
                    resumeIntent.setPackage(getPackageName());
                    sendBroadcast(resumeIntent);
                }

                @Override
                public void onPause() {
                    super.onPause();
                    isCurrentlyPlaying = false;
                    stopSilentNativeAudioTrack();
                    releaseWakeLock();
                    updateMediaSession(currentTitle, currentArtist, currentGenre, false);
                    startForegroundWithNotification(currentTitle, currentArtist, false);
                    Intent pauseIntent = new Intent("com.nexus.core.AUDIO_INTERRUPTION_PAUSE");
                    pauseIntent.setPackage(getPackageName());
                    sendBroadcast(pauseIntent);
                }

                @Override
                public void onSkipToNext() {
                    super.onSkipToNext();
                    Intent nextIntent = new Intent("com.nexus.core.AUDIO_CONTROL_NEXT");
                    nextIntent.setPackage(getPackageName());
                    sendBroadcast(nextIntent);
                }

                @Override
                public void onSkipToPrevious() {
                    super.onSkipToPrevious();
                    Intent prevIntent = new Intent("com.nexus.core.AUDIO_CONTROL_PREVIOUS");
                    prevIntent.setPackage(getPackageName());
                    sendBroadcast(prevIntent);
                }

                @Override
                public void onStop() {
                    super.onStop();
                    isCurrentlyPlaying = false;
                    stopSilentNativeAudioTrack();
                    releaseWakeLock();
                    updateMediaSession(currentTitle, currentArtist, currentGenre, false);
                    Intent stopIntent = new Intent("com.nexus.core.AUDIO_CONTROL_STOP");
                    stopIntent.setPackage(getPackageName());
                    sendBroadcast(stopIntent);
                    stopForegroundCompat();
                    stopSelf();
                }
            });
            mediaSession.setActive(true);
        } catch (Exception e) {
            Log.e(TAG, "Error initializing MediaSession", e);
        }
    }

    private void updateMediaSession(String title, String artist, String genre, boolean isPlaying) {
        if (mediaSession == null) return;
        try {
            MediaMetadata.Builder metaBuilder = new MediaMetadata.Builder()
                    .putString(MediaMetadata.METADATA_KEY_TITLE, title != null ? title : "Scene Radio")
                    .putString(MediaMetadata.METADATA_KEY_ARTIST, artist != null ? artist : "Nexus Scene Radio")
                    .putString(MediaMetadata.METADATA_KEY_ALBUM, genre != null && !genre.isEmpty() ? "Scene Radio • " + genre : "Scene Radio");
            mediaSession.setMetadata(metaBuilder.build());

            long actions = PlaybackState.ACTION_PLAY
                    | PlaybackState.ACTION_PAUSE
                    | PlaybackState.ACTION_PLAY_PAUSE
                    | PlaybackState.ACTION_SKIP_TO_NEXT
                    | PlaybackState.ACTION_SKIP_TO_PREVIOUS
                    | PlaybackState.ACTION_STOP;

            int state = isPlaying ? PlaybackState.STATE_PLAYING : PlaybackState.STATE_PAUSED;
            PlaybackState playbackState = new PlaybackState.Builder()
                    .setActions(actions)
                    .setState(state, PlaybackState.PLAYBACK_POSITION_UNKNOWN, isPlaying ? 1.0f : 0.0f, SystemClock.elapsedRealtime())
                    .build();

            mediaSession.setPlaybackState(playbackState);
            mediaSession.setActive(true);
        } catch (Exception e) {
            Log.w(TAG, "Error updating MediaSession", e);
        }
    }

    /**
     * Maintains a lightweight native looping PCM AudioTrack inside the foreground service process
     * so Android 12/13/14+ recognizes active native audio output from this Service at the OS kernel level.
     */
    private void startSilentNativeAudioTrack() {
        try {
            if (silentAudioTrack != null) {
                if (silentAudioTrack.getPlayState() != AudioTrack.PLAYSTATE_PLAYING) {
                    silentAudioTrack.play();
                }
                return;
            }
            int sampleRate = 8000;
            int numSamples = sampleRate; // 1 second loopable buffer
            byte[] pcmData = new byte[numSamples * 2]; // 16-bit mono = 2 bytes/sample (all zeros = silence)

            AudioAttributes attributes = new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_MEDIA)
                    .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                    .build();

            AudioFormat format = new AudioFormat.Builder()
                    .setSampleRate(sampleRate)
                    .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
                    .setChannelMask(AudioFormat.CHANNEL_OUT_MONO)
                    .build();

            silentAudioTrack = new AudioTrack(
                    attributes,
                    format,
                    pcmData.length,
                    AudioTrack.MODE_STATIC,
                    AudioManager.AUDIO_SESSION_ID_GENERATE
            );
            silentAudioTrack.write(pcmData, 0, pcmData.length);
            silentAudioTrack.setLoopPoints(0, numSamples, -1);
            silentAudioTrack.setVolume(0.01f);
            silentAudioTrack.play();
        } catch (Exception e) {
            Log.w(TAG, "Could not start native silent AudioTrack carrier", e);
        }
    }

    private void stopSilentNativeAudioTrack() {
        try {
            if (silentAudioTrack != null) {
                if (silentAudioTrack.getPlayState() == AudioTrack.PLAYSTATE_PLAYING) {
                    silentAudioTrack.pause();
                }
            }
        } catch (Exception ignored) {}
    }

    private void releaseSilentNativeAudioTrack() {
        try {
            if (silentAudioTrack != null) {
                silentAudioTrack.stop();
                silentAudioTrack.release();
                silentAudioTrack = null;
            }
        } catch (Exception ignored) {}
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && intent.getAction() != null) {
            String action = intent.getAction();
            boolean fromNotification = intent.getBooleanExtra("from_notification", false);

            if (ACTION_START.equals(action) || ACTION_UPDATE.equals(action)) {
                String title = intent.getStringExtra(EXTRA_TRACK_TITLE);
                String artist = intent.getStringExtra(EXTRA_ARTIST);
                String genre = intent.getStringExtra(EXTRA_GENRE);
                if (title != null && !title.isEmpty()) currentTitle = title;
                if (artist != null && !artist.isEmpty()) currentArtist = artist;
                if (genre != null && !genre.isEmpty()) currentGenre = genre;
                isCurrentlyPlaying = true;

                acquireWakeLock();
                startSilentNativeAudioTrack();
                updateMediaSession(currentTitle, currentArtist, currentGenre, true);
                startForegroundWithNotification(currentTitle, currentArtist, true);

                if (fromNotification) {
                    Intent resumeIntent = new Intent("com.nexus.core.AUDIO_INTERRUPTION_RESUME");
                    resumeIntent.setPackage(getPackageName());
                    sendBroadcast(resumeIntent);
                }
            } else if (ACTION_PAUSE.equals(action)) {
                isCurrentlyPlaying = false;
                stopSilentNativeAudioTrack();
                releaseWakeLock();
                updateMediaSession(currentTitle, currentArtist, currentGenre, false);
                startForegroundWithNotification(currentTitle, currentArtist, false);
                if (fromNotification) {
                    Intent pauseIntent = new Intent("com.nexus.core.AUDIO_INTERRUPTION_PAUSE");
                    pauseIntent.setPackage(getPackageName());
                    sendBroadcast(pauseIntent);
                }
            } else if (ACTION_NEXT.equals(action)) {
                Intent nextIntent = new Intent("com.nexus.core.AUDIO_CONTROL_NEXT");
                nextIntent.setPackage(getPackageName());
                sendBroadcast(nextIntent);
            } else if (ACTION_PREVIOUS.equals(action)) {
                Intent prevIntent = new Intent("com.nexus.core.AUDIO_CONTROL_PREVIOUS");
                prevIntent.setPackage(getPackageName());
                sendBroadcast(prevIntent);
            } else if (ACTION_STOP.equals(action)) {
                isCurrentlyPlaying = false;
                stopSilentNativeAudioTrack();
                releaseWakeLock();
                updateMediaSession(currentTitle, currentArtist, currentGenre, false);
                if (fromNotification) {
                    Intent stopIntent = new Intent("com.nexus.core.AUDIO_CONTROL_STOP");
                    stopIntent.setPackage(getPackageName());
                    sendBroadcast(stopIntent);
                }
                stopForegroundCompat();
                stopSelf();
            }
        }
        return START_STICKY;
    }

    private void stopForegroundCompat() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                stopForeground(STOP_FOREGROUND_REMOVE);
            } else {
                stopForeground(true);
            }
        } catch (Exception e) {
            Log.w(TAG, "stopForeground error", e);
        }
    }

    private void acquireWakeLock() {
        if (wakeLock != null && !wakeLock.isHeld()) {
            try {
                wakeLock.acquire(12 * 60 * 60 * 1000L); // 12 hours timeout safety limit
                Log.d(TAG, "WakeLock acquired for audio playback.");
            } catch (Exception e) {
                Log.w(TAG, "Could not acquire WakeLock", e);
            }
        }
        if (wifiLock != null && !wifiLock.isHeld()) {
            try {
                wifiLock.acquire();
            } catch (Exception e) {
                Log.w(TAG, "Could not acquire WifiLock", e);
            }
        }
    }

    private void releaseWakeLock() {
        if (wakeLock != null && wakeLock.isHeld()) {
            try {
                wakeLock.release();
                Log.d(TAG, "WakeLock released.");
            } catch (Exception e) {
                Log.w(TAG, "Could not release WakeLock", e);
            }
        }
        if (wifiLock != null && wifiLock.isHeld()) {
            try {
                wifiLock.release();
            } catch (Exception e) {
                Log.w(TAG, "Could not release WifiLock", e);
            }
        }
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "Scene Radio Playback",
                    NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Shows active playback controls and track information for Scene Radio");
            channel.setShowBadge(false);
            channel.enableVibration(false);
            channel.setSound(null, null);

            NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    private void startForegroundWithNotification(String title, String artist, boolean isPlaying) {
        isCurrentlyPlaying = isPlaying;

        Intent notificationIntent = new Intent(this, MainActivity.class);
        notificationIntent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pendingIntent = PendingIntent.getActivity(
                this,
                0,
                notificationIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0)
        );

        Notification.Builder builder;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            builder = new Notification.Builder(this, CHANNEL_ID);
        } else {
            builder = new Notification.Builder(this);
        }

        builder.setContentTitle(title)
                .setContentText(artist)
                .setSubText(currentGenre != null && !currentGenre.isEmpty() ? currentGenre : "Scene Radio")
                .setSmallIcon(android.R.drawable.ic_media_play)
                .setContentIntent(pendingIntent)
                .setOngoing(isPlaying)
                .setAutoCancel(false)
                .setVisibility(Notification.VISIBILITY_PUBLIC);

        // Action 1: Previous Track
        Intent prevIntent = new Intent(this, BackgroundAudioService.class);
        prevIntent.setAction(ACTION_PREVIOUS);
        prevIntent.putExtra("from_notification", true);
        PendingIntent prevPendingIntent = PendingIntent.getService(
                this,
                10,
                prevIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0)
        );
        builder.addAction(android.R.drawable.ic_media_previous, "Previous", prevPendingIntent);

        // Action 2: Play / Pause Toggle
        if (isPlaying) {
            Intent pauseIntent = new Intent(this, BackgroundAudioService.class);
            pauseIntent.setAction(ACTION_PAUSE);
            pauseIntent.putExtra("from_notification", true);
            PendingIntent pausePendingIntent = PendingIntent.getService(
                    this,
                    1,
                    pauseIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0)
            );
            builder.addAction(android.R.drawable.ic_media_pause, "Pause", pausePendingIntent);
        } else {
            Intent playIntent = new Intent(this, BackgroundAudioService.class);
            playIntent.setAction(ACTION_START);
            playIntent.putExtra("from_notification", true);
            PendingIntent playPendingIntent = PendingIntent.getService(
                    this,
                    2,
                    playIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0)
            );
            builder.addAction(android.R.drawable.ic_media_play, "Play", playPendingIntent);
        }

        // Action 3: Next Track
        Intent nextIntent = new Intent(this, BackgroundAudioService.class);
        nextIntent.setAction(ACTION_NEXT);
        nextIntent.putExtra("from_notification", true);
        PendingIntent nextPendingIntent = PendingIntent.getService(
                this,
                20,
                nextIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0)
        );
        builder.addAction(android.R.drawable.ic_media_next, "Next", nextPendingIntent);

        // Action 4: Stop
        Intent stopIntent = new Intent(this, BackgroundAudioService.class);
        stopIntent.setAction(ACTION_STOP);
        stopIntent.putExtra("from_notification", true);
        PendingIntent stopPendingIntent = PendingIntent.getService(
                this,
                3,
                stopIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0)
        );
        builder.addAction(android.R.drawable.ic_menu_close_clear_cancel, "Stop", stopPendingIntent);

        // Apply Android MediaStyle and bind MediaSession token for native OS Lock Screen & Quick Settings Media Player
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            Notification.MediaStyle mediaStyle = new Notification.MediaStyle();
            mediaStyle.setShowActionsInCompactView(0, 1, 2); // Previous, Play/Pause, Next
            if (mediaSession != null) {
                mediaStyle.setMediaSession(mediaSession.getSessionToken());
            }
            builder.setStyle(mediaStyle);
        }

        Notification notification = builder.build();

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
            } else {
                startForeground(NOTIFICATION_ID, notification);
            }
        } catch (Exception e) {
            Log.e(TAG, "Error starting foreground service notification", e);
        }
    }

    @Override
    public void onTaskRemoved(Intent rootIntent) {
        super.onTaskRemoved(rootIntent);
        Log.d(TAG, "onTaskRemoved: user removed task from recents; maintaining foreground audio service");
        if (isCurrentlyPlaying) {
            acquireWakeLock();
            startSilentNativeAudioTrack();
            updateMediaSession(currentTitle, currentArtist, currentGenre, true);
            startForegroundWithNotification(currentTitle, currentArtist, true);
        }
    }

    @Override
    public void onDestroy() {
        releaseSilentNativeAudioTrack();
        releaseWakeLock();
        if (mediaSession != null) {
            try {
                mediaSession.setActive(false);
                mediaSession.release();
                mediaSession = null;
            } catch (Exception ignored) {}
        }
        if (isRegisteredNoisyReceiver) {
            try {
                unregisterReceiver(becomingNoisyReceiver);
                isRegisteredNoisyReceiver = false;
            } catch (Exception ignored) {}
        }
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
