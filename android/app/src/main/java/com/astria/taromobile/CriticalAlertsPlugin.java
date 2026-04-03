package com.astria.taromobile;

import android.app.NotificationManager;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import android.provider.Settings;

import androidx.annotation.Nullable;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "CriticalAlerts")
public class CriticalAlertsPlugin extends Plugin {

	@PluginMethod
	public void getCapabilities(PluginCall call) {
		JSObject result = new JSObject();
		result.put("sdkInt", Build.VERSION.SDK_INT);
		result.put("notificationsEnabled", areNotificationsEnabled());
		result.put("fullScreenIntentAllowed", canUseFullScreenIntent());
		result.put("ignoringBatteryOptimizations", isIgnoringBatteryOptimizations());
		call.resolve(result);
	}

	@PluginMethod
	public void openFullScreenIntentSettings(PluginCall call) {
		Intent intent;

		if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
			intent = new Intent(Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT);
			intent.setData(Uri.parse("package:" + getContext().getPackageName()));
		} else {
			intent = new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS);
			intent.putExtra(Settings.EXTRA_APP_PACKAGE, getContext().getPackageName());
		}

		openIntent(intent);
		call.resolve();
	}

	@PluginMethod
	public void openBatteryOptimizationSettings(PluginCall call) {
		Intent intent;

		if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !isIgnoringBatteryOptimizations()) {
			intent = new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
			intent.setData(Uri.parse("package:" + getContext().getPackageName()));
		} else {
			intent = new Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS);
		}

		openIntent(intent);
		call.resolve();
	}

	@PluginMethod
	public void openAppNotificationSettings(PluginCall call) {
		Intent intent = new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS);
		intent.putExtra(Settings.EXTRA_APP_PACKAGE, getContext().getPackageName());
		openIntent(intent);
		call.resolve();
	}

	private void openIntent(Intent intent) {
		intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
		getContext().startActivity(intent);
	}

	private boolean areNotificationsEnabled() {
		NotificationManager notificationManager = getNotificationManager();
		return notificationManager != null && notificationManager.areNotificationsEnabled();
	}

	private boolean canUseFullScreenIntent() {
		if (Build.VERSION.SDK_INT < Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
			return true;
		}

		NotificationManager notificationManager = getNotificationManager();
		return notificationManager != null && notificationManager.canUseFullScreenIntent();
	}

	private boolean isIgnoringBatteryOptimizations() {
		if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
			return true;
		}

		PowerManager powerManager = getPowerManager();
		return powerManager != null && powerManager.isIgnoringBatteryOptimizations(getContext().getPackageName());
	}

	@Nullable
	private NotificationManager getNotificationManager() {
		return getContext().getSystemService(NotificationManager.class);
	}

	@Nullable
	private PowerManager getPowerManager() {
		return getContext().getSystemService(PowerManager.class);
	}
}