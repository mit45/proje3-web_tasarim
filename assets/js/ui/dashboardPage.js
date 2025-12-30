import { onAuthStateChanged } from '../services/firebaseService.js';
import { subscribeUserOrders, getUserById, updateUserProfile, createOrder, getProjectById, updateOrderStatus } from '../data/repository.js';

let ordersUnsub = null;

// Apply hash-based visibility immediately to avoid flash of default sections
// Initially hide all dashboard sections to avoid visual flash
(function immediateHashApply(){
  try{
    const ps = document.getElementById('profile-section');
    const cs = document.getElementById('cart-section');
    const os = document.getElementById('orders-section');
    if(ps) ps.classList.add('hidden');
    if(cs) cs.classList.add('hidden');
    if(os) os.classList.add('hidden');
  }catch(e){/* ignore */}
})();

onAuthStateChanged(async (user) => {
  if (!user) {
    // If user is not signed in, still render local cart so guest can see items.
    // Buying will require signin (handled in renderCartForUser).
    renderCartForUser(null);
    return;
  }

  const u = await getUserById(user.uid).catch(()=>null);
  if (u) {
    const nameEl = document.getElementById('profile-name');
    const surnameEl = document.getElementById('profile-surname');
    const emailEl = document.getElementById('profile-email');
    const phoneEl = document.getElementById('profile-phone');
    const addressEl = document.getElementById('profile-address');
    if(nameEl) nameEl.value = u.name || '';
    if(surnameEl) surnameEl.value = u.surname || '';
    if(emailEl) emailEl.value = user.email || u.email || '';
    if(phoneEl) phoneEl.value = u.phone || '';
    if(addressEl) addressEl.value = u.address || '';
  }

  if (ordersUnsub) ordersUnsub();
  ordersUnsub = subscribeUserOrders(user.uid, async (items) => {
    const tbody = document.querySelector('#orders-table tbody');
    if(!tbody) return;
    // Build rows by resolving project titles
    const rows = await Promise.all(items.map(async (o) => {
      const p = await getProjectById(o.projectId).catch(()=>null);
      const title = p ? (p.title || o.projectId) : o.projectId;
      const date = o.createdAt ? new Date(o.createdAt.seconds*1000).toLocaleString() : '-';
      const status = o.status || '-';
      const cancelBtn = (status !== 'İptal Edildi' && status.toLowerCase() !== 'completed' && status.toLowerCase() !== 'paid' && status !== 'Tamamlandı') ? `<button class="btn cancel-order" data-id="${o.id}">Sipariş İptal</button>` : '';
      return `<tr data-id="${o.id}">
        <td>${title}</td>
        <td>${date}</td>
        <td>${status}</td>
        <td>${cancelBtn}</td>
      </tr>`;
    }));
    tbody.innerHTML = rows.join('');
    // attach cancel handlers
    tbody.querySelectorAll('.cancel-order').forEach(btn=>{
      btn.addEventListener('click', async (e)=>{
        const id = btn.dataset.id; btn.disabled = true;
        try{
          await updateOrderStatus(id, 'İptal Edildi');
          alert('Sipariş iptal edildi');
        }catch(err){ console.error(err); alert('İptal sırasında hata oluştu'); }
        btn.disabled = false;
      });
    });
    // Debug logs
    console.log('subscribeUserOrders -> items for', user.uid, items);
      // Do not change visible section here; visibility is controlled by hash or explicit user actions
  });
  // render cart for this user (if any stored locally)
  renderCartForUser(user.uid);
  // Show orders by default for logged-in users so they can see their pending/completed orders
    // Do not force-show orders on auth change; respect current hash (profile/cart)
  // handle hash on load
  handleHash(window.location.hash);
});

// Listen to hash changes (e.g., clicking header icons) and show relevant section
window.addEventListener('hashchange', () => handleHash(window.location.hash));

function handleHash(hash){
  if(!hash) return showOnlySection(null);
  if(hash === '#cart'){
    showOnlySection('cart');
    const cs = document.getElementById('cart-section'); if(cs) cs.scrollIntoView({behavior:'smooth'});
  } else if(hash === '#profile'){
    showOnlySection('profile');
    const ps = document.getElementById('profile-section'); if(ps) ps.scrollIntoView({behavior:'smooth'});
  } else {
    showOnlySection(null);
  }
}

// debug helper removed

