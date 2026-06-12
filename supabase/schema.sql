-- ============================================================
-- uNick Academy – Supabase Schema
-- ============================================================

-- Typy enum
CREATE TYPE user_role AS ENUM ('student', 'teacher', 'admin');
CREATE TYPE lesson_type AS ENUM ('online', 'offline');
CREATE TYPE lesson_format AS ENUM ('individual', 'group');
CREATE TYPE language_level AS ENUM ('A1', 'A2', 'B1', 'B2', 'C1', 'C2');
CREATE TYPE student_status AS ENUM ('active', 'trial', 'overdue', 'paused');
CREATE TYPE transaction_type AS ENUM ('charge', 'payment', 'credit');

-- ============================================================
-- PROFILES (rozszerza auth.users)
-- ============================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'student',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Każdy widzi własny profil" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admin widzi wszystkie profile" ON profiles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- TEACHERS
-- ============================================================
CREATE TABLE teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  bio TEXT,
  levels language_level[] NOT NULL DEFAULT '{}',
  rating NUMERIC(3,2) NOT NULL DEFAULT 5.0,
  review_count INT NOT NULL DEFAULT 0,
  video_url TEXT,
  color TEXT NOT NULL DEFAULT '#7c3aed',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Nauczyciele widoczni publicznie" ON teachers FOR SELECT USING (TRUE);
CREATE POLICY "Admin zarządza nauczycielami" ON teachers FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================================
-- STUDENTS
-- ============================================================
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES teachers(id),
  level language_level NOT NULL DEFAULT 'A1',
  status student_status NOT NULL DEFAULT 'trial',
  referral_code TEXT NOT NULL UNIQUE,
  referred_by TEXT,
  credit_balance NUMERIC(10,2) NOT NULL DEFAULT 0,
  stripe_customer_id TEXT,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Student widzi swoje dane" ON students
  FOR SELECT USING (profile_id = auth.uid());

CREATE POLICY "Admin widzi wszystkich studentów" ON students
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- LESSONS
-- ============================================================
CREATE TABLE lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES teachers(id),
  type lesson_type NOT NULL DEFAULT 'online',
  format lesson_format NOT NULL DEFAULT 'individual',
  level language_level NOT NULL DEFAULT 'A1',
  topic TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  is_confirmed BOOLEAN NOT NULL DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Student widzi swoje lekcje" ON lessons
  FOR SELECT USING (
    student_id IN (SELECT id FROM students WHERE profile_id = auth.uid())
  );

CREATE POLICY "Nauczyciel widzi swoje lekcje" ON lessons
  FOR SELECT USING (
    teacher_id IN (SELECT id FROM teachers WHERE profile_id = auth.uid())
  );

CREATE POLICY "Admin zarządza lekcjami" ON lessons FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================================
-- TRANSACTIONS (rozliczenia)
-- ============================================================
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  type transaction_type NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Student widzi swoje transakcje" ON transactions
  FOR SELECT USING (
    student_id IN (SELECT id FROM students WHERE profile_id = auth.uid())
  );

CREATE POLICY "Admin zarządza transakcjami" ON transactions FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================================
-- REFERRALS
-- ============================================================
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES students(id),
  referred_id UUID NOT NULL REFERENCES students(id),
  code TEXT NOT NULL,
  referrer_credit NUMERIC(10,2) NOT NULL DEFAULT 50,
  referred_discount NUMERIC(10,2) NOT NULL DEFAULT 50,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Student widzi swoje polecenia" ON referrals
  FOR SELECT USING (
    referrer_id IN (SELECT id FROM students WHERE profile_id = auth.uid())
  );

CREATE POLICY "Admin zarządza poleceniami" ON referrals FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================================
-- AVAILABILITY (sloty nauczyciela)
-- ============================================================
CREATE TABLE availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

ALTER TABLE availability ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Dostępność widoczna publicznie" ON availability FOR SELECT USING (TRUE);
CREATE POLICY "Nauczyciel zarządza dostępnością" ON availability FOR ALL USING (
  teacher_id IN (SELECT id FROM teachers WHERE profile_id = auth.uid())
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================================
-- TRIGGER: auto-create profile po rejestracji
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- INDEKSY
-- ============================================================
CREATE INDEX idx_lessons_student ON lessons(student_id);
CREATE INDEX idx_lessons_teacher ON lessons(teacher_id);
CREATE INDEX idx_lessons_starts_at ON lessons(starts_at);
CREATE INDEX idx_transactions_student ON transactions(student_id);
CREATE INDEX idx_students_referral_code ON students(referral_code);
