-- =====================================================================
-- KoiChain ID — Supabase Database Setup
-- =====================================================================
-- Jalankan seluruh script ini di Supabase SQL Editor (project BARU)
-- secara berurutan dari atas ke bawah. Script ini idempotent (aman
-- dijalankan ulang).
--
-- Skema ini direkonstruksi dari kode aplikasi (semua pemanggilan
-- supabase.from(...), supabase.storage.from(...), dan auth).
--
-- Daftar tabel : profiles, user_wallets, spawning_sessions,
--                spawning_fathers, koi_certificates, news,
--                notifications, reports
-- Storage bucket: avatars, koi-assets, koi-photos, news_images,
--                 ktp-documents, report-proofs
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. TABEL: profiles
-- ---------------------------------------------------------------------
-- 1 baris per user (id = auth.users.id). Dibuat otomatis oleh trigger
-- handle_new_user() saat user mendaftar (lihat bagian 9).
-- Kolom role yang dipakai aplikasi: 'user', 'breeder', 'seller',
-- 'admin', 'author', dan kombinasi 'seller,breeder'.
create table if not exists public.profiles (
  id                   uuid primary key references auth.users (id) on delete cascade,
  full_name            text,
  phone                text,
  address              text,
  role                 text        not null default 'user',
  avatar_url           text,
  banner_url           text,
  is_banned            boolean     not null default false,
  ban_until            timestamptz,
  requested_role       text,
  verification_status  text,                 -- null | 'verified' | 'rejected'
  -- Data usaha / mitra
  store_name           text,
  store_address        text,
  store_description    text,
  contact_phone        text,
  contact_email        text,
  instagram            text,
  -- Dokumen verifikasi
  ktp_url              text,
  ktp_selfie_url       text,
  farm_photo_url       text,
  -- Statistik
  total_transfers      integer     not null default 0,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);


-- ---------------------------------------------------------------------
-- 2. TABEL: spawning_sessions (sesi pemijahan)
-- ---------------------------------------------------------------------
create table if not exists public.spawning_sessions (
  id              uuid primary key default gen_random_uuid(),
  breeder_id      uuid not null references public.profiles (id) on delete cascade,
  session_code    text not null unique,      -- contoh: KOI-2025-1234
  mother_koi_id   text,
  spawn_date      date,
  location        text,
  notes           text,
  offspring_count integer not null default 0,
  created_at      timestamptz not null default now()
);


-- ---------------------------------------------------------------------
-- 3. TABEL: koi_certificates (katalog Web2 hasil minting)
-- ---------------------------------------------------------------------
-- koi_id dipakai sebagai PRIMARY KEY karena aplikasi melakukan
-- upsert({ koi_id, ... }) tanpa onConflict (default konflik = PK).
create table if not exists public.koi_certificates (
  koi_id              text primary key,
  breeder_id          uuid references public.profiles (id) on delete no action,
  wallet_address      text,
  variety             text,
  size                integer,
  condition           text,
  photo_url           text,
  spawning_session_id uuid references public.spawning_sessions (id) on delete set null,
  minted_at           timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);


-- ---------------------------------------------------------------------
-- 4. TABEL: spawning_fathers (induk jantan per sesi)
-- ---------------------------------------------------------------------
create table if not exists public.spawning_fathers (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid not null references public.spawning_sessions (id) on delete cascade,
  father_koi_id text
);


-- ---------------------------------------------------------------------
-- 5. TABEL: user_wallets (dompet Web3 yang ditautkan ke akun)
-- ---------------------------------------------------------------------
create table if not exists public.user_wallets (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles (id) on delete no action,
  wallet_address text not null unique,
  label          text not null default 'MetaMask',
  is_primary     boolean not null default false,
  created_at     timestamptz not null default now()
);


