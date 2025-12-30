# Örnek Veri (assets/data)

Bu klasörde geliştirme ve test amaçlı kullanılabilecek JSON örnek verileri bulunur:

- `projects.json` — projeler listesi
- `users.json` — demo kullanıcılar (uid alanları manuel)
- `orders.json` — örnek siparişler (not: otomatik yükleme scriptinde orders ekleme yapılmamıştır)
- `contact_messages.json` — iletişim mesajları

Nasıl kullanırım?

1. `assets/js/config/firebaseConfig.js` içindeki placeholder değerleri kendi Firebase projenizle değiştirin.
2. Firebase Console'da **Authentication (Email/Password)** ve **Firestore** servislerini etkinleştirin.
3. Basit tarayıcı tabanlı seeding için `seed.html` dosyasını açın (ör: Live Server) ve **Verileri Yükle** butonuna basın. Bu sayfa `assets/js/data/seed.js` dosyasını kullanarak `users`, `projects` ve `contact_messages` koleksiyonlarınıza yazacaktır.

Notlar
- `seed.html` sayfası tarayıcıda modül importları (`type=module`) kullandığı için `file://` ile açınca CORS veya import hatası alabilirsiniz. En sorunsuz yöntem VS Code Live Server ya da basit bir HTTP sunucu kullanmaktır.
- `orders.json` içeriğini otomatik ekleme yapmadık çünkü demo `orders` içindeki `userId` ve `projectId` alanlarının Firestore içinde hangi id'lerle eşleneceği değişkenlik gösterebilir. Bu nedenle orders'ı manuel ya da sonradan eşleyerek eklemenizi öneririm.

Örnek komutlar (opsiyonel)

VS Code Live Server yoksa basit bir Python HTTP sunucu ile dosyaları sunabilirsiniz:

```powershell
# Powershell / CMD
python -m http.server 5500
# sonra tarayıcıda http://localhost:5500/seed.html açın
```
