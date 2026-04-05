package com.astria.taromobile;
import androidx.annotation.NonNull;
import com.capacitorjs.plugins.pushnotifications.MessagingService;
import com.google.firebase.messaging.RemoteMessage;
import com.hiennv.flutter_callkit_incoming.FlutterCallkitIncomingPlugin;
public class PushNotificationService extends MessagingService {

    @Override
    public void onMessageReceived(@NonNull RemoteMessage remoteMessage) {
        super.onMessageReceived(remoteMessage);

        try {
            FlutterCallkitIncomingPlugin.Companion.sendRemoteMessage(remoteMessage, this.getApplicationContext());
        } catch (Exception e) {
            e.printStackTrace();
        }

        if (remoteMessage.getData().containsKey("call")) {
            return;
        }

        if (remoteMessage.getData().isEmpty()) {
            return;
        }

        NotificationDisplayHelper.show(this, remoteMessage.getData());
    }

    @Override
    public void onNewToken(@NonNull String token) {
        super.onNewToken(token);

        try {
            FlutterCallkitIncomingPlugin.Companion.onNewToken(token);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