-- ---------------------------------------------------------------------
-- 6. TABEL: news (artikel berita)
-- ---------------------------------------------------------------------
create table if not exists public.news (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  slug       text not null unique,
  category   text,
  content    text,
  image_url  text,
  is_main    boolean not null default false,
  author_id  uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


-- ---------------------------------------------------------------------
-- 7. TABEL: notifications
-- ---------------------------------------------------------------------
create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  title      text,
  message    text,
  is_read    boolean not null default false,
  created_at timestamptz not null default now()
);


-- ---------------------------------------------------------------------
-- 8. TABEL: reports (laporan / pengaduan, boleh dari guest)
-- ---------------------------------------------------------------------
create table if not exists public.reports (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references public.profiles (id) on delete set null,  -- null = guest
  category     text,
  title        text,
  description  text,
  contact_info text,
  evidence_url text,
  status       text not null default 'open',  -- 'open' | 'in_progress' | 'resolved' | 'rejected'
  created_at   timestamptz not null default now()
);


-- ---------------------------------------------------------------------
-- INDEXES (untuk performa query yang dipakai aplikasi)
-- ---------------------------------------------------------------------
create index if not exists idx_user_wallets_user_id        on public.user_wallets (user_id);
create index if not exists idx_user_wallets_wallet_lower    on public.user_wallets (lower(wallet_address));
create index if not exists idx_koi_breeder_id               on public.koi_certificates (breeder_id);
create index if not exists idx_koi_wallet_lower             on public.koi_certificates (lower(wallet_address));
create index if not exists idx_koi_session                  on public.koi_certificates (spawning_session_id);
create index if not exists idx_spawning_breeder             on public.spawning_sessions (breeder_id);
create index if not exists idx_spawning_fathers_session     on public.spawning_fathers (session_id);
create index if not exists idx_news_author                  on public.news (author_id);
create index if not exists idx_notifications_user           on public.notifications (user_id);
create index if not exists idx_reports_user                 on public.reports (user_id);
create index if not exists idx_reports_status               on public.reports (status);


-- ---------------------------------------------------------------------
-- 9. TRIGGER: buat profil otomatis saat user baru mendaftar
-- ---------------------------------------------------------------------
-- Aplikasi tidak pernah INSERT ke profiles secara manual; ia hanya
-- UPDATE. Jadi baris profiles WAJIB dibuat otomatis oleh trigger ini.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'phone',
    coalesce(
      new.raw_user_meta_data ->> 'avatar_url',
      new.raw_user_meta_data ->> 'picture'
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ---------------------------------------------------------------------
-- 10. TRIGGER: auto-update kolom updated_at
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists trg_koi_updated_at on public.koi_certificates;
create trigger trg_koi_updated_at
  before update on public.koi_certificates
  for each row execute function public.set_updated_at();

drop trigger if exists trg_news_updated_at on public.news;
create trigger trg_news_updated_at
  before update on public.news
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------
-- 11. HELPER: cek apakah user saat ini admin
-- ---------------------------------------------------------------------
-- SECURITY DEFINER agar bisa membaca profiles tanpa memicu rekursi RLS.
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Helper: apakah user saat ini author atau admin (untuk modul berita)
create or replace function public.is_author_or_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('author', 'admin')
  );
$$;


-- ---------------------------------------------------------------------
-- 12. ROW LEVEL SECURITY
-- ---------------------------------------------------------------------
alter table public.profiles          enable row level security;
alter table public.user_wallets      enable row level security;
alter table public.spawning_sessions enable row level security;
alter table public.spawning_fathers  enable row level security;
alter table public.koi_certificates  enable row level security;
alter table public.news              enable row level security;
alter table public.notifications     enable row level security;
alter table public.reports           enable row level security;

-- ===== profiles ======================================================
-- Profil bersifat publik (dibaca di halaman koi publik, showcase mitra, dll)
drop policy if exists "profiles_select_public" on public.profiles;
create policy "profiles_select_public"
  on public.profiles for select
  using (true);

-- User boleh meng-update profilnya sendiri; admin boleh update siapa saja
drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin"
  on public.profiles for update
  using (auth.uid() = id or public.is_admin())
  with check (auth.uid() = id or public.is_admin());

