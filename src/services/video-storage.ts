/**
 * IndexedDB Video Storage Service
 * Stores victory videos separately from localStorage to handle larger file sizes
 * IndexedDB typically allows 50MB-100MB+ per origin
 */

const DB_NAME = 'autocade-videos';
const DB_VERSION = 1;
const STORE_NAME = 'victoryVideos';

let dbInstance: IDBDatabase | null = null;

// Initialize the database
function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        if (dbInstance) {
            resolve(dbInstance);
            return;
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            console.error('Failed to open IndexedDB:', request.error);
            reject(request.error);
        };

        request.onsuccess = () => {
            dbInstance = request.result;
            resolve(dbInstance);
        };

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'playerId' });
            }
        };
    });
}

/**
 * Save a victory video for a player
 */
export async function saveVideo(playerId: string, videoData: string): Promise<void> {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);

            const request = store.put({ playerId, videoData, savedAt: Date.now() });

            request.onsuccess = () => {
                console.log(`Video saved for player ${playerId}`);
                resolve();
            };
            request.onerror = () => {
                console.error('Failed to save video:', request.error);
                reject(request.error);
            };
        });
    } catch (error) {
        console.error('Failed to save video to IndexedDB:', error);
        throw error;
    }
}

/**
 * Load a victory video for a player
 */
export async function loadVideo(playerId: string): Promise<string | null> {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readonly');
            const store = transaction.objectStore(STORE_NAME);

            const request = store.get(playerId);

            request.onsuccess = () => {
                const result = request.result;
                resolve(result ? result.videoData : null);
            };
            request.onerror = () => {
                console.error('Failed to load video:', request.error);
                reject(request.error);
            };
        });
    } catch (error) {
        console.error('Failed to load video from IndexedDB:', error);
        return null;
    }
}

/**
 * Delete a victory video for a player
 */
export async function deleteVideo(playerId: string): Promise<void> {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);

            const request = store.delete(playerId);

            request.onsuccess = () => {
                console.log(`Video deleted for player ${playerId}`);
                resolve();
            };
            request.onerror = () => {
                console.error('Failed to delete video:', request.error);
                reject(request.error);
            };
        });
    } catch (error) {
        console.error('Failed to delete video from IndexedDB:', error);
        throw error;
    }
}

/**
 * Load all videos and return a map of playerId -> videoData
 */
export async function loadAllVideos(): Promise<Map<string, string>> {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readonly');
            const store = transaction.objectStore(STORE_NAME);

            const request = store.getAll();

            request.onsuccess = () => {
                const videos = new Map<string, string>();
                for (const item of request.result) {
                    videos.set(item.playerId, item.videoData);
                }
                resolve(videos);
            };
            request.onerror = () => {
                console.error('Failed to load all videos:', request.error);
                reject(request.error);
            };
        });
    } catch (error) {
        console.error('Failed to load videos from IndexedDB:', error);
        return new Map();
    }
}

export const videoStorage = {
    save: saveVideo,
    load: loadVideo,
    delete: deleteVideo,
    loadAll: loadAllVideos,
};

export default videoStorage;
