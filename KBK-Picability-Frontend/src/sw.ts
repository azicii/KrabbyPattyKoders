/// <reference lib="webworker" />

import { precacheAndRoute } from 'workbox-precaching';

declare const self: ServiceWorkerGlobalScope;

precacheAndRoute(self.__WB_MANIFEST);

self.addEventListener('push', (event) => {
    const data = event.data?.json() ?? {};

    const title = data.title || "🔥 Don't leave them hanging!";
    const options: NotificationOptions = {
        body: data.body || "Your accountability partner checked in.",
        icon: data.icon || "/pwa-192x192.png",
        badge: data.badge || "/pwa-192x192.png",
        data: {
            url: data.url || "/"
        }
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const url = event.notification.data?.url || "/";
    const refreshUrl = `${url}?refresh=push`;

    event.waitUntil(
        self.clients.matchAll({ type: "window", includeUncontrolled: true })
            .then((clients) => {
                const existingClient = clients[0];

                if (existingClient) {
                    return existingClient
                        .navigate(refreshUrl)
                        .then((client) => client?.focus());
                }

                return self.clients.openWindow(refreshUrl);
            })
    );
});