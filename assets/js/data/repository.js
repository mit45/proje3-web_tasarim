import { db } from '../config/firebaseConfig.js';
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  doc,
  getDoc,
  addDoc,
  setDoc,
  serverTimestamp,
  getDocs,
  updateDoc
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';

export function subscribeProjects(callback) {
  const q = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const items = [];
    snapshot.forEach(docSnap => items.push({ id: docSnap.id, ...docSnap.data() }));
    callback(items);
  });
}

export async function getProjectById(id) {
  const d = await getDoc(doc(db, 'projects', id));
  if (!d.exists()) return null;
  return { id: d.id, ...d.data() };
}

export async function createOrder({ userId, projectId, status = 'Beklemede' }) {
  const docRef = await addDoc(collection(db, 'orders'), {
    userId,
    projectId,
    status,
    notified: false,
    createdAt: serverTimestamp()
  });
  return docRef.id;
}

// Optional helper to mark order as notified (used by backend functions)
export async function markOrderNotified(orderId){
  try{
    const ref = doc(db, 'orders', orderId);
    await updateDoc(ref, { notified: true, notifiedAt: serverTimestamp() });
  }catch(e){ console.warn('markOrderNotified failed', e); }
}

export async function updateOrderStatus(orderId, status){
  try{
    const ref = doc(db, 'orders', orderId);
    await updateDoc(ref, { status, updatedAt: serverTimestamp() });
    return true;
  }catch(e){
    console.warn('updateOrderStatus failed', e);
    throw e;
  }
}

export function subscribeUserOrders(userId, callback) {
  if (!userId) return () => {};
  const q = query(collection(db, 'orders'), where('userId', '==', userId), orderBy('createdAt', 'desc'));
  // Attach error handler: Firestore may require a composite index for this query.
  // If snapshot fails due to missing index, fallback to a simpler fetch and client-side sort.
  const unsubscribe = onSnapshot(q, (snap) => {
    const items = [];
    snap.forEach(s => items.push({ id: s.id, ...s.data() }));
    callback(items);
  }, (error) => {
    // If error indicates a missing composite index, don't spam the console.
    const msg = (error && error.message) ? String(error.message) : '';
    if (msg.includes('requires an index') || (error && error.code === 'failed-precondition')) {
      console.warn('Orders snapshot: missing composite index; using fallback fetch.');
    } else {
      console.warn('Orders snapshot error (fallback will run):', error && error.message ? error.message : error);
    }
    (async () => {
      try {
        const qFallback = query(collection(db, 'orders'), where('userId', '==', userId));
        const docs = await getDocs(qFallback);
        const items = [];
        docs.forEach(s => items.push({ id: s.id, ...s.data() }));
        // Try to sort by createdAt if available (serverTimestamp stores as Timestamp)
        items.sort((a, b) => {
          const ta = a.createdAt && a.createdAt.seconds ? a.createdAt.seconds : 0;
          const tb = b.createdAt && b.createdAt.seconds ? b.createdAt.seconds : 0;
          return tb - ta;
        });
        callback(items);
      } catch (e) {
        console.warn('Fallback orders fetch failed:', e && e.message ? e.message : e);
        callback([]);
      }
    })();
  });

  return unsubscribe;
}

export async function saveContactMessage(data) {
  const docRef = await addDoc(collection(db, 'contact_messages'), {
    ...data,
    createdAt: serverTimestamp()
  });
  return docRef.id;
}

export async function getUserById(uid) {
  const d = await getDoc(doc(db, 'users', uid));
  if (!d.exists()) return null;
  return { id: d.id, ...d.data() };
}

export async function updateUserProfile(uid, payload) {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, { ...payload, updatedAt: serverTimestamp() });
}

export async function createProject(data) {
  const docRef = await addDoc(collection(db, 'projects'), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return docRef.id;
}

export async function createOrUpdateUser(uid, data) {
  const ref = doc(db, 'users', uid);
  await setDoc(ref, { ...data, uid, createdAt: serverTimestamp() }, { merge: true });
}
