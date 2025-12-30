import { includeHtml } from './includeHtml.js';
import { initHeader } from './ui/navbar.js';
import './auth.js';

document.addEventListener('DOMContentLoaded', async () => {
  await includeHtml();
  initHeader();
});

export function showMessage(target, text, type = 'info'){
  const el = document.getElementById(target);
  if(!el) return;
  el.textContent = text;
  el.className = type === 'error' ? 'muted error' : 'muted success';
  setTimeout(()=>{ el.textContent = ''; }, 4000);
}
