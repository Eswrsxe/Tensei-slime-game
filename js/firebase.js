import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getAuth, signInAnonymously, GoogleAuthProvider, linkWithPopup } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyCI7YAu9swUPchFITltUqURLnPf0QFHkV0",
    authDomain: "tensei-slime-game.firebaseapp.com",
    projectId: "tensei-slime-game",
    storageBucket: "tensei-slime-game.firebasestorage.app",
    messagingSenderId: "261980077317",
    appId: "1:261980077317:web:63302f528e0c5c31ef8b6c"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
});

export { db, auth, signInAnonymously, GoogleAuthProvider, linkWithPopup };