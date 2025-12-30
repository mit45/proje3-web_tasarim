// Firebase yapılandırma ve başlatma (buraya kendi Firebase config'inizi ekleyin)
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js';

const firebaseConfig = {
  apiKey: "AIzaSyA5X86cSzLjza0qiJVDQ1oeSoLpNREvQyI",
  authDomain: "main-proje-a835c.firebaseapp.com",
  databaseURL: "https://main-proje-a835c-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "main-proje-a835c",
  storageBucket: "main-proje-a835c.firebasestorage.app",
  messagingSenderId: "666300046318",
  appId: "1:666300046318:web:c3d1d644fee183f9bbccff",
  measurementId: "G-M9X0643D4N"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
