import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';

import App from './app/App.tsx';

// @ts-ignore
import './styles/index.css';

let updateInProgress = false;

let serviceWorkerRegistration:
    ServiceWorkerRegistration |
    undefined;

const requestServiceWorkerUpdate =
    async () => {
        if (
            !serviceWorkerRegistration ||
            !navigator.onLine
        ) {
            return;
        }

        try {
            await serviceWorkerRegistration
                .update();
        } catch (error) {
            console.error(
                'Picability update check failed:',
                error
            );
        }
    };

const updateServiceWorker = registerSW({
    immediate: true,

    onNeedRefresh() {
        if (updateInProgress) {
            return;
        }

        updateInProgress = true;

        /*
         * Activate the downloaded version and reload the
         * current page onto the new application bundle.
         */
        void updateServiceWorker(true);
    },

    onOfflineReady() {
        console.log(
            'Picability is ready for offline use.'
        );
    },

    onRegisteredSW(
        serviceWorkerUrl,
        registration
    ) {
        console.log(
            'Picability service worker registered:',
            serviceWorkerUrl
        );

        serviceWorkerRegistration =
            registration;

        if (!registration) {
            return;
        }

        /*
         * Check as soon as registration is available.
         */
        void requestServiceWorkerUpdate();

        /*
         * Check every fifteen minutes while Picability
         * remains open.
         */
        window.setInterval(() => {
            void requestServiceWorkerUpdate();
        }, 15 * 60 * 1000);
    },

    onRegisterError(error) {
        console.error(
            'Service worker registration failed:',
            error
        );
    }
});

/*
 * Check whenever the user returns to Picability after
 * using another application or browser tab.
 */
document.addEventListener(
    'visibilitychange',
    () => {
        if (
            document.visibilityState ===
            'visible'
        ) {
            void requestServiceWorkerUpdate();
        }
    }
);

/*
 * Desktop browsers commonly fire focus when a user
 * returns to an existing Picability tab.
 */
window.addEventListener(
    'focus',
    () => {
        void requestServiceWorkerUpdate();
    }
);

/*
 * Retry when the device regains an internet connection.
 */
window.addEventListener(
    'online',
    () => {
        void requestServiceWorkerUpdate();
    }
);

createRoot(
    document.getElementById('root')!
).render(
    <App />
);