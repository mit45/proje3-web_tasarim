import { subscribeProjects } from '../data/repository.js';

let projects = [];
const grid = document.getElementById('projects-grid');
const category = document.getElementById('filter-category');
const search = document.getElementById('search-box');
const minPrice = document.getElementById('price-min');
const maxPrice = document.getElementById('price-max');

function render(p){
  return `
  <article class="card">
    <img src="${p.image||'assets/img/project1.svg'}" alt="${p.title}" />
    <h4>${p.title}</h4>
    <p class="muted">${(p.description||'').slice(0,120)}</p>
    <div class="card-row card-tags">
      ${(p.tags||[]).map(t=>`<span class="tag">${t}</span>`).join('')}
    </div>
    <div class="card-row card-actions">
      <strong>${p.price ? p.price + ' TL' : '-'}</strong>
      <div>
        <a class="btn" href="project.html?id=${p.id}">Detaya Git</a>
        <button class="btn buy-btn" data-id="${p.id}">Satın Al</button>
      </div>
    </div>
  </article>
  `;
}

function applyFilters(){
  let out = projects.slice();
  const cat = category?.value || '';
  const q = search?.value?.toLowerCase() || '';
  const min = parseFloat(minPrice?.value) || 0;
  const max = parseFloat(maxPrice?.value) || Infinity;

  if (cat) out = out.filter(p => (p.tags||[]).includes(cat));
  if (q) out = out.filter(p => p.title.toLowerCase().includes(q));
  out = out.filter(p => (p.price||0) >= min && (p.price||0) <= max);
  grid.innerHTML = out.map(render).join('') || '<p>Uygun proje bulunamadı.</p>';
}

if (grid) {
  subscribeProjects((items) => {
    projects = items;
    applyFilters();
  });
}

// Add to cart helper — normalize storage and avoid duplicates
function addToCart(id){
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
    if(window.updateCartBadge) window.updateCartBadge();
    // optional: redirect to dashboard cart
    // location.href = 'dashboard.html#cart';
  }catch(e){ console.error('addToCart error', e); alert('Sepete eklenirken hata oluştu'); }
}

// Event delegation for buy buttons
if(grid){
  grid.addEventListener('click', (e)=>{
    const btn = e.target.closest('.buy-btn');
    if(!btn) return;
    const id = btn.dataset.id;
    if(!id) return;
    addToCart(id);
  });
}

if (category) category.addEventListener('change', applyFilters);
if (search) search.addEventListener('input', applyFilters);
if (minPrice) minPrice.addEventListener('input', applyFilters);
if (maxPrice) maxPrice.addEventListener('input', applyFilters);
