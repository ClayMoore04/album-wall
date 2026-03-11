import { supabase } from "./supabase";

/**
 * Check if push notifications are supported in this browser.
 */
export function isPushSupported() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
}

/**
 * Convert a base64 VAPID key to a Uint8Array for applicationServerKey.
 */
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Subscribe the user to web push notifications.
 * @param {string} userId - The authenticated user's ID.
 * @returns {{ success: boolean, reason?: string }}
 */
export async function subscribeToPush(userId) {
  if (!isPushSupported()) {
    return { success: false, reason: "Push notifications not supported" };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return { success: false, reason: "Permission denied" };
    }

    const registration = await navigator.serviceWorker.ready;

    const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) {
      return { success: false, reason: "VAPID key not configured" };
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const response = await fetch("/api/push-subscribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
        userId,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      return { success: false, reason: err.error || "Server error" };
    }

    return { success: true };
  } catch (err) {
    console.error("Push subscription failed:", err);
    return { success: false, reason: err.message };
  }
}

/**
 * Unsubscribe from web push notifications.
 */
export async function unsubscribeFromPush() {
  if (!isPushSupported()) return;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
    }
  } catch (err) {
    console.error("Push unsubscribe failed:", err);
  }
}
