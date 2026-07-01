// ================================================================
//  Firebase — All Firestore read / write operations
// ================================================================
import {
    doc, getDoc, setDoc, updateDoc,
    onSnapshot, collection, query, orderBy, limit, getDocs
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { db } from './firebase-init.js';

// ── Profile ────────────────────────────────────────────────────

export const loadProfile = async (user) => {
    const ref  = doc(db, 'users', user.uid);
    const snap = await getDoc(ref);
    if (snap.exists()) return snap.data();
    const defaultProfile = {
        name:   user.displayName  || 'New User',
        city:   '',
        email:  user.email        || '',
        phone:  user.phoneNumber  || '',
        avatar: user.photoURL     || ''
    };
    await setDoc(ref, defaultProfile);
    return defaultProfile;
};

export const saveProfile = async (uid, data) => {
    await setDoc(doc(db, 'users', uid), data, { merge: true });
};

// ── Garden sensor data ─────────────────────────────────────────

export const subscribeGarden = (gardenName, callback) => {
    const ref = doc(db, 'sensorReadings', gardenName);
    return onSnapshot(ref,
        (snap) => {
            if (snap.exists()) {
                callback(snap.data());
            } else {
                const defaults = {
                    soilMoisture:     0,
                    temperature:      0,
                    humidity:         0,
                    irrigationStatus: 'Off',
                    controlMode:      'Auto',
                    manualControl:    false,
                    rainNow:          0,
                    season:           'summer'
                };
                setDoc(ref, defaults);
                callback(defaults);
            }
        },
        (err) => console.error(`Garden snapshot error [${gardenName}]:`, err)
    );
};

// ── Irrigation history (live listener — last 20) ───────────────

export const subscribeHistory = (gardenName, callback) => {
    const q = query(
        collection(db, 'sensorReadings', gardenName, 'history'),
        orderBy('timestamp', 'desc'),
        limit(20)
    );
    return onSnapshot(q,
        (snap) => callback(snap.docs.map(d => d.data())),
        (err)  => { console.error(`History error [${gardenName}]:`, err); callback(null); }
    );
};

// ── Irrigation history (one-time fetch — all records for insights) ─

/**
 * Fetches ALL history entries for a garden (no limit).
 * Used for water savings calculations.
 * Returns array of entry objects, sorted ascending by timestamp.
 */
export const fetchGardenHistory = async (gardenName) => {
    try {
        const q    = query(
            collection(db, 'sensorReadings', gardenName, 'history'),
            orderBy('timestamp', 'asc')
        );
        const snap = await getDocs(q);
        return snap.docs.map(d => d.data());
    } catch (err) {
        console.error(`fetchGardenHistory error [${gardenName}]:`, err);
        return [];
    }
};

// ── Controls ───────────────────────────────────────────────────

export const setControlMode = async (gardenName, mode) => {
    await updateDoc(doc(db, 'sensorReadings', gardenName), { controlMode: mode });
};

export const setManualControl = async (gardenName, state) => {
    await updateDoc(doc(db, 'sensorReadings', gardenName), { manualControl: state });
};
