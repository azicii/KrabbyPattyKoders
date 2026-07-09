const BASE_URL = 'https://kbk-picability-backend.onrender.com';

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
}

export function canUsePushNotifications() {
    return (
        'serviceWorker' in navigator &&
        'PushManager' in window &&
        'Notification' in window
    );
}

export async function enablePushNotifications(token: string) {
    if (!canUsePushNotifications()) {
        throw new Error("Push notifications are not supported on this device.");
    }

    const permission = await Notification.requestPermission();

    if (permission !== 'granted') {
        throw new Error("Notification permission was not granted.");
    }

    const registration = await navigator.serviceWorker.ready;

    const existingSubscription = await registration.pushManager.getSubscription();
    const subscription = existingSubscription ?? await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY)
    });

    const response = await fetch(`${BASE_URL}/api/PushSubscriptions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(subscription)
    });

    if (!response.ok) {
        throw new Error("Failed to save push subscription.");
    }
}