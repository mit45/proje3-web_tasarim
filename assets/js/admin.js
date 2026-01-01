// Admin panel uses Google Sign-In only.

// Optional Firebase sync helpers (imported dynamically when used)
import { createProject, updateProject, deleteProject, fetchAllProjects, isAdmin } from './data/repository.js';
import { auth } from './config/firebaseConfig.js';
import { GoogleAuthProvider, signInWithPopup, signOut as fbSignOut, onAuthStateChanged, getIdTokenResult } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';

function $(s){return document.querySelector(s)}
function $all(s){return Array.from(document.querySelectorAll(s))}

// password hashing removed; Google Sign-In only

function ensureData(){
  if(!localStorage.getItem('siteData')){
    const init = {
      site:{title:'Projelerim - Ümit Topuz',description:'Ümit Topuz projeleri'},
      meta:{homeTitle:'Projelerim - Ana Sayfa',homeDescription:'Projelerim listesi'},
      projects:[]
    };
    localStorage.setItem('siteData', JSON.stringify(init));
  }
}

function getData(){ensureData();return JSON.parse(localStorage.getItem('siteData'))}
function saveData(d){localStorage.setItem('siteData', JSON.stringify(d))}

// Password-login removed; use Google Sign-In button below

// Google Sign-In
$('#google-login').addEventListener('click', async ()=>{
  try{
    const provider = new GoogleAuthProvider();
    const res = await signInWithPopup(auth, provider);
    const user = res.user;
    await verifyAndEnter(user);
  }catch(err){ console.warn(err); alert('Google ile giriş başarısız: '+(err && err.message?err.message:err)); }
});

// Observe auth state to auto-enter if already signed-in
onAuthStateChanged(auth, async (user)=>{
  if(user){
    try{ await verifyAndEnter(user); }catch(e){ /* ignore */ }
  }
});

// Logout: sign out from Firebase then reload
$('#logout-btn').addEventListener('click', async ()=>{ try{ await fbSignOut(auth); }catch(e){}; location.reload(); });

// Nav
$all('.admin-nav button[data-section]').forEach(b=>b.addEventListener('click', e=>{
  const sec = e.target.getAttribute('data-section');
  $all('.panel-section').forEach(p=>p.classList.add('hidden'));
  $('#' + sec).classList.remove('hidden');
}));

// Load panel
function loadPanel(){
  const data = getData();
  $('#site-title').value = data.site.title || '';
  $('#site-desc').value = data.site.description || '';
  $('#site-logo').value = data.site.logo || '';
  $('#meta-home-title').value = data.meta.homeTitle || '';
  $('#meta-home-desc').value = data.meta.homeDescription || '';
  renderProjects();
  // set firebase checkbox default off
  $('#use-firebase').checked = false;
  $('#sync-status').style.display = 'none';
}

async function verifyAndEnter(user){
  // Check custom claim admin first
  try{
    const idRes = await getIdTokenResult(user, true);
    const claims = idRes && idRes.claims ? idRes.claims : {};
    if(claims.admin === true){
      // allow
      $('#login-section').classList.add('hidden'); $('#panel').classList.remove('hidden'); loadPanel(); return true;
    }
  }catch(e){ /* ignore */ }

  // fallback: check admins collection by uid or email
  const ok = await isAdmin(user.uid, user.email);
  if(ok){ $('#login-section').classList.add('hidden'); $('#panel').classList.remove('hidden'); loadPanel(); return true; }

  // not admin -> sign out and notify
  try{ await fbSignOut(auth); }catch(e){}
  alert('Hesabınız admin yetkisine sahip değil.');
  return false;
}

$('#save-site').addEventListener('click', ()=>{
  const d = getData();
  d.site.title = $('#site-title').value;
  d.site.description = $('#site-desc').value;
  d.site.logo = $('#site-logo').value;
  saveData(d);
  alert('Kaydedildi');
});

$('#save-meta').addEventListener('click', ()=>{
  const d = getData();
  d.meta.homeTitle = $('#meta-home-title').value;
  d.meta.homeDescription = $('#meta-home-desc').value;
  saveData(d);
  alert('Meta kaydedildi');
});

function renderProjects(){
  const list = $('#projects-list'); list.innerHTML='';
  const d = getData();
  d.projects.forEach((p, idx)=>{
    const el = document.createElement('div'); el.className='project-item';
    el.innerHTML = `<div style="min-width:64px"><img src="${p.image||'assets/img/placeholder.png'}" width="64" height="48"/></div>
      <div style="flex:1">
        <strong>${p.title||'Untitled'}</strong>
        <div style="color:#6b7280;font-size:13px">${p.short||''}</div>
      </div>
      <div class="project-controls">
        <button data-act="edit" data-idx="${idx}">Düzenle</button>
        <button data-act="del" data-idx="${idx}">Sil</button>
      </div>`;
    list.appendChild(el);
  });
}

