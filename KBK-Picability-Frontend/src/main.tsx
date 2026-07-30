import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';

import App from './app/App.tsx';

// @ts-ignore
import './styles/index.css';

let updateInProgress = false;

const updateServiceWorker = registerSW({
    immediate: true,

    onNeedRefresh() {
        if (updateInProgress) {
            return;
        }

        updateInProgress = true;

        /*
         * Activate the newly downloaded service worker.
         * The reload happens after the worker takes control.
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

        if (!registration) {
            return;
        }

        /*
         * Check periodically while the browser tab remains
         * open so desktop users do not remain on an old
         * JavaScript bundle indefinitely.
         */
        window.setInterval(() => {
            void registration.update();
        }, 60 * 60 * 1000);
    },

    onRegisterError(error) {
        console.error(
            'Service worker registration failed:',
            error
        );
    }
});

createRoot(
    document.getElementById('root')!
).render(
    <App />
);