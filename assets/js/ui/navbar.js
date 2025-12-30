import { onAuthStateChanged, signOut } from '../services/firebaseService.js';

// Initialize header behaviors after header HTML fragment has been injected
export function initHeader() {
  const container = document.getElementById('site-header');
  if (!container) return;

  // Expose global helper to update cart badge when cart changes
  window.updateCartBadge = function(){
    try{
      const raw = localStorage.getItem('cart');
      let arr = [];
      if(raw){
        const parsed = JSON.parse(raw);
        if(Array.isArray(parsed)) arr = parsed;
        else if(typeof parsed === 'string') arr = [parsed];
        else if(parsed && Array.isArray(parsed.ids)) arr = parsed.ids;
        else if(parsed && Array.isArray(parsed.items)) arr = parsed.items;
      }
      const count = arr.length || 0;
      const cartEl = container.querySelector('.auth-icon[aria-label="Sepet"]');
      if(!cartEl) return;
      let badge = cartEl.querySelector('.cart-badge');
      if(!badge){
        badge = document.createElement('span');
        badge.className = 'cart-badge';
        cartEl.appendChild(badge);
      }
      if(count>0){ badge.textContent = String(count); badge.style.display='inline-block'; }
      else { badge.textContent='0'; badge.style.display='none'; }
    }catch(e){/* ignore */}
  };

  const updateAuthArea = (user) => {
    const authArea = container.querySelector('.auth-area');
    if (!authArea) return;
    // auth yüklenene kadar gizle (flash önleme)
    authArea.classList.remove('auth-loading');
    if (user) {
      authArea.innerHTML = `
        <div class="auth-icons">
          <a href="dashboard.html#cart" class="auth-icon" aria-label="Sepet">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 6h15l-1.5 9h-11L6 6z" stroke="#0b63d8" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><circle cx="10" cy="20" r="1" stroke="#0b63d8" stroke-width="1.4"/><circle cx="18" cy="20" r="1" stroke="#0b63d8" stroke-width="1.4"/></svg>
            <span class="cart-badge" aria-hidden="true">0</span>
          </a>
          <a href="dashboard.html#profile" class="auth-icon" aria-label="Profil">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="8" r="3" stroke="#0b63d8" stroke-width="1.4"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6" stroke="#0b63d8" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </a>
          <button id="btn-logout" class="auth-icon" aria-label="Çıkış">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2v6" stroke="#0b63d8" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M5.07 6.93a8 8 0 1 0 13.86 0" stroke="#0b63d8" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      `;
      const logoutBtn = authArea.querySelector('#btn-logout');
      if (logoutBtn) logoutBtn.addEventListener('click', async () => {
        await signOut();
        location.reload();
      });
      // update badge as soon as icons exist
      if(window.updateCartBadge) window.updateCartBadge();
    } else {
      const next = encodeURIComponent(location.pathname + location.search + location.hash);
      authArea.innerHTML = `<a href="auth.html?next=${next}" id="open-login" class="btn primary">Giriş / Kayıt</a>`;
      const loginLink = authArea.querySelector('#open-login');
      if (loginLink) loginLink.addEventListener('click', (e) => { e.preventDefault(); location.href = `auth.html?next=${next}`; });
    }
  };

  // Subscribe to auth state and update auth area
  // Mark auth area as loading until onAuthStateChanged fires
  const authAreaInit = container.querySelector('.auth-area');
  if(authAreaInit) authAreaInit.classList.add('auth-loading');
  const unsub = onAuthStateChanged((user) => {
    updateAuthArea(user);
  });

  // update once on init (will be no-op until auth area created)
  if(window.updateCartBadge) window.updateCartBadge();

  // also listen storage events from other tabs
  window.addEventListener('storage', (e)=>{
    if(e.key === 'cart'){
      try{ if(window.updateCartBadge) window.updateCartBadge(); }catch(e){}
    }
  });

  return unsub;
}
