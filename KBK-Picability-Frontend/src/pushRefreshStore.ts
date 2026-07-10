const DATABASE_NAME = 'picability-push-state';
const STORE_NAME = 'state';
const DATABASE_VERSION = 1;
const REFRESH_KEY = 'refreshRequired';

function openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

        request.onupgradeneeded = () => {
            const database = request.result;

            if (!database.objectStoreNames.contains(STORE_NAME)) {
                database.createObjectStore(STORE_NAME);
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

export async function markPushRefreshRequired(): Promise<void> {
    const database = await openDatabase();

    await new Promise<void>((resolve, reject) => {
        const transaction = database.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        store.put(Date.now(), REFRESH_KEY);

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });

    database.close();
}

export async function consumePushRefreshRequired(): Promise<boolean> {
    const database = await openDatabase();

    const refreshRequired = await new Promise<boolean>((resolve, reject) => {
        const transaction = database.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(REFRESH_KEY);

        request.onsuccess = () => {
            const exists = request.result !== undefined;

            if (exists) {
                store.delete(REFRESH_KEY);
            }

            resolve(exists);
        };

        request.onerror = () => reject(request.error);
    });

    database.close();
    return refreshRequired;
}