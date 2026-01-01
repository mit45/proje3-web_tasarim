import { includeHtml } from './includeHtml.js';
import { initHeader } from './ui/navbar.js';
import './auth.js';

document.addEventListener('DOMContentLoaded', async () => {
  await includeHtml();
  ensureFooterSocials();
  initHeader();
});

function ensureFooterSocials(){
  try{
    const container = document.querySelector('.site-footer .socials');
    if(!container) return;
    const expected = [
      {label:'LinkedIn', href:'#', svg:`<svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="#ffffff" d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-14h4v2.2c.9-1.3 2.8-2.2 4-2.2zM2 9h4v14h-4zM4 3a2 2 0 1 1 0 4 2 2 0 0 1 0-4z"/></svg>`},
      {label:'GitHub', href:'#', svg:`<svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="#ffffff" d="M12 .5a12 12 0 0 0-3.8 23.4c.6.1.8-.2.8-.5v-1.9c-3.3.7-4-1.6-4-1.6-.5-1.3-1.2-1.6-1.2-1.6-1-.7.1-.7.1-.7 1.2.1 1.9 1.3 1.9 1.3 1 .1.6 1.9 2.8 1.3.1-.9.4-1.4.7-1.7-2.6-.3-5.4-1.3-5.4-5.8 0-1.3.4-2.4 1.1-3.3-.1-.3-.5-1.6.1-3.3 0 0 .9-.3 3 .1a10 10 0 0 1 5.5 0c2.1-.4 3-.1 3-.1.6 1.7.2 3 .1 3.3.7.9 1.1 2 1.1 3.3 0 4.5-2.8 5.5-5.4 5.8.4.3.7 1 .7 2v3c0 .3.2.6.8.5A12 12 0 0 0 12 .5z"/></svg>`},
      {label:'Twitter', href:'#', svg:`<svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="#ffffff" d="M23 3a10.9 10.9 0 0 1-3.14 1.53A4.48 4.48 0 0 0 22.43.36a9.06 9.06 0 0 1-2.88 1.1A4.52 4.52 0 0 0 16.5 0c-2.5 0-4.5 2.2-4.5 4.9 0 .38.04.75.12 1.1A12.94 12.94 0 0 1 1.64.88 4.82 4.82 0 0 0 2 6.1a4.47 4.47 0 0 1-2-.56v.06c0 2.2 1.54 4.04 3.58 4.46a4.52 4.52 0 0 1-2 .08c.56 1.8 2.2 3.1 4.14 3.14A9.06 9.06 0 0 1 0 18.54 12.78 12.78 0 0 0 6.92 20c8.3 0 12.85-7.1 12.85-13.27 0-.2 0-.39-.02-.58A9.22 9.22 0 0 0 23 3z"/></svg>`},
      {label:'Instagram', href:'#', svg:`<svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="#ffffff" d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm5 6.5A4.5 4.5 0 1 0 16.5 13 4.5 4.5 0 0 0 12 8.5zm5.2-3.6a1.08 1.08 0 1 0 1.08 1.08A1.08 1.08 0 0 0 17.2 4.9z"/></svg>`},
      {label:'Facebook', href:'#', svg:`<svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="#ffffff" d="M22 12a10 10 0 1 0-11 9.95V14.7h-2.9v-3.3H11V9.2c0-2.9 1.72-4.5 4.36-4.5 1.26 0 2.58.22 2.58.22v2.84h-1.45c-1.43 0-1.87.88-1.87 1.78v2.16h3.18l-.51 3.3h-2.67v7.25A10 10 0 0 0 22 12z"/></svg>`}
    ];

    expected.forEach(item=>{
      const existing = container.querySelector(`a[aria-label="${item.label}"]`);
      if(!existing){
        const a = document.createElement('a');
        a.className = 'social-link';
        a.href = item.href;
        a.setAttribute('aria-label', item.label);
        a.title = item.label;
        a.innerHTML = item.svg;
        container.appendChild(a);
      } else {
        // If anchor exists but svg missing or empty, inject svg
        if(!existing.querySelector('svg') || existing.querySelectorAll('svg').length === 0){
          existing.innerHTML = item.svg;
        }
      }
    });

    // Observe container for changes and re-run to recover removed icons
    if(!window.__socialsObserver && container){
      try{
        const obs = new MutationObserver(()=>{
          ensureFooterSocials();
        });
        obs.observe(container, { childList:true, subtree:true });
        window.__socialsObserver = obs;
      }catch(e){/* ignore */}
    }
  }catch(e){console.warn('ensureFooterSocials error', e)}
}

export function showMessage(target, text, type = 'info'){
  const el = document.getElementById(target);
  if(!el) return;
  el.textContent = text;
  el.className = type === 'error' ? 'muted error' : 'muted success';
  setTimeout(()=>{ el.textContent = ''; }, 4000);
}
