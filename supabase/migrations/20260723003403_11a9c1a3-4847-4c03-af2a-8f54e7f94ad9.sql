
-- ============ APP SETTINGS ============
CREATE TABLE public.app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);
GRANT SELECT ON public.app_settings TO anon, authenticated;
GRANT ALL ON public.app_settings TO service_role;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "app_settings readable by everyone" ON public.app_settings FOR SELECT USING (true);
CREATE POLICY "app_settings admin write" ON public.app_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed default settings
INSERT INTO public.app_settings (key, value) VALUES
  ('sq_to_tsh', '100'::jsonb),
  ('referral_inviter_reward', '2'::jsonb),
  ('referral_invitee_reward', '8'::jsonb),
  ('whatsapp_support_number', '"+255700000000"'::jsonb),
  ('whatsapp_channel_url', '"https://whatsapp.com/channel/xxxx"'::jsonb),
  ('default_contact_reveal_cost_sq', '5'::jsonb),
  ('admin_email', '"hostingstany@gmail.com"'::jsonb);

-- ============ COIN WALLETS ============
CREATE TABLE public.coin_wallets (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance_sq INTEGER NOT NULL DEFAULT 0 CHECK (balance_sq >= 0),
  total_earned_sq INTEGER NOT NULL DEFAULT 0,
  total_spent_sq INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.coin_wallets TO authenticated;
GRANT ALL ON public.coin_wallets TO service_role;
ALTER TABLE public.coin_wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wallet owner read" ON public.coin_wallets FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER coin_wallets_updated BEFORE UPDATE ON public.coin_wallets
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============ COIN TRANSACTIONS ============
CREATE TYPE public.coin_txn_kind AS ENUM ('topup','purchase','gift','referral','redeem','refund','admin_adjust');
CREATE TYPE public.coin_txn_status AS ENUM ('pending','success','failed');

CREATE TABLE public.coin_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  delta_sq INTEGER NOT NULL,
  kind public.coin_txn_kind NOT NULL,
  status public.coin_txn_status NOT NULL DEFAULT 'success',
  ref_id TEXT,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.coin_transactions TO authenticated;
GRANT ALL ON public.coin_transactions TO service_role;
ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coin_tx owner read" ON public.coin_transactions FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE INDEX ON public.coin_transactions (user_id, created_at DESC);

-- ============ REFERRALS ============
CREATE TABLE public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inviter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invitee_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','rewarded')),
  rewarded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.referrals TO authenticated;
GRANT ALL ON public.referrals TO service_role;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "referral read by participants" ON public.referrals FOR SELECT TO authenticated
  USING (auth.uid() IN (inviter_id, invitee_id) OR public.has_role(auth.uid(), 'admin'));
CREATE INDEX ON public.referrals (inviter_id);

-- ============ PROFILES ADDITIONS ============
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT;

-- ============ VIDEOS: price_sq ============
ALTER TABLE public.videos
  ADD COLUMN IF NOT EXISTS price_sq INTEGER NOT NULL DEFAULT 0 CHECK (price_sq >= 0);
-- Migrate: convert existing price_tsh to price_sq using 100 rate
UPDATE public.videos SET price_sq = COALESCE(price_tsh, 0) / 100 WHERE price_sq = 0;

-- ============ DADAZ additions ============
ALTER TABLE public.dadaz_profiles
  ADD COLUMN IF NOT EXISTS contact_reveal_cost_sq INTEGER NOT NULL DEFAULT 5 CHECK (contact_reveal_cost_sq >= 0),
  ADD COLUMN IF NOT EXISTS is_admin_approved BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id);

-- ============ CONTACT UNLOCKS ============
CREATE TABLE public.dadaz_contact_unlocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dadaz_id UUID NOT NULL REFERENCES public.dadaz_profiles(id) ON DELETE CASCADE,
  cost_sq INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, dadaz_id)
);
GRANT SELECT ON public.dadaz_contact_unlocks TO authenticated;
GRANT ALL ON public.dadaz_contact_unlocks TO service_role;
ALTER TABLE public.dadaz_contact_unlocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "unlocks owner read" ON public.dadaz_contact_unlocks FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- ============ VIDEO PURCHASES (unlocks) — ensure exists / align ============
-- (purchases table already exists per schema; add index if missing)
CREATE INDEX IF NOT EXISTS purchases_user_video ON public.purchases (user_id, video_id);

