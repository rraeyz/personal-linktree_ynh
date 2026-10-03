# Personal Linktree

Kendi sunucunuzda çalışan, analitikli ve bültenli bir "link in bio" sayfası. Tüm veriler sizde kalır: SQLite veritabanı ve yüklenen görseller tek bir klasörde durur.

**Teknoloji:** Next.js 14.2 (App Router) · TypeScript · Tailwind CSS · Prisma 7 + SQLite (better-sqlite3) · sharp · Docker

## Özellikler

**Ziyaretçi sayfası**
- Açık/koyu mod (admin panelinde seçilen tema renklerini korur, sayfa yenilenince yanıp sönmez)
- 8 hazır tema, renk, yazı tipi, köşe yuvarlaklığı, arka plan (düz, gradient, parçacık, mesh, görsel)
- Kategorili linkler, sosyal medya ikonları, YouTube/X/Instagram gömme
- Şifreli linkler (URL sayfa kaynağında görünmez), zamanlanmış linkler, kısa linkler (`/go/<slug>`)
- İletişim formu, bülten aboneliği, paylaş butonu, isteğe bağlı "Rehbere Ekle" (vCard)
- SEO: başlık/açıklama, Open Graph görseli, favicon, `robots.txt`, `sitemap.xml`

**Admin paneli** (`/admin`)
- Profil, linkler (sürükle-bırak sıralama), tema, QR kod
- Görsel yükleme: otomatik boyutlandırma, EXIF/konum bilgisi silinir
- Analitik: profil görüntülenme, tekil ziyaretçi, etkileşim oranı, tıklamalar, cihaz/tarayıcı/ülke, trafik kaynakları, UTM kampanyaları, CSV dışa aktarma, saklama süresi
- Bülten: abone yönetimi, toplu e-posta (kişiye özel "abonelikten çık" linki), tekil e-posta, e-posta imzası
- Ayarlar: SMTP, şifre değiştirme, tüm cihazlardan çıkış, ayarları dışa/içe aktarma

**Güvenlik**
- Admin şifresi bcrypt ile saklanır; şifre değişince tüm oturumlar kapanır
- Giriş, iletişim formu, abonelik ve link şifresi için deneme sınırı (rate limit)
- SMTP şifresi tarayıcıya hiç gönderilmez; iletişim e-postası sayfa kaynağında görünmez
- Güvenlik başlıkları, CSRF için Origin kontrolü, SVG/zararlı dosya yükleme engeli
- Ziyaretçi IP'leri saklanmaz, yalnızca tuzlanmış hash tutulur (KVKK/GDPR)

## Kurulum

| Yöntem | Kılavuz |
|---|---|
| YunoHost (önerilen) | [YUNOHOST-KURULUM.md](YUNOHOST-KURULUM.md) |
| Docker / Docker Compose | [DOCKER-KURULUM.md](DOCKER-KURULUM.md) |
| Hızlı deneme | [QUICKSTART.md](QUICKSTART.md) |

İlk açılışta `/setup` sihirbazı admin kullanıcısını oluşturur. Ayrıca `.env` ile şifre ayarlamanız gerekmez.

## Geliştirme

Node.js 20 gerekir.

```bash
npm ci --legacy-peer-deps
export DATABASE_URL="file:./prisma/dev.db"
npx prisma generate
npx prisma db push        # veritabanını şemadan oluşturur
npm run dev               # http://localhost:3000/setup
```

Kontroller (CI'da da çalışır):

```bash
npx tsc --noEmit
npm run lint
npm run build
```

### Uçtan uca testler

`tests/e2e/` altındaki testler **boş (kurulmamış)** bir kuruluma karşı çalışır, kendi verisini oluşturur:

```bash
# Ayrı bir terminalde temiz bir kurulum başlatın (ör. Docker), sonra:
BASE_URL=http://localhost:3000 npm run test:e2e

# Tarayıcı testi (playwright gerekir; api testlerinden sonra)
BASE_URL=http://localhost:3000 ADMIN_PASSWORD=e2e-password-456 node tests/e2e/browser.mjs
```

GitHub Actions her push'ta Docker imajını derler, container'ı başlatır ve bu testleri çalıştırır. Ekran görüntüleri çalıştırmanın "Artifacts" bölümünde bulunur.

## Veritabanı şeması ve yükseltmeler

Şema `prisma/schema.prisma` dosyasındadır. Docker imajı build edilirken şemadan bir `template.db` üretilir. Container her açıldığında `db-migrate.js`, canlı veritabanını bu template ile karşılaştırır. Eksik tablo, kolon ve index'leri ekler; değişiklikten önce yedek alır. Veri silmez, kolon tipi değiştirmez. Bu yüzden yeni alanları **varsayılan değerli** olarak ekleyin.

## Proje yapısı

```
src/
  app/            sayfalar ve API route'ları (api/, admin/, go/, media/, setup/, unsubscribe/)
  components/     ziyaretçi sayfası bileşenleri; admin/ altında panel bileşenleri
  lib/            auth, güvenlik, analitik, yükleme, e-posta şablonu yardımcıları
prisma/           veritabanı şeması
scripts/          YunoHost paket script'leri (install, upgrade, backup, restore, remove, change_url)
conf/             YunoHost nginx / docker-compose / systemd şablonları
tests/e2e/        uçtan uca testler
db-migrate.js     açılışta otomatik şema güncellemesi
db-backup.js      çalışan veritabanının tutarlı yedeği
```

## Lisans

MIT
