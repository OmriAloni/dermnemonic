-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  hospital TEXT,
  year_of_residency INTEGER,
  bio TEXT,
  role TEXT NOT NULL DEFAULT 'contributor' CHECK (role IN ('curator', 'verified_contributor', 'contributor')),
  invited_by_user_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Learning aids table
CREATE TABLE learning_aids (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  uploader_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  caption TEXT,
  body TEXT,
  explanation TEXT,
  media_url TEXT,
  media_type TEXT CHECK (media_type IN ('illustration', 'table', 'summary-table', 'character', 'text-only', 'audio', 'video', 'photo')),
  source_citation TEXT,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  verified_by_user_id UUID REFERENCES users(id),
  verified_at TIMESTAMPTZ,
  pinned BOOLEAN NOT NULL DEFAULT FALSE,
  featured_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tags table (controlled vocabulary)
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category TEXT NOT NULL CHECK (category IN ('diagnosis', 'sign', 'pathology', 'treatment', 'aid_type', 'risk_factors')),
  value TEXT NOT NULL,
  value_he TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(category, value)
);

-- Learning aid tags junction table
CREATE TABLE learning_aid_tags (
  aid_id UUID NOT NULL REFERENCES learning_aids(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (aid_id, tag_id)
);

-- Ratings table
CREATE TABLE ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  aid_id UUID NOT NULL REFERENCES learning_aids(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stars INTEGER NOT NULL CHECK (stars >= 1 AND stars <= 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(aid_id, user_id)
);

-- Reactions table
CREATE TABLE reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  aid_id UUID NOT NULL REFERENCES learning_aids(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('heart', 'brain', 'lightbulb', 'laugh')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(aid_id, user_id, reaction_type)
);

-- Comments table
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  aid_id UUID NOT NULL REFERENCES learning_aids(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Study sets table
CREATE TABLE study_sets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Study set items table (with spaced repetition data)
CREATE TABLE study_set_items (
  set_id UUID NOT NULL REFERENCES study_sets(id) ON DELETE CASCADE,
  aid_id UUID NOT NULL REFERENCES learning_aids(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  last_reviewed_at TIMESTAMPTZ,
  next_review_at TIMESTAMPTZ,
  ease_factor REAL NOT NULL DEFAULT 2.5,
  PRIMARY KEY (set_id, aid_id)
);

-- Follows table
CREATE TABLE follows (
  follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  followed_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (follower_id, followed_id),
  CHECK (follower_id != followed_id)
);

-- Indexes for performance
CREATE INDEX idx_learning_aids_uploader ON learning_aids(uploader_id);
CREATE INDEX idx_learning_aids_created ON learning_aids(created_at DESC);
CREATE INDEX idx_learning_aids_verified ON learning_aids(verified);
CREATE INDEX idx_learning_aids_pinned ON learning_aids(pinned);
CREATE INDEX idx_learning_aid_tags_aid ON learning_aid_tags(aid_id);
CREATE INDEX idx_learning_aid_tags_tag ON learning_aid_tags(tag_id);
CREATE INDEX idx_ratings_aid ON ratings(aid_id);
CREATE INDEX idx_reactions_aid ON reactions(aid_id);
CREATE INDEX idx_comments_aid ON comments(aid_id);
CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_followed ON follows(followed_id);

-- Functions for aggregate stats
CREATE OR REPLACE FUNCTION get_aid_stats(aid_uuid UUID)
RETURNS TABLE(
  rating_avg NUMERIC,
  rating_count BIGINT,
  reaction_count BIGINT,
  comment_count BIGINT,
  save_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ROUND(AVG(r.stars), 2) as rating_avg,
    COUNT(DISTINCT r.id) as rating_count,
    COUNT(DISTINCT rx.id) as reaction_count,
    COUNT(DISTINCT c.id) as comment_count,
    COUNT(DISTINCT ssi.set_id) as save_count
  FROM learning_aids la
  LEFT JOIN ratings r ON la.id = r.aid_id
  LEFT JOIN reactions rx ON la.id = rx.aid_id
  LEFT JOIN comments c ON la.id = c.aid_id
  LEFT JOIN study_set_items ssi ON la.id = ssi.aid_id
  WHERE la.id = aid_uuid
  GROUP BY la.id;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_aids ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_aid_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_set_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users: Public read, users can update their own profile
CREATE POLICY "Users are viewable by everyone" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Learning aids: Public read, authenticated users can create, owners can update/delete
CREATE POLICY "Learning aids are viewable by everyone" ON learning_aids FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create learning aids" ON learning_aids FOR INSERT WITH CHECK (auth.uid() = uploader_id);
CREATE POLICY "Users can update own learning aids" ON learning_aids FOR UPDATE USING (auth.uid() = uploader_id);
CREATE POLICY "Users can delete own learning aids" ON learning_aids FOR DELETE USING (auth.uid() = uploader_id);
CREATE POLICY "Curators can update any learning aid" ON learning_aids FOR UPDATE USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'curator')
);

-- Tags: Public read, curators can create
CREATE POLICY "Tags are viewable by everyone" ON tags FOR SELECT USING (true);
CREATE POLICY "Curators can create tags" ON tags FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'curator')
);

-- Learning aid tags: Public read, uploader and curators can manage
CREATE POLICY "Learning aid tags are viewable by everyone" ON learning_aid_tags FOR SELECT USING (true);
CREATE POLICY "Users can add tags to own learning aids" ON learning_aid_tags FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM learning_aids WHERE id = aid_id AND uploader_id = auth.uid())
);
CREATE POLICY "Users can remove tags from own learning aids" ON learning_aid_tags FOR DELETE USING (
  EXISTS (SELECT 1 FROM learning_aids WHERE id = aid_id AND uploader_id = auth.uid())
);

