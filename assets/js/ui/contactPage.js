import { saveContactMessage } from '../data/repository.js';

const form = document.getElementById('contactForm');
const feedback = document.getElementById('contact-feedback');

function validateEmail(email){
  return /\S+@\S+\.\S+/.test(email);
}

if(form){
  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const name = document.getElementById('contact-name').value.trim();
    const email = document.getElementById('contact-email').value.trim();
    const message = document.getElementById('contact-message').value.trim();
    if(!name || !email || !message){ feedback.textContent = 'Lütfen tüm alanları doldurun.'; return; }
    if(!validateEmail(email)){ feedback.textContent = 'Geçerli bir e-posta girin.'; return; }
    try{
      await saveContactMessage({ name, email, message });
      feedback.textContent = 'Mesajınız gönderildi. Teşekkürler!';
      form.reset();
    }catch(err){
      console.error(err); feedback.textContent = 'Gönderme sırasında hata.';
    }
  });
}
