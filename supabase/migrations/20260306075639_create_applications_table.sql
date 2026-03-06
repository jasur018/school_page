/*
  # Create applications table for school enrollment

  1. New Tables
    - `applications`
      - `id` (uuid, primary key)
      - `student_name` (text, required)
      - `parent_name` (text, required)
      - `email` (text, required)
      - `phone` (text, required)
      - `grade_level` (text, required - values: 9, 10, 11, 12)
      - `message` (text, optional)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `applications` table
    - Add policy to allow anyone to insert applications (public submissions)
*/

CREATE TABLE IF NOT EXISTS applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_name text NOT NULL,
  parent_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  grade_level text NOT NULL,
  message text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit applications"
  ON applications
  FOR INSERT
  TO anon
  WITH CHECK (true);
