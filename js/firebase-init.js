// ================================================================
//  Firebase Initialization — imported by all other modules
//  Do NOT call initializeApp() anywhere else
// ================================================================
import { initializeApp }              from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore }               from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { firebaseConfig } from './config.js';

const app = initializeApp(firebaseConfig);

export const db       = getFirestore(app);
export const auth     = getAuth(app);
export const provider = new GoogleAuthProvider();
