// ================================================================
//  Auth — Google Sign-In, Sign-Out, Role Checking
// ================================================================
import {
    onAuthStateChanged,
    signInWithPopup,
    signOut as fbSignOut
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { auth, provider, db } from './firebase-init.js';

/**
 * Checks if the signed-in user's email is in the controllers list.
 * Reads from Firestore: config/roles → { controllers: ["email1", "email2"] }
 * Returns 'controller' or 'viewer'.
 */
export const checkRole = async (email) => {
    try {
        const snap = await getDoc(doc(db, 'config', 'roles'));
        if (!snap.exists()) return 'viewer';
        const controllers = snap.data().controllers || [];
        return controllers.includes(email) ? 'controller' : 'viewer';
    } catch (err) {
        console.error('checkRole failed:', err);
        return 'viewer'; // fail safe — never grant access on error
    }
};

/** Trigger Google Sign-In popup */
export const signInWithGoogle = async () => {
    try {
        await signInWithPopup(auth, provider);
    } catch (err) {
        console.error('Sign-in error:', err);
        alert(`Sign-in failed: ${err.message}`);
    }
};

/** Sign out the current user */
export const signOutUser = () => fbSignOut(auth).catch(console.error);

/** Subscribe to auth state changes */
export const onAuthChange = (callback) => onAuthStateChanged(auth, callback);