-- Ratings: Public read, authenticated users can rate
CREATE POLICY "Ratings are viewable by everyone" ON ratings FOR SELECT USING (true);
CREATE POLICY "Authenticated users can rate" ON ratings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own ratings" ON ratings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own ratings" ON ratings FOR DELETE USING (auth.uid() = user_id);

-- Reactions: Public read, authenticated users can react
CREATE POLICY "Reactions are viewable by everyone" ON reactions FOR SELECT USING (true);
CREATE POLICY "Authenticated users can react" ON reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own reactions" ON reactions FOR DELETE USING (auth.uid() = user_id);

-- Comments: Public read, authenticated users can comment
CREATE POLICY "Comments are viewable by everyone" ON comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can comment" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own comments" ON comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON comments FOR DELETE USING (auth.uid() = user_id);

-- Study sets: Users can manage their own sets
CREATE POLICY "Users can view own study sets" ON study_sets FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can create study sets" ON study_sets FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update own study sets" ON study_sets FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Users can delete own study sets" ON study_sets FOR DELETE USING (auth.uid() = owner_id);

-- Study set items: Users can manage items in their own sets
CREATE POLICY "Users can view own study set items" ON study_set_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM study_sets WHERE id = set_id AND owner_id = auth.uid())
);
CREATE POLICY "Users can add items to own study sets" ON study_set_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM study_sets WHERE id = set_id AND owner_id = auth.uid())
);
CREATE POLICY "Users can update items in own study sets" ON study_set_items FOR UPDATE USING (
  EXISTS (SELECT 1 FROM study_sets WHERE id = set_id AND owner_id = auth.uid())
);
CREATE POLICY "Users can delete items from own study sets" ON study_set_items FOR DELETE USING (
  EXISTS (SELECT 1 FROM study_sets WHERE id = set_id AND owner_id = auth.uid())
);

-- Follows: Users can follow others and manage their own follows
CREATE POLICY "Follows are viewable by everyone" ON follows FOR SELECT USING (true);
CREATE POLICY "Users can follow others" ON follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow" ON follows FOR DELETE USING (auth.uid() = follower_id);

-- Trigger to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_learning_aids_updated_at BEFORE UPDATE ON learning_aids
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_study_sets_updated_at BEFORE UPDATE ON study_sets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
