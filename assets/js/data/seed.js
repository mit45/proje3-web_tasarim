import { createProject, createOrUpdateUser, saveContactMessage } from './repository.js';

async function loadJson(relPath){
  const url = new URL(relPath, import.meta.url).href;
  const res = await fetch(url);
  if(!res.ok) throw new Error('JSON yüklenemedi: ' + url);
  return res.json();
}

async function seedProjects(projects){
  for(const p of projects){
    try{
      const id = await createProject(p);
      console.log('Created project', p.title, id);
    }catch(err){ console.error('project err', err); }
  }
}

async function seedUsers(users){
  for(const u of users){
    try{
      await createOrUpdateUser(u.uid, u);
      console.log('User set', u.uid);
    }catch(err){ console.error('user err', err); }
  }
}

async function seedContacts(contact_messages){
  for(const c of contact_messages){
    try{
      await saveContactMessage(c);
      console.log('Contact saved', c.email);
    }catch(err){ console.error(err); }
  }
}

export async function runSeed(){
  try{
    const projects = await loadJson('../../data/projects.json');
    const users = await loadJson('../../data/users.json');
    const contact_messages = await loadJson('../../data/contact_messages.json');
    await seedUsers(users);
    await seedProjects(projects);
    await seedContacts(contact_messages);
    alert('Seed işlemi tamamlandı. Konsolu kontrol edin.');
  }catch(err){
    console.error('Seed hatası', err);
    alert('Seed hatası — konsolu kontrol edin.');
  }
}
