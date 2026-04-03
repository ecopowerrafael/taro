package com.astria.taromobile;

import android.annotation.SuppressLint;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;

import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

import java.util.Map;

public final class NotificationDisplayHelper {
    private static final String LEGACY_CHANNEL_INCOMING_CALLS = "incoming_calls";
    private static final String CHANNEL_INCOMING_CALLS = "incoming_calls_v2";
    private static final String CHANNEL_CONSULTANT_QUESTIONS = "consultant_questions";
    private static final String CHANNEL_CLIENT_ANSWERS = "client_answers";

    private NotificationDisplayHelper() {}

    public static void show(Context context, Map<String, String> data) {
        ensureChannels(context);

        String type = valueOrDefault(data.get("type"), "info");
        String channelId = resolveChannelId(type, data.get("channelId"));
        boolean fullScreen = Boolean.parseBoolean(valueOrDefault(data.get("fullScreen"), "false"));
        fullScreen = fullScreen && canUseFullScreenIntent(context);
        String title = valueOrDefault(data.get("title"), "Astria Tarot");
        String body = valueOrDefault(data.get("body"), "Você tem uma nova atualização.");
        Uri deepLink = buildDeepLink(context, data);
        PendingIntent contentIntent = buildContentIntent(context, deepLink, fullScreen, resolveNotificationId(data));

        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, channelId)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
            .setAutoCancel(true)
            .setContentIntent(contentIntent)
            .setCategory(fullScreen ? NotificationCompat.CATEGORY_CALL : NotificationCompat.CATEGORY_MESSAGE)
            .setPriority(fullScreen ? NotificationCompat.PRIORITY_MAX : NotificationCompat.PRIORITY_HIGH)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setSound(resolveSoundUri(fullScreen))
            .setVibrate(resolveVibrationPattern(type));

        if (fullScreen) {
            wakeScreen(context);
            builder
                .setOngoing(true)
                .setFullScreenIntent(contentIntent, true)
                .setTimeoutAfter(parseLong(valueOrDefault(data.get("ttlMs"), "45000"), 45000L));
        }

        NotificationManagerCompat.from(context).notify(resolveNotificationId(data), builder.build());
    }

    private static PendingIntent buildContentIntent(Context context, Uri deepLink, boolean fullScreen, int requestCode) {
        Intent intent = new Intent(Intent.ACTION_VIEW, deepLink, context, MainActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        intent.putExtra("wake_screen", fullScreen);

        return PendingIntent.getActivity(
            context,
            requestCode,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
    }

    private static Uri buildDeepLink(Context context, Map<String, String> data) {
        String nativeRoute = data.get("nativeRoute");
        if (nativeRoute == null || nativeRoute.isEmpty()) {
            nativeRoute = "/";
        }
        if (!nativeRoute.startsWith("/")) {
            nativeRoute = "/" + nativeRoute;
        }
        return Uri.parse(context.getString(R.string.custom_url_scheme) + "://app" + nativeRoute);
    }

    private static void ensureChannels(Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            return;
        }

        NotificationManager manager = context.getSystemService(NotificationManager.class);
        if (manager == null) {
            return;
        }

        manager.deleteNotificationChannel(LEGACY_CHANNEL_INCOMING_CALLS);

        NotificationChannel incomingCalls = new NotificationChannel(
            CHANNEL_INCOMING_CALLS,
            "Chamadas de vídeo",
            NotificationManager.IMPORTANCE_HIGH
        );
        incomingCalls.setDescription("Alertas de vídeo consulta que podem abrir em tela cheia.");
        incomingCalls.enableVibration(true);
        incomingCalls.setLockscreenVisibility(NotificationCompat.VISIBILITY_PUBLIC);
        incomingCalls.setSound(
            RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE),
            new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build()
        );

        NotificationChannel consultantQuestions = new NotificationChannel(
            CHANNEL_CONSULTANT_QUESTIONS,
            "Perguntas urgentes",
            NotificationManager.IMPORTANCE_HIGH
        );
        consultantQuestions.setDescription("Novas perguntas aguardando resposta do consultor.");
        consultantQuestions.enableVibration(true);
        consultantQuestions.setLockscreenVisibility(NotificationCompat.VISIBILITY_PUBLIC);
        consultantQuestions.setSound(
            RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION),
            new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build()
        );

        NotificationChannel clientAnswers = new NotificationChannel(
            CHANNEL_CLIENT_ANSWERS,
            "Respostas recebidas",
            NotificationManager.IMPORTANCE_HIGH
        );
        clientAnswers.setDescription("Respostas de consultores para clientes.");
        clientAnswers.enableVibration(true);
        clientAnswers.setLockscreenVisibility(NotificationCompat.VISIBILITY_PUBLIC);
        clientAnswers.setSound(
            RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION),
            new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build()
        );

        manager.createNotificationChannel(incomingCalls);
        manager.createNotificationChannel(consultantQuestions);
        manager.createNotificationChannel(clientAnswers);
    }

    @SuppressLint("WakelockTimeout")
    private static void wakeScreen(Context context) {
        PowerManager powerManager = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
        if (powerManager == null) {
            return;
        }

        PowerManager.WakeLock wakeLock = powerManager.newWakeLock(
            PowerManager.SCREEN_BRIGHT_WAKE_LOCK | PowerManager.ACQUIRE_CAUSES_WAKEUP | PowerManager.ON_AFTER_RELEASE,
            "taro-mobile:incoming-call"
        );
        wakeLock.acquire(3000);
    }

    private static int resolveNotificationId(Map<String, String> data) {
        String type = valueOrDefault(data.get("type"), "info");
        String sessionId = data.get("sessionId");
        String requestId = data.get("requestId");
        return (type + ":" + valueOrDefault(sessionId, valueOrDefault(requestId, "general"))).hashCode();
    }

    private static String resolveChannelId(String type, String payloadChannelId) {
        if ("incoming_call".equals(type)) {
            return CHANNEL_INCOMING_CALLS;
        }
        if ("new_question".equals(type)) {
            return CHANNEL_CONSULTANT_QUESTIONS;
        }
        if ("question_answered".equals(type)) {
            return CHANNEL_CLIENT_ANSWERS;
        }
        if (payloadChannelId != null && !payloadChannelId.isEmpty()) {
            return payloadChannelId;
        }
        return CHANNEL_CLIENT_ANSWERS;
    }

    private static boolean canUseFullScreenIntent(Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            return true;
        }

        NotificationManager manager = context.getSystemService(NotificationManager.class);
        return manager != null && manager.canUseFullScreenIntent();
    }

    private static Uri resolveSoundUri(boolean fullScreen) {
        return RingtoneManager.getDefaultUri(fullScreen ? RingtoneManager.TYPE_RINGTONE : RingtoneManager.TYPE_NOTIFICATION);
    }

    private static long[] resolveVibrationPattern(String type) {
        if ("incoming_call".equals(type)) {
            return new long[] {0L, 900L, 250L, 900L, 250L, 900L};
        }
        return new long[] {0L, 350L, 120L, 350L, 120L, 350L};
    }

    private static String valueOrDefault(String value, String fallback) {
        return value == null || value.isEmpty() ? fallback : value;
    }

    private static long parseLong(String value, long fallback) {
        try {
            return Long.parseLong(value);
        } catch (NumberFormatException error) {
            return fallback;
        }
    }
}
