import { signIn, signUp, resetPassword } from './services/firebaseService.js';

// Basit auth form modal yerine dashboard sayfasında yönlendirme kullanıldı.
// Bu dosyada örnek fonksiyonlar bulunur; gerçek formlar eklenirse kullanılabilir.
export async function handleSignUp(email, password){
  try{ const u = await signUp(email,password); return u; }catch(e){ throw e; }
}

export async function handleSignIn(email, password){
  try{ const u = await signIn(email,password); return u; }catch(e){ throw e; }
}

export async function handleReset(email){
  try{ await resetPassword(email); }catch(e){ throw e; }
}
