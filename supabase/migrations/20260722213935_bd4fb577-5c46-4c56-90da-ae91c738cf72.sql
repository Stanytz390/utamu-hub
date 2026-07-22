
-- =============== ENUMS ===============
CREATE TYPE public.app_role AS ENUM ('admin', 'business', 'user');
CREATE TYPE public.dadaz_status AS ENUM ('free', 'work', 'service');
CREATE TYPE public.payment_status AS ENUM ('pending', 'success', 'failed', 'cancelled');
CREATE TYPE public.payment_network AS ENUM ('halopesa', 'mixx', 'mpesa', 'airtel');

-- =============== UPDATED_AT TRIGGER FN ===============
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- =============== PROFILES ===============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
CREATE TRIGGER profiles_set_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- =============== USER ROLES ===============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  );
$$;

-- =============== HANDLE NEW USER TRIGGER ===============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'username',
             NEW.raw_user_meta_data ->> 'full_name',
             split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data ->> 'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============== CATEGORIES ===============
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admins manage categories" ON public.categories FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.categories (slug, label, sort_order) VALUES
  ('utamu', 'Utamu', 1),
  ('dadaz', 'Dadaz', 2),
  ('groups', 'Groups', 3);

-- =============== VIDEOS ===============
CREATE TABLE public.videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  video_url TEXT NOT NULL,
  duration TEXT,
  price_tsh INT NOT NULL DEFAULT 0,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  creator TEXT,
  views_count INT NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT true,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.videos TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.videos TO authenticated;
GRANT ALL ON public.videos TO service_role;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read published videos" ON public.videos FOR SELECT
  USING (is_published = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage videos" ON public.videos FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER videos_set_updated_at BEFORE UPDATE ON public.videos
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- =============== DADAZ PROFILES (business) ===============
CREATE TABLE public.dadaz_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  location TEXT,
  status public.dadaz_status NOT NULL DEFAULT 'free',
  bio TEXT,
  services TEXT,
  price_tsh INT,
  price_label TEXT,
  whatsapp TEXT,
  phone TEXT,
  avatar_url TEXT,
  cover_url TEXT,
  followers_count INT NOT NULL DEFAULT 0,
  likes_count INT NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.dadaz_profiles TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.dadaz_profiles TO authenticated;
GRANT ALL ON public.dadaz_profiles TO service_role;
ALTER TABLE public.dadaz_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read published dadaz" ON public.dadaz_profiles FOR SELECT
  USING (is_published = true OR owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners insert dadaz" ON public.dadaz_profiles FOR INSERT
  WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owners update dadaz" ON public.dadaz_profiles FOR UPDATE
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners delete dadaz" ON public.dadaz_profiles FOR DELETE
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER dadaz_set_updated_at BEFORE UPDATE ON public.dadaz_profiles
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- =============== DADAZ PHOTOS ===============
CREATE TABLE public.dadaz_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dadaz_id UUID NOT NULL REFERENCES public.dadaz_profiles(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.dadaz_photos TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.dadaz_photos TO authenticated;
GRANT ALL ON public.dadaz_photos TO service_role;
ALTER TABLE public.dadaz_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read dadaz photos" ON public.dadaz_photos FOR SELECT USING (true);
CREATE POLICY "Owners manage dadaz photos" ON public.dadaz_photos FOR ALL
  USING (EXISTS (SELECT 1 FROM public.dadaz_profiles d WHERE d.id = dadaz_id AND (d.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.dadaz_profiles d WHERE d.id = dadaz_id AND (d.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))));

-- =============== DADAZ FOLLOWS / LIKES ===============
CREATE TABLE public.dadaz_follows (
  dadaz_id UUID NOT NULL REFERENCES public.dadaz_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (dadaz_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.dadaz_follows TO authenticated;
GRANT ALL ON public.dadaz_follows TO service_role;
ALTER TABLE public.dadaz_follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own follows" ON public.dadaz_follows FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users manage own follows" ON public.dadaz_follows FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own follows" ON public.dadaz_follows FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE public.dadaz_likes (
  dadaz_id UUID NOT NULL REFERENCES public.dadaz_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (dadaz_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.dadaz_likes TO authenticated;
GRANT ALL ON public.dadaz_likes TO service_role;
ALTER TABLE public.dadaz_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own likes" ON public.dadaz_likes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users manage own likes" ON public.dadaz_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own likes" ON public.dadaz_likes FOR DELETE USING (auth.uid() = user_id);

-- =============== GROUPS ===============
CREATE TABLE public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  link TEXT NOT NULL,
  members INT NOT NULL DEFAULT 0,
  category TEXT,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.groups TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.groups TO authenticated;
GRANT ALL ON public.groups TO service_role;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read published groups" ON public.groups FOR SELECT
  USING (is_published = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage groups" ON public.groups FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER groups_set_updated_at BEFORE UPDATE ON public.groups
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- =============== PAYMENTS ===============
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  amount_tsh INT NOT NULL,
  network public.payment_network NOT NULL,
  phone TEXT NOT NULL,
  provider_ref TEXT,
  status public.payment_status NOT NULL DEFAULT 'pending',
  raw_response JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own payments" ON public.payments FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users insert own payments" ON public.payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER payments_set_updated_at BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- =============== PURCHASES (unlock table) ===============
CREATE TABLE public.purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, video_id)
);
GRANT SELECT ON public.purchases TO authenticated;
GRANT ALL ON public.purchases TO service_role;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own purchases" ON public.purchases FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
