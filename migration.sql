-- ═══════════════════════════════════════════════════════════
--  ULTIMATE GIG HUB — Supabase SQL Migration
--  Run this ONCE in: Supabase Dashboard → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════════

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ──────────────────────────────────────────────
-- 1. PROFILES (extends Supabase auth.users)
-- ──────────────────────────────────────────────
CREATE TABLE public.profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name       TEXT NOT NULL,
  username        TEXT UNIQUE NOT NULL,
  email           TEXT UNIQUE NOT NULL,
  phone           TEXT,
  avatar_url      TEXT,
  role            TEXT NOT NULL DEFAULT 'earner' CHECK (role IN ('earner','advertiser','both','admin')),
  withdrawal_pin  TEXT,                        -- hashed 4-digit PIN
  referral_code   TEXT UNIQUE,                 -- e.g. ADEBAYO2024
  referred_by     UUID REFERENCES public.profiles(id),
  is_active       BOOLEAN NOT NULL DEFAULT true,
  is_banned       BOOLEAN NOT NULL DEFAULT false,
  ban_reason      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────
-- 2. WALLETS
-- ──────────────────────────────────────────────
CREATE TABLE public.wallets (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  balance         NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (balance >= 0),
  total_earned    NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_withdrawn NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_spent     NUMERIC(12,2) NOT NULL DEFAULT 0,   -- for advertisers
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────
-- 3. BANK DETAILS (for withdrawals)
-- ──────────────────────────────────────────────
CREATE TABLE public.bank_details (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  bank_name    TEXT NOT NULL,
  account_number TEXT NOT NULL,
  account_name TEXT NOT NULL,
  is_verified  BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────
-- 4. SOCIAL ACCOUNTS (linked profiles)
-- ──────────────────────────────────────────────
CREATE TABLE public.social_accounts (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  platform     TEXT NOT NULL,   -- 'instagram','youtube','tiktok', etc.
  profile_url  TEXT NOT NULL,
  is_verified  BOOLEAN NOT NULL DEFAULT false,
  verified_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, platform)
);

-- ──────────────────────────────────────────────
-- 5. TASKS (created by admin)
-- ──────────────────────────────────────────────
CREATE TABLE public.tasks (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title           TEXT NOT NULL,
  description     TEXT,
  platform        TEXT NOT NULL,   -- 'instagram','youtube','tiktok', etc.
  action_type     TEXT NOT NULL,   -- 'like','follow','comment','subscribe', etc.
  reward_amount   NUMERIC(10,2) NOT NULL CHECK (reward_amount > 0),
  total_spots     INT NOT NULL DEFAULT 100,
  filled_spots    INT NOT NULL DEFAULT 0,
  proof_required  TEXT NOT NULL DEFAULT 'screenshot',  -- 'screenshot','url','both'
  instructions    TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  campaign_id     UUID,            -- links to advertiser campaign (nullable for admin tasks)
  created_by      UUID NOT NULL REFERENCES public.profiles(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT filled_lte_total CHECK (filled_spots <= total_spots)
);

-- ──────────────────────────────────────────────
-- 6. TASK SUBMISSIONS (by earners)
-- ──────────────────────────────────────────────
CREATE TABLE public.task_submissions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id         UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  proof_url       TEXT,            -- screenshot stored in Supabase Storage
  proof_link      TEXT,            -- optional URL proof
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','approved','rejected')),
  rejection_reason TEXT,
  reward_paid     NUMERIC(10,2),
  reviewed_by     UUID REFERENCES public.profiles(id),
  reviewed_at     TIMESTAMPTZ,
  submitted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(task_id, user_id)         -- one submission per task per user
);

-- ──────────────────────────────────────────────
-- 7. ADVERTISER CAMPAIGNS
-- ──────────────────────────────────────────────
CREATE TABLE public.campaigns (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  advertiser_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  platform        TEXT NOT NULL,
  action_type     TEXT NOT NULL,
  target_url      TEXT NOT NULL,
  description     TEXT,
  budget          NUMERIC(12,2) NOT NULL CHECK (budget > 0),
  cost_per_task   NUMERIC(10,2) NOT NULL CHECK (cost_per_task > 0),
  total_spots     INT NOT NULL,
  filled_spots    INT NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','active','paused','completed','rejected')),
  rejection_reason TEXT,
  reviewed_by     UUID REFERENCES public.profiles(id),
  reviewed_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────
-- 8. TRANSACTIONS (full ledger)
-- ──────────────────────────────────────────────
CREATE TABLE public.transactions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type            TEXT NOT NULL
                  CHECK (type IN ('earning','withdrawal','funding','referral_bonus','campaign_spend','refund')),
  amount          NUMERIC(12,2) NOT NULL,
  balance_after   NUMERIC(12,2) NOT NULL,
  description     TEXT NOT NULL,
  reference       TEXT UNIQUE,     -- payment reference (Monnify/manual)
  status          TEXT NOT NULL DEFAULT 'completed'
                  CHECK (status IN ('pending','completed','failed','reversed')),
  metadata        JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────
-- 9. WITHDRAWAL REQUESTS
-- ──────────────────────────────────────────────
CREATE TABLE public.withdrawal_requests (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount          NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  bank_name       TEXT NOT NULL,
  account_number  TEXT NOT NULL,
  account_name    TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','processing','paid','rejected')),
  admin_note      TEXT,
  processed_by    UUID REFERENCES public.profiles(id),
  processed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────
-- 10. NOTIFICATIONS / ALERTS
-- ──────────────────────────────────────────────
CREATE TABLE public.notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type        TEXT NOT NULL
              CHECK (type IN ('task_approved','task_rejected','withdrawal_paid','withdrawal_rejected','campaign_approved','campaign_rejected','referral_bonus','system','funding')),
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  is_read     BOOLEAN NOT NULL DEFAULT false,
  metadata    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────
-- 11. REFERRALS
-- ──────────────────────────────────────────────
CREATE TABLE public.referrals (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_id     UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  bonus_paid      BOOLEAN NOT NULL DEFAULT false,
  bonus_amount    NUMERIC(10,2) DEFAULT 100,
  activated_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────
-- 12. SUPPORT / REPORTS
-- ──────────────────────────────────────────────
CREATE TABLE public.support_tickets (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject     TEXT NOT NULL,
  message     TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'open'
              CHECK (status IN ('open','in_progress','resolved','closed')),
  admin_reply TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ═══════════════════════════════════════════════════════════
--  STORAGE BUCKETS
-- ═══════════════════════════════════════════════════════════
INSERT INTO storage.buckets (id, name, public) VALUES
  ('avatars',           'avatars',           true),
  ('task-proofs',       'task-proofs',       false),
  ('campaign-assets',   'campaign-assets',   true)
ON CONFLICT (id) DO NOTHING;


-- ═══════════════════════════════════════════════════════════
--  ROW LEVEL SECURITY (RLS)
-- ═══════════════════════════════════════════════════════════

ALTER TABLE public.profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_details       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_accounts    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_submissions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets    ENABLE ROW LEVEL SECURITY;

-- ── PROFILES ──
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ── WALLETS ──
CREATE POLICY "Users can view own wallet"
  ON public.wallets FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all wallets"
  ON public.wallets FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can update all wallets"
  ON public.wallets FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ── BANK DETAILS ──
CREATE POLICY "Users manage own bank details"
  ON public.bank_details FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all bank details"
  ON public.bank_details FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ── SOCIAL ACCOUNTS ──
CREATE POLICY "Users manage own social accounts"
  ON public.social_accounts FOR ALL USING (auth.uid() = user_id);

-- ── TASKS ──
CREATE POLICY "Anyone authenticated can view active tasks"
  ON public.tasks FOR SELECT
  USING (auth.uid() IS NOT NULL AND is_active = true);

CREATE POLICY "Admins can manage all tasks"
  ON public.tasks FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ── TASK SUBMISSIONS ──
CREATE POLICY "Users can view own submissions"
  ON public.task_submissions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create submissions"
  ON public.task_submissions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all submissions"
  ON public.task_submissions FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ── CAMPAIGNS ──
CREATE POLICY "Advertisers can manage own campaigns"
  ON public.campaigns FOR ALL USING (auth.uid() = advertiser_id);

CREATE POLICY "Admins can manage all campaigns"
  ON public.campaigns FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ── TRANSACTIONS ──
CREATE POLICY "Users can view own transactions"
  ON public.transactions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions"
  ON public.transactions FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ── WITHDRAWAL REQUESTS ──
CREATE POLICY "Users can manage own withdrawal requests"
  ON public.withdrawal_requests FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all withdrawal requests"
  ON public.withdrawal_requests FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ── NOTIFICATIONS ──
CREATE POLICY "Users can manage own notifications"
  ON public.notifications FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can create notifications for anyone"
  ON public.notifications FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ── REFERRALS ──
CREATE POLICY "Users can view own referrals"
  ON public.referrals FOR SELECT
  USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

-- ── SUPPORT TICKETS ──
CREATE POLICY "Users can manage own tickets"
  ON public.support_tickets FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all tickets"
  ON public.support_tickets FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));


-- ═══════════════════════════════════════════════════════════
--  STORAGE POLICIES
-- ═══════════════════════════════════════════════════════════

-- Avatars: anyone authenticated can upload their own, public read
CREATE POLICY "Avatar upload own"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Avatar update own"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Avatars public read"
  ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

-- Task proofs: earners upload, only admin can read
CREATE POLICY "Proof upload own"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'task-proofs' AND auth.uid() IS NOT NULL);

CREATE POLICY "Proof read admin or owner"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'task-proofs' AND (
      auth.uid()::text = (storage.foldername(name))[1] OR
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    )
  );


-- ═══════════════════════════════════════════════════════════
--  FUNCTIONS & TRIGGERS
-- ═══════════════════════════════════════════════════════════

-- Auto-create profile + wallet on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  ref_code TEXT;
  ref_user_id UUID;
BEGIN
  -- Generate unique referral code from username
  ref_code := UPPER(SUBSTRING(NEW.raw_user_meta_data->>'username' FROM 1 FOR 8)) ||
              LPAD(FLOOR(RANDOM() * 9999)::TEXT, 4, '0');

  -- Insert profile
  INSERT INTO public.profiles (
    id, full_name, username, email, phone,
    role, referral_code, referred_by
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || SUBSTRING(NEW.id::TEXT, 1, 8)),
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    'earner',
    ref_code,
    NULL
  );

  -- Create wallet
  INSERT INTO public.wallets (user_id) VALUES (NEW.id);

  -- Handle referral
  IF NEW.raw_user_meta_data->>'referral_code' IS NOT NULL THEN
    SELECT id INTO ref_user_id
    FROM public.profiles
    WHERE referral_code = NEW.raw_user_meta_data->>'referral_code';

    IF ref_user_id IS NOT NULL THEN
      -- Link referral
      INSERT INTO public.referrals (referrer_id, referred_id)
      VALUES (ref_user_id, NEW.id);

      -- Update referred_by on new profile
      UPDATE public.profiles SET referred_by = ref_user_id WHERE id = NEW.id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── Update wallet updated_at ──
