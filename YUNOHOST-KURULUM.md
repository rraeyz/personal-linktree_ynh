# YunoHost Kurulumu

Uygulama YunoHost üzerinde Docker container olarak çalışır; nginx, SSL, yedekleme ve güncelleme YunoHost tarafından yönetilir.

**Gereksinimler:** YunoHost 11.3 veya üstü (12.x önerilir), ~1 GB RAM (build sırasında), ~500 MB disk. Docker kurulum sırasında otomatik kurulur.

> **Kaynak kod nereden geliyor?** Kurulum, güncelleme ve geri yükleme script'leri uygulama kodunu
> `scripts/_common.sh` içindeki `source_repo` / `source_branch` adresinden çeker (bu repo: `personal-linktree_ynh`, `main` branch'i).
> Yani bir değişikliği denemek için önce `main`'e alınmış olması gerekir.

## 1. Test domaininde kurulum

Önce ayrı bir alt domainde deneyin. Sorun çıkarsa ana sitenize dokunmamış olursunuz.

```bash
# Domaini ekleyin (DNS kaydı sunucunuzu göstermeli) ve SSL sertifikası alın
sudo yunohost domain add test.ornek.com
sudo yunohost domain cert install test.ornek.com

# Uygulamayı kurun
sudo yunohost app install https://github.com/rraeyz/personal-linktree_ynh \
  --args "domain=test.ornek.com&path=/&init_main_permission=visitors"
```

Kurulum Docker imajını derlediği için birkaç dakika sürer. Bittiğinde:

1. `https://test.ornek.com/setup` adresini açın. Admin kullanıcı adını ve şifresini belirleyin, profilinizi oluşturun.
2. Panel `https://test.ornek.com/admin` adresindedir.
3. Ayarlar → E-posta (SMTP) bölümünü doldurursanız iletişim formu ve bülten çalışır.

> Yol olarak mutlaka `/` kullanın. `ornek.com/linktree` gibi alt yollara kurulum henüz desteklenmiyor.

## 2. Ana domaine taşıma

Test domaininde her şey yolundaysa uygulamayı **verileriyle birlikte** ana domaine taşıyın. Yeniden kurulum gerekmez:

```bash
sudo yunohost app change-url personal_linktree -d ornek.com -p /
```

Bu komut nginx ayarını yeni domaine taşır ve container'ı yeni adresle yeniden başlatır. Veritabanı, yüklenen görseller ve ayarlar aynen kalır. İşlem başarısız olursa YunoHost eski ayarı geri yükler.

- Ana domainin `/` yolunda başka bir uygulama varsa önce onu taşımanız veya kaldırmanız gerekir.
- Taşıdıktan sonra test domainini isterseniz `sudo yunohost domain remove test.ornek.com` ile kaldırabilirsiniz.
- Daha önce paylaştığınız `test.ornek.com` linkleri artık çalışmaz. QR kodları da yeni domainle yeniden oluşturun.

## 3. Güncelleme

```bash
sudo yunohost app upgrade personal_linktree \
  -u https://github.com/rraeyz/personal-linktree_ynh --force
```

- Yeni imaj derlenirken eski sürüm çalışmaya devam eder, kesinti yalnızca container değişirken birkaç saniyedir.
- Açılışta veritabanı şeması otomatik güncellenir (`db-migrate.js`). Değişiklikten önce `prisma/dev.db.before-migrate-<tarih>` adıyla yedek alınır.
- `--force`, sürüm numarası değişmediğinde de güncellemeyi zorlar.

## 4. Yedekleme ve geri yükleme

```bash
# YunoHost yedeği (veritabanı + yüklenen görseller + ayarlar)
sudo yunohost backup create --apps personal_linktree

# Geri yükleme (önce uygulamayı kaldırmanız gerekiyorsa: sudo yunohost app remove personal_linktree)
sudo yunohost backup list
sudo yunohost backup restore <yedek-adı> --apps personal_linktree
```

Ayrıca her gün otomatik bir veritabanı yedeği alınır: `/home/yunohost.app/personal_linktree/backup/db-YYYYMMDD.db` (son 7 gün). Yedekler, çalışan veritabanından SQLite'ın çevrimiçi yedekleme özelliğiyle alınır, yani yazma sırasında da tutarlıdır.

Admin paneli → Ayarlar → "Tüm Ayarları Yedekle" ise profil, tema ve linkleri JSON olarak indirir. Başka bir kuruluma taşımak için kullanılabilir. Analitik, aboneler ve yüklenen görseller bu dosyada yoktur.

## Veriler nerede?

| Yol | İçerik |
|---|---|
| `/home/yunohost.app/personal_linktree/prisma/dev.db` | Veritabanı (profil, linkler, analitik, aboneler, admin) |
| `/home/yunohost.app/personal_linktree/uploads/` | Yüklenen görseller |
| `/home/yunohost.app/personal_linktree/.env` | JWT anahtarı (kurulum sihirbazı oluşturur) |
| `/home/yunohost.app/personal_linktree/backup/` | Günlük otomatik veritabanı yedekleri |
| `/opt/yunohost/personal_linktree/` | Uygulama kodu ve `docker-compose.yml` (güncellemede yeniden oluşturulur) |

## Sorun giderme

```bash
# Container durumu ve logları
sudo docker ps --filter name=personal_linktree
sudo docker logs --tail 100 personal_linktree

# Uygulama yanıt veriyor mu?
curl -s http://127.0.0.1:$(sudo yunohost app setting personal_linktree port)/api/health

# Container'ı yeniden başlat
cd /opt/yunohost/personal_linktree && sudo docker-compose restart
```

- **Admin şifresini unuttum:** Şifre veritabanında hash'li tutulur. Sıfırlamak için `Admin` tablosundaki kaydı silip `/setup` sihirbazını yeniden çalıştırın:
  ```bash
  sudo docker exec personal_linktree node -e "new (require('better-sqlite3'))('/app/prisma/dev.db').exec('DELETE FROM Admin')"
  ```
  Ardından `https://<domain>/setup` açın. Linkler, analitik ve aboneler korunur. Sihirbazın profil adımında boş bıraktığınız alanlar değişmez.
  Çok eski bir kurulumdan geliyorsanız ve `/home/yunohost.app/personal_linktree/.env` içinde `ADMIN_PASSWORD=` satırı varsa, onu da silip `sudo docker restart personal_linktree` çalıştırın.
- **Kurulumdan sonra sayfa açılmıyor:** İmaj derlemesi uzun sürmüş olabilir. `docker logs` çıktısında `Ready` satırını bekleyin.
- **E-posta gitmiyor:** Gmail için normal şifre değil "uygulama şifresi" gerekir (port 587, Secure kapalı).

## Deneme reposu ile çalışma

Yeni özellikler önce deneme reposunda (`personel-linktree-deneme_ynh`) geliştirilip test domaininde denenir. Beğenilince bu repoya aktarılır. Deneme reposunun `scripts/_common.sh` dosyası kendi adresini, bu reponunki ise bu repoyu gösterir. Aktarırken bu satırın ana repo adresi olarak kalmasına dikkat edin.

Test domainindeki kurulum deneme reposundan, ana domaindeki kurulum bu repodan güncellenir:

```bash
# test domaini (deneme reposu)
sudo yunohost app upgrade personal_linktree -u https://github.com/rraeyz/personel-linktree-deneme_ynh --force

# ana domain (bu repo); aynı sunucuda ikinci kurulumun uygulama adı personal_linktree__2 olabilir
sudo yunohost app upgrade personal_linktree -u https://github.com/rraeyz/personal-linktree_ynh --force
```

Daha önce deneme reposundan kurulmuş bir uygulamayı bu repoya bağlamak için, yukarıdaki ana repo `upgrade` komutunu bir kez çalıştırmanız yeterli. Sonraki güncellemeler bu repodan gelir.
