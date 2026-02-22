// Service to handle Video Recording storage using IndexedDB
// LocalStorage is too small for video files (5MB limit), so we use IndexedDB (GBs capacity)

const DB_NAME = 'MeetingRecordingsDB';
const STORE_NAME = 'videos';

export interface RecordingMetadata {
    id: string;
    date: string; // ISO string
    duration: string;
    size: string;
    name: string;
    hasTranscript?: boolean;
    folderId?: string | null;
}

// Initialize the database
const initDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 2); // Increment version
        
        request.onupgradeneeded = (event: any) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const saveRecording = async (blob: Blob, metadata: RecordingMetadata, transcript?: string): Promise<void> => {
    try {
        const db = await initDB();
        
        // 1. Save Blob & Transcript to IndexedDB
        await new Promise<void>((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.put({ 
                id: metadata.id, 
                blob, 
                transcript,
                created: new Date() 
            });
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });

        // 2. Save Metadata to LocalStorage
        // If no folder provided, use active folder (if set)
        const activeFolder = localStorage.getItem('meeting_recordings_active_folder');
        const metaToSave = { ...metadata, folderId: metadata.folderId ?? (activeFolder || null), hasTranscript: !!transcript };
        const existingMeta = JSON.parse(localStorage.getItem('meeting_recordings_meta') || '[]');
        localStorage.setItem('meeting_recordings_meta', JSON.stringify([metaToSave, ...existingMeta]));
        
        console.log('Recording saved successfully');
    } catch (error) {
        console.error('Error saving recording:', error);
        throw error;
    }
};

export const getRecordingTranscript = async (id: string): Promise<string | null> => {
    try {
        const db = await initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(id);
            
            request.onsuccess = () => resolve(request.result?.transcript || null);
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('Error retrieving transcript:', error);
        return null;
    }
};

export const getRecordingBlob = async (id: string): Promise<Blob | null> => {
    try {
        const db = await initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(id);
            
            request.onsuccess = () => resolve(request.result?.blob || null);
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('Error retrieving recording:', error);
        return null;
    }
};

export const getAllRecordingsMeta = (): RecordingMetadata[] => {
    try {
        const data = JSON.parse(localStorage.getItem('meeting_recordings_meta') || '[]');
        // Migration: ensure folderId exists
        return Array.isArray(data) ? data.map((r: any) => ({ ...r, folderId: r.folderId ?? null })) : [];
    } catch (e) {
        return [];
    }
};

export const deleteRecording = async (id: string): Promise<void> => {
    try {
        const db = await initDB();
        
        // 1. Delete from IndexedDB
        await new Promise<void>((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.delete(id);
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });

        // 2. Delete from LocalStorage
        const existingMeta = getAllRecordingsMeta();
        const newMeta = existingMeta.filter(r => r.id !== id);
        localStorage.setItem('meeting_recordings_meta', JSON.stringify(newMeta));
        
    } catch (error) {
        console.error('Error deleting recording:', error);
        throw error;
    }
};

// Folder management
export interface RecordingFolder {
    id: string;
    name: string;
    createdAt: string; // ISO
}

const FOLDERS_KEY = 'meeting_recording_folders';
const ACTIVE_FOLDER_KEY = 'meeting_recordings_active_folder';

export const getFolders = (): RecordingFolder[] => {
    try {
        const data = JSON.parse(localStorage.getItem(FOLDERS_KEY) || '[]');
        return Array.isArray(data) ? data : [];
    } catch {
        return [];
    }
};

export const saveFolders = (folders: RecordingFolder[]) => {
    localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
};

export const createFolder = (name: string): RecordingFolder => {
    const folder: RecordingFolder = { id: Date.now().toString(), name, createdAt: new Date().toISOString() };
    const folders = getFolders();
    const next = [folder, ...folders];
    saveFolders(next);
    return folder;
};

export const renameFolder = (id: string, name: string) => {
    const folders = getFolders().map(f => f.id === id ? { ...f, name } : f);
    saveFolders(folders);
};

export const deleteFolder = (id: string) => {
    const folders = getFolders().filter(f => f.id !== id);
    saveFolders(folders);
    
    // Reset active folder if it was the deleted one
    if (getActiveFolder() === id) {
        setActiveFolder(null);
    }
    
    // Move recordings in this folder to unfiled
    const list = getAllRecordingsMeta();
    const updated = list.map(r => r.folderId === id ? { ...r, folderId: null } : r);
    localStorage.setItem('meeting_recordings_meta', JSON.stringify(updated));
};

export const setActiveFolder = (id: string | null) => {
    if (id) {
        localStorage.setItem(ACTIVE_FOLDER_KEY, id);
    } else {
        localStorage.removeItem(ACTIVE_FOLDER_KEY);
    }
};

export const getActiveFolder = (): string | null => {
    return localStorage.getItem(ACTIVE_FOLDER_KEY);
};

export const moveRecordingToFolder = (recordingId: string, folderId: string | null) => {
    const list = getAllRecordingsMeta();
    const updated = list.map(r => r.id === recordingId ? { ...r, folderId } : r);
    localStorage.setItem('meeting_recordings_meta', JSON.stringify(updated));
};