CREATE OR REPLACE FUNCTION public.update_wallet_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER wallet_updated
  BEFORE UPDATE ON public.wallets
  FOR EACH ROW EXECUTE FUNCTION public.update_wallet_timestamp();

-- ── Award referral bonus when referred user first earns ──
CREATE OR REPLACE FUNCTION public.award_referral_bonus(p_user_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_referral RECORD;
BEGIN
  SELECT * INTO v_referral
  FROM public.referrals
  WHERE referred_id = p_user_id AND bonus_paid = false;

  IF FOUND THEN
    -- Credit referrer ₦100
    UPDATE public.wallets
    SET balance      = balance + v_referral.bonus_amount,
        total_earned = total_earned + v_referral.bonus_amount
    WHERE user_id = v_referral.referrer_id;

    -- Log transaction
    INSERT INTO public.transactions (user_id, type, amount, balance_after, description, status)
    SELECT
      v_referral.referrer_id,
      'referral_bonus',
      v_referral.bonus_amount,
      balance,
      'Referral bonus — new user activated',
      'completed'
    FROM public.wallets WHERE user_id = v_referral.referrer_id;

    -- Notify referrer
    INSERT INTO public.notifications (user_id, type, title, message)
    VALUES (
      v_referral.referrer_id,
      'referral_bonus',
      '🎉 Referral Bonus!',
      'You earned ₦' || v_referral.bonus_amount || ' — a friend you referred just completed their first task!'
    );

    -- Mark bonus paid
    UPDATE public.referrals
    SET bonus_paid = true, activated_at = NOW()
    WHERE id = v_referral.id;
  END IF;
END;
$$;

-- ── Approve submission: credit earner wallet ──
CREATE OR REPLACE FUNCTION public.approve_submission(
  p_submission_id UUID,
  p_admin_id      UUID
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_sub  RECORD;
  v_task RECORD;
  v_bal  NUMERIC;
BEGIN
  SELECT * INTO v_sub FROM public.task_submissions WHERE id = p_submission_id;
  SELECT * INTO v_task FROM public.tasks WHERE id = v_sub.task_id;

  IF v_sub.status != 'pending' THEN
    RAISE EXCEPTION 'Submission already reviewed';
  END IF;

  -- Update submission
  UPDATE public.task_submissions SET
    status      = 'approved',
    reward_paid = v_task.reward_amount,
    reviewed_by = p_admin_id,
    reviewed_at = NOW()
  WHERE id = p_submission_id;

  -- Credit wallet
  UPDATE public.wallets SET
    balance      = balance + v_task.reward_amount,
    total_earned = total_earned + v_task.reward_amount
  WHERE user_id = v_sub.user_id
  RETURNING balance INTO v_bal;

  -- Log transaction
  INSERT INTO public.transactions (user_id, type, amount, balance_after, description, status)
  VALUES (
    v_sub.user_id, 'earning', v_task.reward_amount, v_bal,
    'Task completed: ' || v_task.title, 'completed'
  );

  -- Notify earner
  INSERT INTO public.notifications (user_id, type, title, message)
  VALUES (
    v_sub.user_id, 'task_approved',
    '✅ Task Approved!',
    'Your submission for "' || v_task.title || '" was approved. ₦' || v_task.reward_amount || ' added to your wallet.'
  );

  -- Award referral bonus (first task trigger)
  PERFORM public.award_referral_bonus(v_sub.user_id);
END;
$$;

-- ── Reject submission ──
CREATE OR REPLACE FUNCTION public.reject_submission(
  p_submission_id UUID,
  p_admin_id      UUID,
  p_reason        TEXT
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_sub  RECORD;
  v_task RECORD;
BEGIN
  SELECT * INTO v_sub  FROM public.task_submissions WHERE id = p_submission_id;
  SELECT * INTO v_task FROM public.tasks             WHERE id = v_sub.task_id;

  IF v_sub.status != 'pending' THEN
    RAISE EXCEPTION 'Submission already reviewed';
  END IF;

  UPDATE public.task_submissions SET
    status           = 'rejected',
    rejection_reason = p_reason,
    reviewed_by      = p_admin_id,
    reviewed_at      = NOW()
  WHERE id = p_submission_id;

  -- Decrement filled spots (free up the slot)
  UPDATE public.tasks SET filled_spots = GREATEST(0, filled_spots - 1)
  WHERE id = v_sub.task_id;

  -- Notify earner
  INSERT INTO public.notifications (user_id, type, title, message)
  VALUES (
    v_sub.user_id, 'task_rejected',
    '❌ Task Rejected',
    'Your submission for "' || v_task.title || '" was rejected. Reason: ' || p_reason
  );
END;
$$;

-- ── Admin manual wallet funding ──
CREATE OR REPLACE FUNCTION public.admin_fund_wallet(
  p_user_id   UUID,
  p_amount    NUMERIC,
  p_admin_id  UUID,
  p_note      TEXT DEFAULT 'Manual funding by admin'
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_bal NUMERIC;
BEGIN
  UPDATE public.wallets SET
    balance  = balance + p_amount,
    total_earned = total_earned + p_amount
  WHERE user_id = p_user_id
  RETURNING balance INTO v_bal;

  INSERT INTO public.transactions (user_id, type, amount, balance_after, description, status)
  VALUES (p_user_id, 'funding', p_amount, v_bal, p_note, 'completed');

  INSERT INTO public.notifications (user_id, type, title, message)
  VALUES (p_user_id, 'funding', '💰 Wallet Funded', 'Your wallet has been credited with ₦' || p_amount);
END;
$$;

-- ── Process withdrawal payout ──
CREATE OR REPLACE FUNCTION public.process_withdrawal(
  p_request_id UUID,
  p_admin_id   UUID,
  p_status     TEXT,   -- 'paid' or 'rejected'
  p_note       TEXT DEFAULT NULL
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_req RECORD;
  v_bal NUMERIC;
BEGIN
  SELECT * INTO v_req FROM public.withdrawal_requests WHERE id = p_request_id;

  IF v_req.status != 'pending' AND v_req.status != 'processing' THEN
    RAISE EXCEPTION 'Request already processed';
  END IF;

  IF p_status = 'paid' THEN
    -- Deduct from wallet (already reserved on request creation)
    UPDATE public.wallets SET
      balance          = balance,   -- already deducted at request time
      total_withdrawn  = total_withdrawn + v_req.amount
    WHERE user_id = v_req.user_id
    RETURNING balance INTO v_bal;

    INSERT INTO public.transactions (user_id, type, amount, balance_after, description, status)
    VALUES (v_req.user_id, 'withdrawal', -v_req.amount, v_bal,
            'Withdrawal paid to ' || v_req.bank_name || ' ' || v_req.account_number, 'completed');

    INSERT INTO public.notifications (user_id, type, title, message)
    VALUES (v_req.user_id, 'withdrawal_paid', '💸 Withdrawal Paid!',
            '₦' || v_req.amount || ' has been sent to your ' || v_req.bank_name || ' account.');

  ELSIF p_status = 'rejected' THEN
    -- Refund wallet
    UPDATE public.wallets SET balance = balance + v_req.amount
    WHERE user_id = v_req.user_id
    RETURNING balance INTO v_bal;

    INSERT INTO public.transactions (user_id, type, amount, balance_after, description, status)
    VALUES (v_req.user_id, 'refund', v_req.amount, v_bal,
            'Withdrawal rejected — refunded', 'completed');

    INSERT INTO public.notifications (user_id, type, title, message)
    VALUES (v_req.user_id, 'withdrawal_rejected', '❌ Withdrawal Rejected',
            COALESCE(p_note, 'Your withdrawal was rejected. Your balance has been restored.'));
  END IF;

  UPDATE public.withdrawal_requests SET
    status       = p_status,
    admin_note   = p_note,
    processed_by = p_admin_id,
    processed_at = NOW()
  WHERE id = p_request_id;
END;
$$;


-- ═══════════════════════════════════════════════════════════
--  INDEXES (for performance)
-- ═══════════════════════════════════════════════════════════
CREATE INDEX idx_profiles_username       ON public.profiles(username);
CREATE INDEX idx_profiles_referral_code  ON public.profiles(referral_code);
CREATE INDEX idx_tasks_platform          ON public.tasks(platform);
CREATE INDEX idx_tasks_is_active         ON public.tasks(is_active);
CREATE INDEX idx_submissions_user        ON public.task_submissions(user_id);
CREATE INDEX idx_submissions_task        ON public.task_submissions(task_id);
CREATE INDEX idx_submissions_status      ON public.task_submissions(status);
CREATE INDEX idx_transactions_user       ON public.transactions(user_id);
CREATE INDEX idx_notifications_user      ON public.notifications(user_id);
CREATE INDEX idx_notifications_unread    ON public.notifications(user_id, is_read);
CREATE INDEX idx_campaigns_advertiser    ON public.campaigns(advertiser_id);
CREATE INDEX idx_campaigns_status        ON public.campaigns(status);
CREATE INDEX idx_withdrawals_user        ON public.withdrawal_requests(user_id);
CREATE INDEX idx_withdrawals_status      ON public.withdrawal_requests(status);


-- ═══════════════════════════════════════════════════════════
--  PROMOTE FIRST ADMIN
--  Replace 'your@email.com' with your actual email AFTER you sign up
-- ═══════════════════════════════════════════════════════════
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'your@email.com';

-- ═══════════════════════════════════════════════════════════
--  DONE ✅
-- ═══════════════════════════════════════════════════════════