function showOnlySection(name){
  const profileSection = document.getElementById('profile-section');
  const cartSection = document.getElementById('cart-section');
  const ordersSection = document.getElementById('orders-section');
  if(name === 'cart'){
    if(profileSection) profileSection.classList.add('hidden');
    if(ordersSection) ordersSection.classList.remove('hidden');
    if(cartSection) cartSection.classList.remove('hidden');
  } else if(name === 'profile'){
    if(profileSection) profileSection.classList.remove('hidden');
    if(ordersSection) ordersSection.classList.add('hidden');
    if(cartSection) cartSection.classList.add('hidden');
  } else {
    // default: hide all sections (dashboard acts as empty landing)
    if(profileSection) profileSection.classList.add('hidden');
    if(ordersSection) ordersSection.classList.add('hidden');
    if(cartSection) cartSection.classList.add('hidden');
  }
}

const profileForm = document.getElementById('profileForm');
if(profileForm){
  profileForm.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const name = document.getElementById('profile-name').value.trim();
    const surname = document.getElementById('profile-surname').value.trim();
    const phone = document.getElementById('profile-phone').value.trim();
    const address = document.getElementById('profile-address').value.trim();
    onAuthStateChanged(async (u)=>{
      if(!u) return;
      try{
        await updateUserProfile(u.uid, { name, surname, phone, address });
        alert('Profil güncellendi');
      }catch(err){ console.error(err); alert('Hata'); }
    })();
  });
}

// --- Cart helpers ---
function readCart(){
  try{
    const c = localStorage.getItem('cart');
    if(!c) return [];
    const parsed = JSON.parse(c);
    if (Array.isArray(parsed)) return parsed;
    // If a single string id was stored, return as array
    if (typeof parsed === 'string') return [parsed];
    // If an object with ids/items property was stored, try to extract
    if (parsed && Array.isArray(parsed.ids)) return parsed.ids;
    if (parsed && Array.isArray(parsed.items)) return parsed.items;
    return [];
  }catch(e){ return []; }
}

function removeFromCart(id){
  const c = readCart().filter(x=>x!==id);
  localStorage.setItem('cart', JSON.stringify(c));
  if(window.updateCartBadge) window.updateCartBadge();
}

async function renderCartForUser(userId){
  const cartIds = readCart();
  const cartSection = document.getElementById('cart-section');
  const tbody = document.querySelector('#cart-table tbody');
  if(!cartSection || !tbody) return;
  // display cart only when user is viewing cart; otherwise keep it hidden
  if(!cartIds || cartIds.length===0){
    if(window.location.hash === '#cart'){
      cartSection.classList.remove('hidden');
      tbody.innerHTML = `<tr><td colspan="3">Sepetinizde ürün yok.</td></tr>`;
    } else {
      cartSection.classList.add('hidden');
    }
    return;
  }
  if(window.location.hash === '#cart') cartSection.classList.remove('hidden');
  const rows = [];
  for(const id of cartIds){
    const p = await getProjectById(id).catch(()=>null);
    rows.push({ id, title: p ? p.title : id, price: p && p.price ? (p.price + ' TL') : '-' });
  }
  tbody.innerHTML = rows.map(r => `
    <tr data-id="${r.id}">
      <td>${r.title}</td>
      <td>${r.price}</td>
      <td><button class="btn buy-from-cart" data-id="${r.id}">Satın Al</button> <button class="btn remove-from-cart" data-id="${r.id}">Kaldır</button></td>
    </tr>
  `).join('');

  // attach handlers
  tbody.querySelectorAll('.buy-from-cart').forEach(btn=>{
    btn.addEventListener('click', async (e)=>{
      const id = btn.dataset.id; btn.disabled = true;
      try{
        if(!userId){
          // guest: redirect to login/register and preserve return to cart
          const next = encodeURIComponent(location.pathname + '#cart');
          alert('Lütfen satın alma işlemi için giriş yapın.');
          location.href = `auth.html?next=${next}`;
          return;
        }
        const orderId = await createOrder({ userId, projectId: id });
        removeFromCart(id);
        renderCartForUser(userId);
        alert('Sipariş oluşturuldu — ID: ' + orderId + '\nAdmininize bir bildirim gönderilecektir.');
        // Show orders section so user immediately sees the pending order
        try{
          showOnlySection('orders');
          const os = document.getElementById('orders-section'); if(os) os.scrollIntoView({behavior:'smooth'});
        }catch(e){/* ignore */}
      }catch(err){ console.error(err); alert('Sipariş oluşturulurken hata oluştu'); }
      btn.disabled = false;
    });
  });
  tbody.querySelectorAll('.remove-from-cart').forEach(btn=>{
    btn.addEventListener('click', (e)=>{
      const id = btn.dataset.id; removeFromCart(id); renderCartForUser(userId);
    });
  });
}
