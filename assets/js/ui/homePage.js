import { subscribeProjects } from '../data/repository.js';

function renderCard(p){
  return `
    <article class="card">
      <img src="${p.image || 'assets/img/project1.svg'}" alt="${p.title}" />
      <h4>${p.title}</h4>
      <p class="muted">${(p.description||'').slice(0,100)}</p>
      <div class="card-row">
        <strong>${p.price ? p.price + ' TL' : 'Fiyat Bilgisi'}</strong>
        <a class="btn" href="project.html?id=${p.id}">Detay</a>
      </div>
    </article>
  `;
}

const grid = document.getElementById('featured-grid');
if (grid) {
  subscribeProjects((items) => {
    const list = items.filter(i => i.isActive !== false).slice(0,4);
    grid.innerHTML = list.map(renderCard).join('');
  });
}
