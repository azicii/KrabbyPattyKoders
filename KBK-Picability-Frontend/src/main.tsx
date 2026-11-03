import { Capacitor } from '@capacitor/core';

if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios') {
  document.documentElement.classList.add('picability-native-ios');
}
import {
    createRoot
} from 'react-dom/client';

import App from './app/App.tsx';

import {
    initializePwaUpdates
} from './pwaUpdateManager';

// @ts-ignore
import './styles/index.css';

/*
 * Register Picability's service worker and begin watching
 * for new deployed versions.
 */
initializePwaUpdates();

createRoot(
    document.getElementById(
        'root'
    )!
).render(
    <App />
);