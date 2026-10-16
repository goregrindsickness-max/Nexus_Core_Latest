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
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;
import android.util.Log;

public class BackgroundAudioService extends Service {
    private static final String TAG = "NexusBackgroundAudio";
    public static final String CHANNEL_ID = "nexus_audio_stream_channel";
    private static final int NOTIFICATION_ID = 40401;

    public static final String ACTION_START = "com.nexus.core.action.START_AUDIO";
    public static final String ACTION_UPDATE = "com.nexus.core.action.UPDATE_META";
    public static final String ACTION_PAUSE = "com.nexus.core.action.PAUSE_AUDIO";
    public static final String ACTION_STOP = "com.nexus.core.action.STOP_AUDIO";

    public static final String EXTRA_TRACK_TITLE = "extra_track_title";
    public static final String EXTRA_ARTIST = "extra_artist";
    public static final String EXTRA_GENRE = "extra_genre";

    private PowerManager.WakeLock wakeLock;
    private AudioManager audioManager;
    private AudioFocusRequest audioFocusRequest;
    private boolean isRegisteredNoisyReceiver = false;
    private String currentTitle = "Scene Radio";
    private String currentArtist = "Nexus Underground Radio";

    private final BroadcastReceiver becomingNoisyReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            if (AudioManager.ACTION_AUDIO_BECOMING_NOISY.equals(intent.getAction())) {
                Log.d(TAG, "Audio becoming noisy (headphones disconnected). Pausing playback.");
                // Send broadcast or update state to notify WebView to pause
                Intent pauseIntent = new Intent("com.nexus.core.AUDIO_INTERRUPTION_PAUSE");
                sendBroadcast(pauseIntent);
            }
        }
    };

    private final AudioManager.OnAudioFocusChangeListener audioFocusChangeListener = new AudioManager.OnAudioFocusChangeListener() {
        @Override
        public void onAudioFocusChange(int focusChange) {
            switch (focusChange) {
                case AudioManager.AUDIOFOCUS_LOSS:
                case AudioManager.AUDIOFOCUS_LOSS_TRANSIENT:
                    Log.d(TAG, "Audio focus lost. Signaling pause.");
                    Intent pauseIntent = new Intent("com.nexus.core.AUDIO_INTERRUPTION_PAUSE");
                    sendBroadcast(pauseIntent);
                    break;
                case AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK:
                    Log.d(TAG, "Audio focus ducking requested.");
                    break;
                case AudioManager.AUDIOFOCUS_GAIN:
                    Log.d(TAG, "Audio focus regained.");
                    Intent resumeIntent = new Intent("com.nexus.core.AUDIO_INTERRUPTION_RESUME");
                    sendBroadcast(resumeIntent);
                    break;
            }
        }
    };

    @Override
    public void onCreate() {
        super.onCreate();
        audioManager = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
        createNotificationChannel();

        // Acquire partial wake lock to keep CPU active for continuous stream processing
        PowerManager powerManager = (PowerManager) getSystemService(Context.POWER_SERVICE);
        if (powerManager != null) {
            wakeLock = powerManager.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "NexusCore::AudioWakeLock");
            wakeLock.setReferenceCounted(false);
        }

        // Register noisy receiver
        IntentFilter filter = new IntentFilter(AudioManager.ACTION_AUDIO_BECOMING_NOISY);
        registerReceiver(becomingNoisyReceiver, filter);
        isRegisteredNoisyReceiver = true;
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && intent.getAction() != null) {
            String action = intent.getAction();
            if (ACTION_START.equals(action) || ACTION_UPDATE.equals(action)) {
                String title = intent.getStringExtra(EXTRA_TRACK_TITLE);
                String artist = intent.getStringExtra(EXTRA_ARTIST);
                if (title != null && !title.isEmpty()) currentTitle = title;
                if (artist != null && !artist.isEmpty()) currentArtist = artist;

                acquireWakeLock();
                requestAudioFocus();
                startForegroundWithNotification(currentTitle, currentArtist, true);
            } else if (ACTION_PAUSE.equals(action)) {
                releaseWakeLock();
                startForegroundWithNotification(currentTitle, currentArtist, false);
            } else if (ACTION_STOP.equals(action)) {
                releaseWakeLock();
                abandonAudioFocus();
                stopForeground(true);
                stopSelf();
            }
        }
        return START_STICKY;
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
    }

    private void requestAudioFocus() {
        if (audioManager == null) return;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            AudioAttributes playbackAttributes = new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_MEDIA)
                    .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                    .build();

            audioFocusRequest = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN)
                    .setAudioAttributes(playbackAttributes)
                    .setAcceptsDelayedFocusGain(true)
                    .setOnAudioFocusChangeListener(audioFocusChangeListener)
                    .build();

            audioManager.requestAudioFocus(audioFocusRequest);
        } else {
            audioManager.requestAudioFocus(audioFocusChangeListener, AudioManager.STREAM_MUSIC, AudioManager.AUDIOFOCUS_GAIN);
        }
    }

    private void abandonAudioFocus() {
        if (audioManager == null) return;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && audioFocusRequest != null) {
            audioManager.abandonAudioFocusRequest(audioFocusRequest);
        } else {
            audioManager.abandonAudioFocus(audioFocusChangeListener);
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
                .setSmallIcon(android.R.drawable.ic_media_play)
                .setContentIntent(pendingIntent)
                .setOngoing(isPlaying)
                .setAutoCancel(false);

        Notification notification = builder.build();

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
        } else {
            startForeground(NOTIFICATION_ID, notification);
        }
    }

    @Override
    public void onDestroy() {
        releaseWakeLock();
        abandonAudioFocus();
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
