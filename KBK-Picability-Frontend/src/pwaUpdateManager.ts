import {
    registerSW
} from 'virtual:pwa-register';

type UpdateListener =
    (available: boolean) => void;

const updateListeners =
    new Set<UpdateListener>();

let updateAvailable = false;

let updateInProgress = false;

let serviceWorkerRegistration:
    ServiceWorkerRegistration |
    undefined;

let updateServiceWorker:
    ((reloadPage?: boolean) =>
        Promise<void>) |
    undefined;

const notifyListeners = () => {
    updateListeners.forEach(
        listener => {
            listener(
                updateAvailable
            );
        }
    );
};

const setUpdateAvailable = (
    available: boolean
) => {
    updateAvailable = available;
    notifyListeners();
};

const checkForWaitingWorker =
    () => {
        if (
            serviceWorkerRegistration
                ?.waiting &&
            navigator.serviceWorker
                .controller
        ) {
            setUpdateAvailable(
                true
            );

            return true;
        }

        return false;
    };

export const requestPicabilityUpdateCheck =
    async () => {
        if (
            !serviceWorkerRegistration ||
            !navigator.onLine
        ) {
            return;
        }

        try {
            /*
             * If an updated worker has already downloaded and
             * is waiting, redisplay the update prompt.
             *
             * This is especially useful after the user presses
             * "Later" and subsequently returns to Picability.
             */
            if (
                checkForWaitingWorker()
            ) {
                return;
            }

            await serviceWorkerRegistration
                .update();

            checkForWaitingWorker();
        } catch (error) {
            console.error(
                'Picability update check failed:',
                error
            );
        }
    };

export const initializePwaUpdates =
    () => {
        updateServiceWorker =
            registerSW({
                immediate: true,

                onNeedRefresh() {
                    console.log(
                        'A new Picability version is available.'
                    );

                    setUpdateAvailable(
                        true
                    );
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
                     * Look for a new version immediately.
                     */
                    void requestPicabilityUpdateCheck();

                    /*
                     * Continue checking while Picability remains
                     * open for long periods.
                     */
                    window.setInterval(
                        () => {
                            void requestPicabilityUpdateCheck();
                        },
                        15 * 60 * 1000
                    );
                },

                onRegisterError(error) {
                    console.error(
                        'Service worker registration failed:',
                        error
                    );
                }
            });

        /*
         * If another Picability window causes the new worker
         * to activate, reflect that state here too.
         */
        navigator.serviceWorker
            .addEventListener(
                'controllerchange',
                () => {
                    if (
                        updateInProgress
                    ) {
                        return;
                    }

                    /*
                     * Do not force a reload here. updateSW(true)
                     * handles the approved update path.
                     */
                    console.log(
                        'Picability service worker controller changed.'
                    );
                }
            );

        document.addEventListener(
            'visibilitychange',
            () => {
                if (
                    document.visibilityState ===
                    'visible'
                ) {
                    void requestPicabilityUpdateCheck();
                }
            }
        );

        window.addEventListener(
            'focus',
            () => {
                void requestPicabilityUpdateCheck();
            }
        );

        window.addEventListener(
            'online',
            () => {
                void requestPicabilityUpdateCheck();
            }
        );
    };

export const subscribeToPicabilityUpdates =
    (
        listener: UpdateListener
    ) => {
        updateListeners.add(
            listener
        );

        /*
         * Immediately tell a newly mounted component about
         * the current state.
         */
        listener(
            updateAvailable
        );

        return () => {
            updateListeners.delete(
                listener
            );
        };
    };

export const dismissPicabilityUpdate =
    () => {
        setUpdateAvailable(
            false
        );
    };

export const installPicabilityUpdate =
    async () => {
        if (
            !updateServiceWorker ||
            updateInProgress
        ) {
            return;
        }

        try {
            updateInProgress = true;

            /*
             * This sends SKIP_WAITING to the waiting worker
             * and reloads the page onto the new Picability
             * bundle.
             */
            await updateServiceWorker(
                true
            );
        } catch (error) {
            updateInProgress = false;

            console.error(
                'Could not install Picability update:',
                error
            );

            throw error;
        }
    };