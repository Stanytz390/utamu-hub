
# Mpango kamili — UTAMU PORI v2

Umeomba yote bila demo. Ni kubwa mno kwa turn moja (~15+ features + schema kubwa + payment gateway + refactor ya hosting). Nitajenga kwa **waves 5**, kila wave ikiwa deployable peke yake. Nikimaliza wave ninasimama uone kabla ya kuendelea.

## Maamuzi muhimu (ninaomba tuthibitishe kabla sijaanza)

**Hosting refactor:** Ulichagua "Refactor kwa Node.js server ya kawaida" ili iendane na Vercel/Render/Railway. **Nakushauri turudi Lovable Cloud kwa sasa** kwa sababu:
- App imejengwa juu ya TanStack Start + Cloudflare Workers + Supabase-managed auth
- Refactor kamili itachukua turns 5–8 peke yake, na itavunja features za sasa (auth-middleware, server functions, edge routing)
- `app.json` + README + env vars zote zitakupa portability ya credentials; kifaa halisi kinabaki cha Lovable Cloud
- Ukitaka baadaye ku-migrate, ni rahisi zaidi ukiwa na app inayofanya kazi kwanza

**Nikienda mbele nitabaki Lovable Cloud**; `app.json` itakuwa reference kamili. Ukisisitiza Node refactor, sema — nitaifanya baada ya features zote.

## Waves

### Wave 1 — Coins/SQ economy + Admin bootstrap + Referral
**Database (migration moja):**
- `coin_wallets` (user_id, balance_sq)
- `coin_transactions` (user_id, delta_sq, kind: topup/purchase/gift/referral/redeem, ref_id, status, created_at)
- `app_settings` (key, value_json) — admin anaweka: `sq_to_tsh` (default 100), `referral_inviter_reward` (2), `referral_invitee_reward` (8), `whatsapp_support_number`, `whatsapp_channel_url`, `contact_reveal_cost_sq`
- `referrals` (inviter_id, invitee_id, status, rewarded_at) + `profiles.referral_code` (unique 6-char) + `profiles.referred_by`
- Trigger: signup → weka referral_code + apply referral kama URL ilikuwa na `?ref=CODE`
- Trigger: auto-grant admin role kwa `ADMIN_EMAIL` env var (default `hostingstany@gmail.com`) wakati wa signup
- Bei za videos zibadilishwe kutoka `price_tsh` kwenda `price_sq` (migration ya data)
- RLS: user anaona wallet & transactions zake tu; admin anaona zote

**Server functions:**
- `getWallet`, `topUpCoins` (initiate — inarudi payment ref), `spendCoins` (kwa video unlock, contact reveal), `applyReferralCode`

**Frontend:**
- Bar ya coins juu (Profile header + Home)
- `/wallet` page: balance, historia, top-up button
- Prices zionyeshwe kama "5 SQ (~500 TSh)"
- Referral card kwenye `/profile` — link + code + earnings

### Wave 2 — Admin panel kamili
**Route `/_authenticated/admin` (has_role admin):**
- Dashboard: users, videos, revenue (SQ + TSh), pending payments
- **Categories CRUD**
- **Videos**: upload kwa URL au file (Lovable Storage `videos/` bucket, private + signed URLs), weka bei ya SQ, category, description, thumbnail
- **Groups CRUD**
- **Dadaz business accounts**: approve/reject, weka `contact_reveal_cost_sq` per profile, toggle `is_published`, verify contacts (WhatsApp/phone/SMS). **Contacts hazionekani kwa users mpaka admin a-confirm**
- **Users & roles**: list, promote → business/admin, ban
- **App settings**: SQ rate, referral rewards, WhatsApp support number, channel URL
- **Promo banners CRUD**: image, title, description, link, active/inactive, sort_order
- **Redeem Links**: create link (code, coins_amount, max_uses, expires_at), view claims

### Wave 3 — Business Dadaz + Contact reveal
**Route `/_authenticated/dadaz/manage` (has_role business):**
- Business user ana-create/edit Dadaz profile YAO peke yao (RLS: `owner_id = auth.uid()`)
- Ana-upload photos, weka services, bei, contacts
- Ana-submit for admin approval; hadhihiri mpaka `is_admin_approved = true`

