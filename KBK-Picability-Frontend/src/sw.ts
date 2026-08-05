/// <reference lib="webworker" />

import {
    clientsClaim
} from 'workbox-core';
import {
    cleanupOutdatedCaches,
    precacheAndRoute
} from 'workbox-precaching';
import {
    markPushRefreshRequired
} from './pushRefreshStore';

declare const self: ServiceWorkerGlobalScope;

/*
 * Activate new Picability versions immediately instead of
 * waiting for every existing browser tab to close.
 */
self.skipWaiting();

/*
 * Allow the newly activated worker to control currently
 * open Picability pages immediately.
 */
clientsClaim();

/*
 * Remove precache data left behind by older deployments.
 */
cleanupOutdatedCaches();

precacheAndRoute(
    self.__WB_MANIFEST
);

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

    const targetUrl = new URL(
        event.notification.data?.url || '/',
        self.location.origin
    ).href;

    event.waitUntil(
        (async () => {
            await markPushRefreshRequired();

            const windowClients = await self.clients.matchAll({
                type: 'window',
                includeUncontrolled: true
            });

            const existingClient = windowClients.find(client =>
                client.url.startsWith(self.location.origin)
            );

            if (existingClient) {
                existingClient.postMessage({
                    type: 'PICABILITY_PUSH_OPENED'
                });

                await existingClient.focus();
                return;
            }

            await self.clients.openWindow(targetUrl);
        })()
    );
});