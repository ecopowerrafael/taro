package com.astria.taromobile;

import androidx.annotation.NonNull;

import com.capacitorjs.plugins.pushnotifications.MessagingService;
import com.google.firebase.messaging.RemoteMessage;

public class PushNotificationService extends MessagingService {

    @Override
    public void onMessageReceived(@NonNull RemoteMessage remoteMessage) {
        super.onMessageReceived(remoteMessage);

        if (remoteMessage.getData().isEmpty()) {
            return;
        }

        NotificationDisplayHelper.show(this, remoteMessage.getData());
    }

    @Override
    public void onNewToken(@NonNull String token) {
        super.onNewToken(token);
    }
}