-- ============ FUNCTIONS ============

-- Generate short unique referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  code TEXT;
  tries INT := 0;
BEGIN
  LOOP
    code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 6));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = code);
    tries := tries + 1;
    IF tries > 10 THEN RAISE EXCEPTION 'Could not generate referral code'; END IF;
  END LOOP;
  RETURN code;
END;
$$;
REVOKE ALL ON FUNCTION public.generate_referral_code() FROM PUBLIC, anon, authenticated;

-- Credit coins (service-role or SECURITY DEFINER only)
CREATE OR REPLACE FUNCTION public.credit_coins(_user_id UUID, _amount INT, _kind public.coin_txn_kind, _ref_id TEXT, _note TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tx_id UUID;
BEGIN
  IF _amount <= 0 THEN RAISE EXCEPTION 'amount must be > 0'; END IF;

  INSERT INTO public.coin_wallets (user_id, balance_sq, total_earned_sq)
  VALUES (_user_id, _amount, _amount)
  ON CONFLICT (user_id) DO UPDATE SET
    balance_sq = coin_wallets.balance_sq + EXCLUDED.balance_sq,
    total_earned_sq = coin_wallets.total_earned_sq + EXCLUDED.total_earned_sq,
    updated_at = now();

  INSERT INTO public.coin_transactions (user_id, delta_sq, kind, status, ref_id, note)
  VALUES (_user_id, _amount, _kind, 'success', _ref_id, _note)
  RETURNING id INTO tx_id;

  RETURN tx_id;
END;
$$;
REVOKE ALL ON FUNCTION public.credit_coins(UUID, INT, public.coin_txn_kind, TEXT, TEXT) FROM PUBLIC, anon, authenticated;

-- Spend coins atomically
CREATE OR REPLACE FUNCTION public.spend_coins(_user_id UUID, _amount INT, _kind public.coin_txn_kind, _ref_id TEXT, _note TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tx_id UUID;
  current_balance INT;
BEGIN
  IF _amount <= 0 THEN RAISE EXCEPTION 'amount must be > 0'; END IF;

  SELECT balance_sq INTO current_balance FROM public.coin_wallets WHERE user_id = _user_id FOR UPDATE;
  IF current_balance IS NULL THEN
    INSERT INTO public.coin_wallets (user_id, balance_sq) VALUES (_user_id, 0);
    current_balance := 0;
  END IF;

  IF current_balance < _amount THEN
    RAISE EXCEPTION 'insufficient_coins' USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.coin_wallets
  SET balance_sq = balance_sq - _amount,
      total_spent_sq = total_spent_sq + _amount,
      updated_at = now()
  WHERE user_id = _user_id;

  INSERT INTO public.coin_transactions (user_id, delta_sq, kind, status, ref_id, note)
  VALUES (_user_id, -_amount, _kind, 'success', _ref_id, _note)
  RETURNING id INTO tx_id;

  RETURN tx_id;
END;
$$;
REVOKE ALL ON FUNCTION public.spend_coins(UUID, INT, public.coin_txn_kind, TEXT, TEXT) FROM PUBLIC, anon, authenticated;

-- ============ UPDATED handle_new_user ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ref_code TEXT;
  admin_email_setting TEXT;
  inviter UUID;
  invited_code TEXT;
BEGIN
  ref_code := public.generate_referral_code();
  invited_code := NEW.raw_user_meta_data ->> 'ref';

  IF invited_code IS NOT NULL AND length(invited_code) > 0 THEN
    SELECT id INTO inviter FROM public.profiles WHERE referral_code = upper(invited_code) LIMIT 1;
  END IF;

  INSERT INTO public.profiles (id, username, avatar_url, email, referral_code, referred_by, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'username',
             NEW.raw_user_meta_data ->> 'full_name',
             split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data ->> 'avatar_url',
    NEW.email,
    ref_code,
    inviter,
    NEW.raw_user_meta_data ->> 'full_name'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.coin_wallets (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;

  -- Default role: user
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Admin bootstrap
  SELECT (value #>> '{}')::text INTO admin_email_setting FROM public.app_settings WHERE key = 'admin_email';
  IF admin_email_setting IS NOT NULL AND lower(NEW.email) = lower(admin_email_setting) THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  -- Referral record (invitee reward is applied when first top-up succeeds; inviter reward also then)
  IF inviter IS NOT NULL THEN
    INSERT INTO public.referrals (inviter_id, invitee_id, status)
    VALUES (inviter, NEW.id, 'pending')
    ON CONFLICT (invitee_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- ============ BACKFILL referral_code for existing profiles ============
UPDATE public.profiles SET referral_code = public.generate_referral_code() WHERE referral_code IS NULL;

-- ============ Ensure wallets for existing users ============
INSERT INTO public.coin_wallets (user_id)
SELECT id FROM auth.users WHERE id NOT IN (SELECT user_id FROM public.coin_wallets);

-- ============ REDEEM LINKS ============
CREATE TABLE public.redeem_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  coins_sq INTEGER NOT NULL CHECK (coins_sq > 0),
  max_uses INTEGER NOT NULL DEFAULT 1 CHECK (max_uses > 0),
  uses_count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  note TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.redeem_links TO authenticated;
GRANT ALL ON public.redeem_links TO service_role;
ALTER TABLE public.redeem_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "redeem readable by all authed" ON public.redeem_links FOR SELECT TO authenticated USING (true);
CREATE POLICY "redeem admin write" ON public.redeem_links FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.redeem_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id UUID NOT NULL REFERENCES public.redeem_links(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  coins_sq INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (link_id, user_id)
);
GRANT SELECT ON public.redeem_claims TO authenticated;
GRANT ALL ON public.redeem_claims TO service_role;
ALTER TABLE public.redeem_claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY "claim owner read" ON public.redeem_claims FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Redeem function (atomic)
CREATE OR REPLACE FUNCTION public.claim_redeem_link(_user_id UUID, _code TEXT)
RETURNS TABLE (coins_credited INT, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  lnk RECORD;
BEGIN
  SELECT * INTO lnk FROM public.redeem_links WHERE code = _code FOR UPDATE;
  IF lnk IS NULL THEN RETURN QUERY SELECT 0, 'invalid_code'; RETURN; END IF;
  IF NOT lnk.is_active THEN RETURN QUERY SELECT 0, 'inactive'; RETURN; END IF;
  IF lnk.expires_at IS NOT NULL AND lnk.expires_at < now() THEN RETURN QUERY SELECT 0, 'expired'; RETURN; END IF;
  IF lnk.uses_count >= lnk.max_uses THEN RETURN QUERY SELECT 0, 'exhausted'; RETURN; END IF;
  IF EXISTS (SELECT 1 FROM public.redeem_claims WHERE link_id = lnk.id AND user_id = _user_id) THEN
    RETURN QUERY SELECT 0, 'already_claimed'; RETURN;
  END IF;

  INSERT INTO public.redeem_claims (link_id, user_id, coins_sq) VALUES (lnk.id, _user_id, lnk.coins_sq);
  UPDATE public.redeem_links SET uses_count = uses_count + 1 WHERE id = lnk.id;
  PERFORM public.credit_coins(_user_id, lnk.coins_sq, 'redeem', lnk.code, 'Redeem link: ' || COALESCE(lnk.note, lnk.code));

  RETURN QUERY SELECT lnk.coins_sq, 'ok';
END;
$$;
REVOKE ALL ON FUNCTION public.claim_redeem_link(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_redeem_link(UUID, TEXT) TO authenticated;

-- ============ PROMO BANNERS ============
CREATE TABLE public.promo_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  link_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.promo_banners TO anon, authenticated;
GRANT ALL ON public.promo_banners TO service_role;
ALTER TABLE public.promo_banners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "banners public read active" ON public.promo_banners FOR SELECT USING (is_active = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "banners admin write" ON public.promo_banners FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER promo_banners_updated BEFORE UPDATE ON public.promo_banners
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