-- Insert ditangani trigger (security definer); izinkan juga insert diri sendiri
drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self"
  on public.profiles for insert
  with check (auth.uid() = id or public.is_admin());

-- ===== user_wallets ==================================================
drop policy if exists "wallets_select_public" on public.user_wallets;
create policy "wallets_select_public"
  on public.user_wallets for select
  using (true);

drop policy if exists "wallets_insert_own" on public.user_wallets;
create policy "wallets_insert_own"
  on public.user_wallets for insert
  with check (auth.uid() = user_id);

drop policy if exists "wallets_update_own" on public.user_wallets;
create policy "wallets_update_own"
  on public.user_wallets for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "wallets_delete_own" on public.user_wallets;
create policy "wallets_delete_own"
  on public.user_wallets for delete
  using (auth.uid() = user_id or public.is_admin());

-- ===== spawning_sessions =============================================
drop policy if exists "spawning_select_public" on public.spawning_sessions;
create policy "spawning_select_public"
  on public.spawning_sessions for select
  using (true);

drop policy if exists "spawning_write_own" on public.spawning_sessions;
create policy "spawning_write_own"
  on public.spawning_sessions for all
  using (auth.uid() = breeder_id or public.is_admin())
  with check (auth.uid() = breeder_id or public.is_admin());

-- ===== spawning_fathers ==============================================
drop policy if exists "fathers_select_public" on public.spawning_fathers;
create policy "fathers_select_public"
  on public.spawning_fathers for select
  using (true);

-- Hanya pemilik sesi (atau admin) yang boleh menulis induk jantan
drop policy if exists "fathers_write_owner" on public.spawning_fathers;
create policy "fathers_write_owner"
  on public.spawning_fathers for all
  using (
    public.is_admin() or exists (
      select 1 from public.spawning_sessions s
      where s.id = spawning_fathers.session_id and s.breeder_id = auth.uid()
    )
  )
  with check (
    public.is_admin() or exists (
      select 1 from public.spawning_sessions s
      where s.id = spawning_fathers.session_id and s.breeder_id = auth.uid()
    )
  );

-- ===== koi_certificates ==============================================
drop policy if exists "koi_select_public" on public.koi_certificates;
create policy "koi_select_public"
  on public.koi_certificates for select
  using (true);

-- Breeder menyimpan sertifikatnya sendiri saat minting (breeder_id = dirinya)
drop policy if exists "koi_insert_own" on public.koi_certificates;
create policy "koi_insert_own"
  on public.koi_certificates for insert
  with check (auth.uid() = breeder_id or public.is_admin());

drop policy if exists "koi_update_own" on public.koi_certificates;
create policy "koi_update_own"
  on public.koi_certificates for update
  using (auth.uid() = breeder_id or public.is_admin())
  with check (true);

-- Catatan: update saat TRANSFER kepemilikan dilakukan lewat API server
-- (route /api/sync-transfer) yang memakai SERVICE ROLE KEY sehingga
-- otomatis bypass RLS.

-- ===== news ==========================================================
drop policy if exists "news_select_public" on public.news;
create policy "news_select_public"
  on public.news for select
  using (true);

drop policy if exists "news_write_author_admin" on public.news;
create policy "news_write_author_admin"
  on public.news for all
  using (public.is_author_or_admin())
  with check (public.is_author_or_admin());

-- ===== notifications =================================================
drop policy if exists "notif_select_own" on public.notifications;
create policy "notif_select_own"
  on public.notifications for select
  using (auth.uid() = user_id);

-- Admin boleh membuat notifikasi untuk user lain (approve/ban/dll)
drop policy if exists "notif_insert_admin_or_self" on public.notifications;
create policy "notif_insert_admin_or_self"
  on public.notifications for insert
  with check (public.is_admin() or auth.uid() = user_id);

drop policy if exists "notif_update_own" on public.notifications;
create policy "notif_update_own"
  on public.notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "notif_delete_own" on public.notifications;
create policy "notif_delete_own"
  on public.notifications for delete
  using (auth.uid() = user_id);

