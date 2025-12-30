import { auth, db } from '../config/firebaseConfig.js';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  sendPasswordResetEmail,
  onAuthStateChanged as fbOnAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';

import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';

// Auth servisleri (UI katmanı doğrudan SDK çağırmasın, bu fonksiyonları kullansın)
export async function signUp(email, password) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (err) {
    throw err;
  }
}

export async function signIn(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (err) {
    throw err;
  }
}

export async function signOut() {
  await fbSignOut(auth);
}

export async function resetPassword(email) {
  await sendPasswordResetEmail(auth, email);
}

export function onAuthStateChanged(fn) {
  return fbOnAuthStateChanged(auth, fn);
}

// Returns a Promise that resolves with the current user (or null) once Firebase has initialized auth state
export function getCurrentUser() {
  return new Promise((resolve) => {
    const unsub = fbOnAuthStateChanged(auth, (user) => {
      resolve(user);
      unsub();
    });
  });
}

export async function saveContactMessage(message) {
  try {
    const docRef = await addDoc(collection(db, 'contact_messages'), {
      ...message,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (err) {
    throw err;
  }
}

/* Firestore Security Rules (örnek, comment):
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /orders/{orderId} {
      allow create: if request.auth != null;
      allow read, update, delete: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
*/
