-- Add INSERT policy for users table so new users can create their profile
CREATE POLICY "Users can insert own profile" ON users FOR INSERT 
WITH CHECK (auth.uid() = id);