-- ===== reports =======================================================
-- Siapa pun (termasuk guest/anon) boleh membuat laporan
drop policy if exists "reports_insert_anyone" on public.reports;
create policy "reports_insert_anyone"
  on public.reports for insert
  with check (true);

-- Hanya admin yang boleh melihat & mengubah laporan
drop policy if exists "reports_select_admin" on public.reports;
create policy "reports_select_admin"
  on public.reports for select
  using (public.is_admin());

drop policy if exists "reports_update_admin" on public.reports;
create policy "reports_update_admin"
  on public.reports for update
  using (public.is_admin())
  with check (public.is_admin());


-- ---------------------------------------------------------------------
-- 13. STORAGE BUCKETS
-- ---------------------------------------------------------------------
-- Semua bucket di-set PUBLIC karena aplikasi memakai getPublicUrl().
--
-- ⚠️  PERHATIAN PRIVASI: bucket 'ktp-documents' menyimpan foto KTP &
--     selfie. Aplikasi saat ini memakai getPublicUrl() sehingga bucket
--     harus public agar URL bisa dibuka. Untuk produksi sangat
--     disarankan menjadikannya PRIVATE dan beralih ke createSignedUrl().
insert into storage.buckets (id, name, public) values
  ('avatars',       'avatars',       true),
  ('koi-assets',    'koi-assets',    true),
  ('koi-photos',    'koi-photos',    true),
  ('news_images',   'news_images',   true),
  ('ktp-documents', 'ktp-documents', true),
  ('report-proofs', 'report-proofs', true)
on conflict (id) do update set public = excluded.public;


-- ---------------------------------------------------------------------
-- 14. STORAGE RLS POLICIES (pada tabel storage.objects)
-- ---------------------------------------------------------------------
-- Baca publik untuk semua bucket di atas
drop policy if exists "storage_public_read" on storage.objects;
create policy "storage_public_read"
  on storage.objects for select
  using (
    bucket_id in ('avatars','koi-assets','koi-photos','news_images','ktp-documents','report-proofs')
  );

-- Upload bukti laporan boleh oleh siapa saja (guest bisa lampirkan bukti)
drop policy if exists "storage_reports_insert_anyone" on storage.objects;
create policy "storage_reports_insert_anyone"
  on storage.objects for insert
  with check (bucket_id = 'report-proofs');

-- Upload / update / hapus pada bucket lain hanya untuk user terautentikasi
drop policy if exists "storage_auth_insert" on storage.objects;
create policy "storage_auth_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id in ('avatars','koi-assets','koi-photos','news_images','ktp-documents')
  );

drop policy if exists "storage_auth_update" on storage.objects;
create policy "storage_auth_update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id in ('avatars','koi-assets','koi-photos','news_images','ktp-documents','report-proofs')
  )
  with check (
    bucket_id in ('avatars','koi-assets','koi-photos','news_images','ktp-documents','report-proofs')
  );

drop policy if exists "storage_auth_delete" on storage.objects;
create policy "storage_auth_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id in ('avatars','koi-assets','koi-photos','news_images','ktp-documents','report-proofs')
  );


-- =====================================================================
-- SELESAI.
-- =====================================================================
-- Langkah berikutnya:
--   1. Jalankan script ini di SQL Editor project Supabase baru.
--   2. Di Authentication > Providers, aktifkan Email + Google (OAuth)
--      sesuai yang dipakai aplikasi (signInWithOAuth google).
--      Tambahkan redirect URL: https://DOMAIN-ANDA/auth/callback
--   3. Isi .env.local aplikasi:
--        NEXT_PUBLIC_SUPABASE_URL=...
--        NEXT_PUBLIC_SUPABASE_ANON_KEY=...
--        SUPABASE_SERVICE_ROLE_KEY=...      (dipakai route admin & sync-transfer)
--   4. Untuk membuat akun ADMIN pertama: daftar via aplikasi, lalu
--      jalankan:  update public.profiles set role='admin'
--                 where id = (select id from auth.users where email='EMAIL-ANDA');
-- =====================================================================