$('#new-project').addEventListener('click', ()=>{
  const d = getData();
  const p = {title:'Yeni Proje',short:'Kısa açıklama',image:'',price:'',sku:''};
  d.projects.push(p); saveData(d); renderProjects();
});

// Push all local projects to Firebase (create new docs)
$('#push-firebase').addEventListener('click', async ()=>{
  if(!$('#use-firebase').checked){ alert('Önce "Firebase ile Senkronize Et" seçeneğini işaretleyin.'); return; }
  const d = getData();
  if(!d.projects || d.projects.length===0){ alert('Gönderilecek proje yok'); return; }
  $('#sync-status').textContent = 'Gönderiliyor...'; $('#sync-status').style.display='block';
  try{
    for(const p of d.projects){
      // build payload with no undefined fields (Firestore rejects undefined)
      const payload = {};
      if(p.title !== undefined) payload.title = p.title;
      payload.description = p.short || '';
      payload.price = p.price || '';
      payload.image = p.image || '';
      payload.sku = p.sku || '';
      payload.tags = Array.isArray(p.tags) ? p.tags : (p.tags ? [p.tags] : []);
      payload.isActive = p.isActive !== undefined ? p.isActive : true;

      // if project has id (firebase doc id) attempt update, else create
      if(p.id){
        await updateProject(p.id, payload);
      } else {
        const newId = await createProject(payload);
        p.id = newId; // store back locally so future updates update instead of create
      }
    }
    saveData(d);
    renderProjects();
    $('#sync-status').textContent = 'Tüm projeler Firebase ile senkronize edildi.';
  }catch(err){ console.error(err); alert('Firebase senkronizasyonunda hata: '+(err && err.message ? err.message : err)); $('#sync-status').textContent = 'Senkronizasyonda hata oluştu.'; }
});

// Pull all projects from Firebase and merge into localStorage
$('#pull-firebase').addEventListener('click', async ()=>{
  if(!$('#use-firebase').checked){ alert('Önce "Firebase ile Senkronize Et" seçeneğini işaretleyin.'); return; }
  $('#sync-status').textContent = 'Uzak projeler çekiliyor...'; $('#sync-status').style.display='block';
  try{
    const remote = await fetchAllProjects();
    const d = getData();
    d.projects = d.projects || [];
    // Map existing local by id for quick lookup
    const localById = new Map(); d.projects.forEach(p=>{ if(p.id) localById.set(p.id, p); });

    let added = 0, updated = 0;
    for(const r of remote){
      if(r.id && localById.has(r.id)){
        // update local entry with remote fields (but keep local-only fields if present)
        const lp = localById.get(r.id);
        lp.title = r.title || lp.title;
        lp.short = r.description || lp.short;
        lp.image = r.image || lp.image;
        lp.price = r.price || lp.price;
        lp.sku = r.sku || lp.sku;
        lp.tags = r.tags || lp.tags;
        updated++;
      } else {
        // add new local entry with firebase id
        const newLocal = {
          id: r.id,
          title: r.title || 'Untitled',
          short: r.description || '',
          image: r.image || '',
          price: r.price || '',
          sku: r.sku || '',
          tags: r.tags || []
        };
        d.projects.push(newLocal); added++;
      }
    }
    saveData(d); renderProjects();
    $('#sync-status').textContent = `Çekildi: ${added} eklendi, ${updated} güncellendi.`;
  }catch(err){ console.error(err); $('#sync-status').textContent = 'Firebase çekiminde hata oluştu.'; alert('Hata: '+(err && err.message?err.message:err)); }
});

// When editing a single project, expose a push/delete to firebase buttons inside edit form

$('#projects-list').addEventListener('click', (e)=>{
  const btn = e.target.closest('button'); if(!btn) return;
  const act = btn.getAttribute('data-act'); const idx = Number(btn.getAttribute('data-idx'));
  if(act==='del'){
    if(!confirm('Projeyi silmek istiyor musunuz?')) return; const d=getData(); d.projects.splice(idx,1); saveData(d); renderProjects();
  } else if(act==='edit'){
    editProject(idx);
  }
});

