#!/bin/sh
set -e

# ============================================
# Künye - Docker Entrypoint
# ============================================

# İlk kurulumda database template'den kopyala
# (data_dir/prisma volume mount ediliyor, dev.db yoksa oluştur)
if [ ! -f /app/prisma/dev.db ]; then
  echo "📦 İlk kurulum: Database template kopyalanıyor..."
  cp /app/template.db /app/prisma/dev.db
  echo "✅ Database başarıyla oluşturuldu"
else
  echo "✅ Mevcut database bulundu: /app/prisma/dev.db"
fi

# Yeni sürümde şemaya eklenen tablo/kolonları mevcut database'e ekle (veri silinmez)
node /app/db-migrate.js /app/template.db /app/prisma/dev.db || echo "⚠️  Migration başarısız, mevcut şema ile devam ediliyor"

echo "🚀 Next.js server başlatılıyor..."
exec node server.js