**Kwa user wa kawaida (Dadaz detail page):**
- Buttons 3: WhatsApp, Call, SMS — zote **zime-lock** mpaka mtumiaji atumie SQ (`contact_reveal_cost_sq` iliyowekwa na admin) ku-unlock contact
- Baada ya unlock: link halisi ya `wa.me/`, `tel:`, `sms:`

### Wave 4 — SpeedaPesa payments (halisi) + Redeem
**Utafutaji wa docs za SpeedaPesa** (nitafanya web_search kabla ya kuandika code)
- Secrets: `SPEEDAPESA_API_KEY`, `_SECRET`, `_MERCHANT_ID`, `_WEBHOOK_SECRET`, `_BASE_URL` (nita-request kupitia `add_secret`)
- Server fn `initiateTopUp({sq_amount, network, phone})` → inaunda payment row (pending), inaita SpeedaPesa STK push, inarudi ref
- Server route `/api/public/webhooks/speedapesa` (POST) → verify HMAC → update `payments.status` → **credit `coin_wallets`** → trigger referral reward kama ndio malipo ya kwanza
- Frontend TopUp modal: pick network → phone → polling ya status → success

**Redeem links:**
- Route `/redeem/$code` — mtumiaji akiingia (login required) → verify code + limit + expiry → credit coins → log kwenye `coin_transactions` → redirect `/wallet` na toast

### Wave 5 — UI polish: Share, Floating widgets, Sliding promo banner
- **Share button** kwenye kila video card, Dadaz profile, na Group card (Web Share API + fallback ya copy link + WhatsApp/Twitter/Facebook)
- **Floating WhatsApp support icon** (kona ya chini kulia) — inatumia `whatsapp_support_number` kutoka `app_settings`
- **Floating "Follow WhatsApp Channel" pop-up** (juu ya sliding images) — dismissible, session-persistent
- **Sliding promo banner** juu ya Home (Embla carousel autoplay) — inatoka `promo_banners` table iliyojazwa na admin

## Env vars mpya (`app.json` itaupdate)
```
ADMIN_EMAIL=hostingstany@gmail.com
SPEEDAPESA_API_KEY=
SPEEDAPESA_API_SECRET=
SPEEDAPESA_MERCHANT_ID=
SPEEDAPESA_WEBHOOK_SECRET=
SPEEDAPESA_BASE_URL=
```

## Vitu vinavyobadilika kwenye codebase
```text
migrations/     — waves 1, 2, 3, 4 kila moja ina migration yake
src/lib/
  ├─ wallet.functions.ts        (wave 1)
  ├─ referral.functions.ts      (wave 1)
  ├─ admin.functions.ts         (wave 2)
  ├─ dadaz-business.functions.ts (wave 3)
  ├─ payments.functions.ts      (wave 4)
  └─ redeem.functions.ts        (wave 4)
src/routes/
  ├─ _authenticated/
  │   ├─ wallet.tsx             (wave 1)
  │   ├─ admin/                 (wave 2 — index, categories, videos, groups, dadaz, users, banners, redeem, settings)
  │   └─ dadaz-manage.tsx       (wave 3)
  ├─ redeem.$code.tsx           (wave 4)
  └─ api/public/webhooks/speedapesa.ts (wave 4)
src/components/
  ├─ CoinBadge, TopUpModal, ReferralCard (wave 1)
  ├─ ShareButton, FloatingSupport, WhatsAppChannelPopup, PromoBanner (wave 5)
  └─ ContactRevealButton         (wave 3)
```

## Naomba uthibitisho wa vitu 2 kabla sijaanza Wave 1
1. **Hosting**: Naendelea Lovable Cloud + `app.json` kama reference? (au unasisitiza Node refactor?)
2. **Naanza sasa hivi na Wave 1** (Coins/SQ + Referral + Admin bootstrap)? Ni migration + files ~8. Ukikubali naanza turn hii hii.
