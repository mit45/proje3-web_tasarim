import { handleSignIn, handleSignUp, handleReset } from '../auth.js';
import { onAuthStateChanged } from '../services/firebaseService.js';

const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const resetForm = document.getElementById('resetForm');
const showRegister = document.getElementById('showRegister');
const registerBox = document.getElementById('registerBox');
const showReset = document.getElementById('showReset');
const resetBox = document.getElementById('resetBox');
const feedback = document.getElementById('authFeedback');

function setFeedback(msg, isError = true){
  if(!feedback) return;
  feedback.textContent = msg;
  feedback.style.color = isError ? '#c53030' : '#16a34a';
}

if(showRegister){
  showRegister.addEventListener('click', (e)=>{
    e.preventDefault(); registerBox.style.display = 'block'; resetBox.style.display = 'none';
  });
}
if(showReset){
  showReset.addEventListener('click', (e)=>{ e.preventDefault(); resetBox.style.display = 'block'; registerBox.style.display = 'none'; });
}

if(loginForm){
  loginForm.addEventListener('submit', async (e)=>{
    e.preventDefault();
    setFeedback('');
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value.trim();
    try{
      await handleSignIn(email, password);
      setFeedback('Giriş başarılı, yönlendiriliyorsunuz...', false);
      setTimeout(()=> location.href = getNextRedirect(), 600);
    }catch(err){ console.error(err); setFeedback(err.message || 'Giriş hatası'); }
  });
}

if(registerForm){
  registerForm.addEventListener('submit', async (e)=>{
    e.preventDefault();
    setFeedback('');
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value.trim();
    try{
      await handleSignUp(email, password);
      setFeedback('Kayıt başarılı, giriş yapılıyor...', false);
      setTimeout(()=> location.href = getNextRedirect(), 600);
    }catch(err){ console.error(err); setFeedback(err.message || 'Kayıt hatası'); }
  });
}

if(resetForm){
  resetForm.addEventListener('submit', async (e)=>{
    e.preventDefault();
    setFeedback('');
    const email = document.getElementById('reset-email').value.trim();
    try{
      await handleReset(email);
      setFeedback('Sıfırlama maili gönderildi.', false);
    }catch(err){ console.error(err); setFeedback(err.message || 'Sıfırlama hatası'); }
  });
}

// If user already signed in, redirect to dashboard
function getNextRedirect(){
  try{
    const params = new URLSearchParams(window.location.search);
    const next = params.get('next');
    if(next) return next;
    // if referrer is same origin, return there
    if(document.referrer){
      try{ const ref = new URL(document.referrer); if(ref.origin === location.origin) return document.referrer; }catch(e){}
    }
  }catch(e){}
  return 'dashboard.html';
}

onAuthStateChanged((u)=>{ if(u) location.href = getNextRedirect(); });
