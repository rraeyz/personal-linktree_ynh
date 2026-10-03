#!/bin/bash

#=================================================
# COMMON VARIABLES AND HELPERS
#=================================================

# Kaynak kodun çekildiği repo (deneme reposu; ana repoya geçerken burayı değiştirin)
source_repo="https://github.com/rraeyz/personel-linktree-deneme_ynh.git"
source_branch="main"

# Kaynak kodu GitHub'dan çekip install_dir'e kopyalar.
# install_dir'deki docker-compose.yml şablondan yeniden üretildiği için korunmaz.
fetch_app_source() {
    local tmp_dir
    [ -n "${install_dir:-}" ] || ynh_die --message="install_dir tanımlı değil"
    tmp_dir=$(mktemp -d)

    git clone --depth 1 --branch "$source_branch" "$source_repo" "$tmp_dir/src"
    rm -rf "$tmp_dir/src/.git"

    mkdir -p "$install_dir"
    # Eski dosyaları temizle (silinen dosyalar build'e karışmasın), sonra yenisini kopyala
    find "$install_dir" -mindepth 1 -maxdepth 1 -exec rm -rf {} +
    cp -a "$tmp_dir/src/." "$install_dir/"

    rm -rf "$tmp_dir"
}

# Uygulama /api/health'e yanıt verene kadar bekler (en fazla ~3 dakika)
wait_for_app() {
    local i
    for i in $(seq 1 90); do
        if curl --silent --fail --max-time 3 "http://127.0.0.1:$port/api/health" > /dev/null; then
            return 0
        fi
        sleep 2
    done
    ynh_print_warn --message="Uygulama 3 dakika içinde yanıt vermedi. Logları kontrol edin: docker logs $app"
    return 0
}
