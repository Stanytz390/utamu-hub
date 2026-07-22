# UTAMU PORI — Mpango Kamili (Awamu 4)

Kazi ni kubwa. Nitajenga awamu kwa awamu, kila awamu ikiwa deployable peke yake. Baada ya kila awamu ninasimama uone kabla ya kuendelea.

---

## Awamu 1 — Search/Filters + Lovable Cloud + Auth + Database

### Frontend (haraka)
- Home: ongeza search bar functional (chuja videos + profiles + groups kwa jina/description).
- Utamu: search + filters zilizopo (All/New/Old/Free/Premium) zifanye kazi juu ya data ya DB.
- Dadaz: search kwa username/location/status.

### Lovable Cloud (backend)
Nitawasha Lovable Cloud (Supabase chini kwa chini) — inatoa DB, Auth, na Storage bila akaunti ya nje.

### Auth
- Email + password signup/login (route `/auth`).
- Google sign-in (default ya Lovable).
- `/profile` chini ya `_authenticated` — mtumiaji anahariri phone, name, avatar.

### Database schema (migrations)
```text
profiles           id (=auth.users), username, phone, avatar_url, created_at
user_roles         user_id, role (enum: admin | business | user)
categories         id, slug, label, sort_order
videos             id, title, description, thumbnail_url, video_url,
                   duration, price_tsh, category_id, uploaded_by, created_at
video_views        video_id, user_id, watched_at
dadaz_profiles     id, owner_id (business user), username, location, status,
                   bio, services, price_tsh, whatsapp, phone, avatar_url,
                   followers_count, likes_count, is_published
dadaz_photos       id, dadaz_id, image_url, sort_order
dadaz_follows      dadaz_id, user_id
dadaz_likes        dadaz_id, user_id
groups             id, name, description, logo_url, link, members, created_by
payments           id, user_id, video_id, amount_tsh, network, phone,
                   provider_ref, status (pending|success|failed), created_at
purchases          user_id, video_id, payment_id, granted_at   -- unlock table
```
- RLS: users read published content; owners edit yao; admin edits chochote (kupitia `has_role` security definer).
- `user_roles` separate table + `has_role()` function (per security standard).

---

## Awamu 2 — Admin Panel + Business Accounts (Dadaz)

- Route `/admin` (admin mkuu tu):
  - Categories CRUD.
  - Utamu videos: upload kwa URL au file (Lovable Storage), weka bei, category.
  - Groups CRUD.
  - Users list + role toggle (promote → business/admin).
- Route `/dadaz/manage` (business role):
  - Business user anasajili/anahariri profile yake ya Dadaz, anaongeza photos, services, bei, WhatsApp/phone.
  - Ana-publish/unpublish.
- Admin mkuu wa kwanza: nitaweka email fixed (utatoa) au mtumiaji wa kwanza kupitia SQL seed.

---

## Awamu 3 — SpeedaPesa Payments + Webhooks + Unlock

- Ni-search SpeedaPesa docs kwanza (developer.speedapesa.com au sawa).
- Secrets za backend (env vars kupitia `add_secret`):
  - `SPEEDAPESA_API_KEY`, `SPEEDAPESA_API_SECRET`, `SPEEDAPESA_MERCHANT_ID`, `SPEEDAPESA_WEBHOOK_SECRET`, `SPEEDAPESA_BASE_URL`.
- Server function `initiatePayment({videoId, network, phone})`:
  - Weka row kwenye `payments` (status=pending).
  - Ita SpeedaPesa STK/USSD push kwa network husika (HaloPesa/MixxByYas/M-Pesa/Airtel).
  - Rudisha `provider_ref` kwa client.
- Public route `/api/public/webhooks/speedapesa` (POST):
  - Verify HMAC signature.
  - Update `payments.status`, insert `purchases` row.
- Frontend PayModal: baada ya `initiatePayment` fanya polling ya status; ikifanikiwa → download/play unlock.
- Video player + secure download link (signed URL kutoka Storage) inatolewa kwa waliolipa au free.

---

## Awamu 4 — app.json + Heroku reference

**Note muhimu:** App halisi inai-deploy kwenye Lovable Cloud (Cloudflare Workers). Heroku haiwezi kuendesha TanStack Start setup bila refactor kubwa. Nitaunda `app.json` kama reference/documentation ya env vars zinazohitajika, na `README` yenye maelekezo ya deployment.

`app.json` itakuwa na:
```json
{
  "name": "UTAMU PORI",
  "env": {
    "SUPABASE_URL": {...}, "SUPABASE_PUBLISHABLE_KEY": {...},
    "SUPABASE_SERVICE_ROLE_KEY": {...},
    "SPEEDAPESA_API_KEY": {...}, "SPEEDAPESA_API_SECRET": {...},
    "SPEEDAPESA_MERCHANT_ID": {...}, "SPEEDAPESA_WEBHOOK_SECRET": {...},
    "SPEEDAPESA_BASE_URL": {...}, "LOVABLE_API_KEY": {...}
  }
}
```
Nitakumbusha secrets zote ziko kwenye Lovable secrets (server-only), sio kwenye code.

---

## Technical notes
- All server writes via `createServerFn` + `requireSupabaseAuth`; webhooks via server route chini ya `/api/public/`.
- RLS + `has_role` kwa authorization; `supabaseAdmin` tu ndani ya webhook baada ya signature verify.
- Storage bucket `videos/` (private, signed URLs) na `avatars/`, `dadaz-photos/` (public).
- Search: Postgres `ilike` kwa v1; tunaweza kuboresha na `pg_trgm` baadaye.

---

## Naanza sasa na Awamu 1
Nikimaliza Awamu 1 nakupa preview upime auth + search + DB kabla ya kuendelea Awamu 2.
