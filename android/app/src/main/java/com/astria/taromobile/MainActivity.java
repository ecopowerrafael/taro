package com.astria.taromobile;

import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.view.WindowManager;

import androidx.core.view.WindowCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

	@Override
	public void onCreate(Bundle savedInstanceState) {
		registerPlugin(CriticalAlertsPlugin.class);
		super.onCreate(savedInstanceState);
		WindowCompat.setDecorFitsSystemWindows(getWindow(), true);
		applyWakeScreenFlags(getIntent());
	}

	@Override
	protected void onNewIntent(Intent intent) {
		super.onNewIntent(intent);
		setIntent(intent);
		applyWakeScreenFlags(intent);
	}

	private void applyWakeScreenFlags(Intent intent) {
		boolean shouldWakeScreen = intent != null && intent.getBooleanExtra("wake_screen", false);

		if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
			setShowWhenLocked(shouldWakeScreen);
			setTurnScreenOn(shouldWakeScreen);
		}

		if (shouldWakeScreen) {
			getWindow().addFlags(
				WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON |
				WindowManager.LayoutParams.FLAG_ALLOW_LOCK_WHILE_SCREEN_ON |
				WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
				WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
			);
		} else {
			getWindow().clearFlags(
				WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON |
				WindowManager.LayoutParams.FLAG_ALLOW_LOCK_WHILE_SCREEN_ON |
				WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
				WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
			);
		}
	}
}

