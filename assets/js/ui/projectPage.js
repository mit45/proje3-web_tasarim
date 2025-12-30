import { getProjectById, createOrder } from '../data/repository.js';
import { getCurrentUser } from '../services/firebaseService.js';

async function init(){
  const params = new URLSearchParams(location.search);
  const id = params.get('id');
  const buy = params.get('buy');
  const container = document.getElementById('project-detail');
  if(!id){ container.innerHTML = '<p>Geçersiz proje.</p>'; return; }
  const p = await getProjectById(id);
  if(!p){ container.innerHTML = '<p>Proje bulunamadı.</p>'; return; }

  container.innerHTML = `
    <article class="card">
      <img src="${p.image||'assets/img/project1.svg'}" alt="${p.title}" />
      <h2>${p.title}</h2>
      <p class="muted">${p.description||''}</p>
      <ul>
        ${(p.features||[]).map(f=>`<li>${f}</li>`).join('')}
      </ul>
      <div style="display:flex;justify-content:space-between;align-items:center">
        <strong>${p.price ? p.price + ' TL' : 'Fiyat Yok'}</strong>
        <button id="buyBtn" class="btn primary">Satın Al</button>
      </div>
    </article>
  `;

  const buyBtn = document.getElementById('buyBtn');
  buyBtn.addEventListener('click', async ()=>{
    // Add to cart (localStorage) — keep consistent with projects list behavior
    try{
      const raw = localStorage.getItem('cart');
      let arr = [];
      if(raw){
        const parsed = JSON.parse(raw);
        if(Array.isArray(parsed)) arr = parsed;
        else if(typeof parsed === 'string') arr = [parsed];
        else if(parsed && Array.isArray(parsed.ids)) arr = parsed.ids;
      }
      if(!arr.includes(id)) arr.push(id);
      localStorage.setItem('cart', JSON.stringify(arr));
      alert('Ürün sepete eklendi');
      // redirect to dashboard cart view
      if(window.updateCartBadge) window.updateCartBadge();
      location.href = 'dashboard.html#cart';
    }catch(e){ console.error('addToCart error', e); alert('Sepete eklenirken hata oluştu'); }
  });

  if(buy){ buyBtn.click(); }
}

init();