function editProject(idx){
  const d = getData(); const p = d.projects[idx];
  const form = document.createElement('div'); form.className='panel-section';
  form.innerHTML = `
    <h3>Proje Düzenle</h3>
    <label>Başlık</label><input id="ep-title" value="${escapeHtml(p.title)}" />
    <label>Kısa Açıklama</label><input id="ep-short" value="${escapeHtml(p.short)}" />
    <label>Görsel URL</label><input id="ep-image" value="${escapeHtml(p.image||'')}" />
    <label>Fiyat</label><input id="ep-price" value="${escapeHtml(p.price||'')}" />
    <label>SKU</label><input id="ep-sku" value="${escapeHtml(p.sku||'')}" />
    <div style="display:flex;gap:8px;margin-top:8px"><button id="ep-save">Kaydet</button><button id="ep-cancel">İptal</button></div>
    <div style="margin-top:8px;display:flex;gap:8px"><button id="ep-push">Firebase'e Gönder</button><button id="ep-delete-fb" style="background:#fee2e2;border:1px solid #fecaca">Firebase'den Sil</button></div>
  `;
  document.getElementById('sections').appendChild(form);
  $('#ep-cancel').addEventListener('click', ()=>{form.remove()});
  $('#ep-save').addEventListener('click', ()=>{
    p.title = $('#ep-title').value; p.short = $('#ep-short').value; p.image = $('#ep-image').value; p.price = $('#ep-price').value; p.sku = $('#ep-sku').value;
    saveData(d); renderProjects(); form.remove();
  });
  $('#ep-push').addEventListener('click', async ()=>{
    if(!$('#use-firebase').checked){ alert('Firebase senkronizasyonu aktif değil'); return; }
    try{
      try{
        const payload = {};
        if(p.title !== undefined) payload.title = p.title;
        payload.description = p.short || '';
        payload.price = p.price || '';
        payload.image = p.image || '';
        payload.sku = p.sku || '';
        payload.tags = Array.isArray(p.tags) ? p.tags : (p.tags ? [p.tags] : []);
        payload.isActive = p.isActive !== undefined ? p.isActive : true;

        if(p.id){
          await updateProject(p.id, payload);
          alert('Güncellendi');
        } else {
          const newId = await createProject(payload);
          p.id = newId; saveData(d); renderProjects(); alert('Firebase belgesi oluşturuldu');
        }
      }catch(err){ console.warn(err); alert('Hata: '+(err && err.message ? err.message : err)); }
    }catch(err){ console.warn(err); alert('Hata: '+(err && err.message ? err.message : err)); }
  });
  $('#ep-delete-fb').addEventListener('click', async ()=>{
    if(!p.id){ alert('Bu proje henüz Firebase üzerinde yok'); return; }
    if(!confirm('Firebase dokümanını silmek istediğinizden emin misiniz?')) return;
    try{ await deleteProject(p.id); delete p.id; saveData(d); renderProjects(); alert('Firebase dokümanı silindi'); form.remove(); }catch(e){ console.warn(e); alert('Silme başarısız'); }
  });
}

function escapeHtml(s){
  const str = (s === undefined || s === null) ? '' : String(s);
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// Export / Import
$('#export-btn').addEventListener('click', ()=>{
  const d = getData();
  const blob = new Blob([JSON.stringify(d, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'site-data.json'; document.body.appendChild(a); a.click(); a.remove();
});

$('#import-btn').addEventListener('click', ()=>$('#import-file').click());
$('#import-file').addEventListener('change', (e)=>{
  const f = e.target.files[0]; if(!f) return; const r = new FileReader(); r.onload = ()=>{ try{ const parsed = JSON.parse(r.result); saveData(parsed); alert('İçe aktarma tamamlandı'); loadPanel(); }catch(err){alert('Geçersiz JSON')} }; r.readAsText(f);
});

// On load: try to prefill projects from assets/data/projects.json via fetch (if served)
(async function tryLoadRemote(){
  try{
    const res = await fetch('/assets/data/projects.json',{cache:'no-store'});
    if(res.ok){ const remote = await res.json(); const d = getData(); if(!d.projects || d.projects.length===0){ d.projects = remote; saveData(d); } }
  }catch(e){}
})();

// Accessibility: Enter to login
$('#admin-pass').addEventListener('keyup',(e)=>{ if(e.key==='Enter') $('#login-btn').click() });

// Warn user about insecure storage
if(window.location.protocol === 'file:'){
  const n = document.createElement('div'); n.style.background='#fffbeb'; n.style.padding='8px'; n.style.border='1px solid #fef3c7'; n.style.marginTop='8px'; n.textContent='Not: Admin paneli dosya protokollerinde sınırlı çalışır. Lokal server (http://) üzerinde test edin.'; document.body.prepend(n);
}
