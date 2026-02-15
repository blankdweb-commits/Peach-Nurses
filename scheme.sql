-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  alias TEXT DEFAULT 'Anonymous',
  level TEXT DEFAULT 'Unknown',
  location JSONB DEFAULT '{"latitude": 5.5380, "longitude": 5.7600, "based": "Delta"}'::jsonb,
  basics JSONB DEFAULT '{"fun": [], "media": []}'::jsonb,
  relationships JSONB DEFAULT '{"values": [], "lookingFor": "Friendship"}'::jsonb,
  life JSONB DEFAULT '{"based": "Delta"}'::jsonb,
  sweet_peaches TEXT[] DEFAULT '{}',
  bruised_peaches TEXT[] DEFAULT '{}',
  photo_url TEXT,
  onboarding_complete BOOLEAN DEFAULT FALSE,
  banned BOOLEAN DEFAULT FALSE,
  preferences JSONB DEFAULT '{"allowAds": true, "gender_preference": null, "max_distance": 50}'::jsonb,
  subscription JSONB DEFAULT '{"isPremium": false, "dailyUnripes": 25, "expiresAt": null}'::jsonb,
  business JSONB DEFAULT '{"isBusiness": false, "ads": []}'::jsonb,
  kyc_status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (RLS) policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view other profiles
CREATE POLICY "Users can view other profiles"
  ON profiles FOR SELECT
  USING (true);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy: Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 2. RIPEN_HISTORY TABLE (tracks likes/swipes)
CREATE TABLE IF NOT EXISTS ripen_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  target_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, target_user_id)
);

ALTER TABLE ripen_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ripen history"
  ON ripen_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create ripen history"
  ON ripen_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 3. CHAT_ROOMS TABLE
CREATE TABLE IF NOT EXISTS chat_rooms (
  id TEXT PRIMARY KEY,
  participants UUID[] NOT NULL,
  last_message TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their chat rooms"
  ON chat_rooms FOR SELECT
  USING (auth.uid() = ANY(participants));

CREATE POLICY "Users can insert chat rooms"
  ON chat_rooms FOR INSERT
  WITH CHECK (auth.uid() = ANY(participants));

-- 4. MESSAGES TABLE
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  chat_room_id TEXT REFERENCES chat_rooms(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in their chat rooms"
  ON messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM chat_rooms 
    WHERE chat_rooms.id = messages.chat_room_id 
    AND auth.uid() = ANY(chat_rooms.participants)
  ));

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- 5. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- 6. ADS TABLE (for business accounts)
CREATE TABLE IF NOT EXISTS ads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  business_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  headline TEXT NOT NULL,
  description TEXT,
  price TEXT,
  image_url TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE ads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view active ads"
  ON ads FOR SELECT
  USING (active = true);

CREATE POLICY "Business owners can manage their ads"
  ON ads FOR ALL
  USING (auth.uid() = business_id)
  WITH CHECK (auth.uid() = business_id);

-- 7. KYC_VERIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS kyc_verifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  full_name TEXT,
  id_type TEXT,
  id_number TEXT,
  id_image_url TEXT,
  selfie_url TEXT,
  status TEXT DEFAULT 'pending',
  verified_at TIMESTAMP WITH TIME ZONE,
  rejected_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE kyc_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own KYC"
  ON kyc_verifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can submit KYC"
  ON kyc_verifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own KYC"
  ON kyc_verifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 8. FEEDBACK TABLE
CREATE TABLE IF NOT EXISTS feedback (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can submit feedback"
  ON feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view feedback"
  ON feedback FOR SELECT
  USING (auth.uid() IN (SELECT id FROM profiles WHERE email LIKE '%@admin.peaches%'));

-- Create indexes for better performance
CREATE INDEX idx_profiles_location ON profiles USING GIN(location);
CREATE INDEX idx_profiles_onboarding ON profiles(onboarding_complete) WHERE onboarding_complete = true;
CREATE INDEX idx_ripen_history_user ON ripen_history(user_id, created_at);
CREATE INDEX idx_ripen_history_target ON ripen_history(target_user_id, created_at);
CREATE INDEX idx_chat_rooms_participants ON chat_rooms USING GIN(participants);
CREATE INDEX idx_messages_chat_room ON messages(chat_room_id, created_at);
CREATE INDEX idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX idx_ads_business ON ads(business_id, created_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kyc_updated_at 
  BEFORE UPDATE ON kyc_verifications 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile after signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to check mutual match
CREATE OR REPLACE FUNCTION check_mutual_match()
RETURNS TRIGGER AS $$
DECLARE
  mutual_exists BOOLEAN;
  chat_id TEXT;
BEGIN
  -- Check if mutual ripen exists
  SELECT EXISTS (
    SELECT 1 FROM ripen_history 
    WHERE user_id = NEW.target_user_id 
    AND target_user_id = NEW.user_id
  ) INTO mutual_exists;

  IF mutual_exists THEN
    -- Create chat room ID (sorted IDs joined with underscore)
    SELECT array_to_string(ARRAY(SELECT unnest(ARRAY[NEW.user_id, NEW.target_user_id] ORDER BY 1)), '_')
    INTO chat_id;

    -- Insert chat room
    INSERT INTO chat_rooms (id, participants)
    VALUES (chat_id, ARRAY[NEW.user_id, NEW.target_user_id])
    ON CONFLICT (id) DO NOTHING;

    -- Create notifications for both users
    INSERT INTO notifications (user_id, type, message)
    VALUES 
      (NEW.user_id, 'match', 'You have a new match!'),
      (NEW.target_user_id, 'match', 'You have a new match!');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to check for mutual matches
CREATE OR REPLACE TRIGGER on_ripen_created
  AFTER INSERT ON ripen_history
  FOR EACH ROW EXECUTE FUNCTION check_mutual_match();