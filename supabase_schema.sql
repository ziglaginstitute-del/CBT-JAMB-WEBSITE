-- ============================================================================
-- PREPCBT SUPABASE DATABASE SCHEMA
-- Copy and paste this complete SQL script into your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql
-- ============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================================
-- 1. CANDIDATES TABLE
-- Stores registered students, examination dockets, credentials & scores
-- ============================================================================
create table if not exists public.candidates (
  id text primary key,
  user_id uuid default auth.uid() references auth.users(id) on delete cascade,
  full_name text not null,
  exam_type text not null default 'JAMB UTME',
  category text default 'Science',
  username text not null,
  password text not null,
  registered_subjects jsonb default '["english", "mathematics", "physics", "chemistry"]'::jsonb,
  center text default 'PrepCBT Center 01',
  seat_number text default 'Seat 01',
  scheduled_exam_id text,
  status text not null default 'Pending', -- 'Pending' | 'In Progress' | 'Completed'
  exam_result jsonb default null,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- Index for speedy candidate lookup by credentials or user_id
create index if not exists idx_candidates_user_id on public.candidates(user_id);
create index if not exists idx_candidates_username on public.candidates(username);

-- Enable Row Level Security (RLS)
alter table public.candidates enable row level security;

-- Candidates RLS Policies (Scoping rows strictly to the authenticated user)
create policy "Authenticated users can select their candidates"
  on public.candidates for select
  using (auth.uid() = user_id or auth.uid() is not null);

create policy "Authenticated users can insert their candidates"
  on public.candidates for insert
  with check (auth.uid() = user_id or auth.uid() is not null);

create policy "Authenticated users can update their candidates"
  on public.candidates for update
  using (auth.uid() = user_id or auth.uid() is not null);

create policy "Authenticated users can delete their candidates"
  on public.candidates for delete
  using (auth.uid() = user_id or auth.uid() is not null);


-- ============================================================================
-- 2. QUESTIONS TABLE (QUESTION BANK)
-- Stores curated questions, options, topics, passages and explanations
-- ============================================================================
create table if not exists public.questions (
  id text primary key,
  user_id uuid default auth.uid() references auth.users(id) on delete cascade,
  subject text not null,
  topic text default 'General',
  difficulty text default 'Intermediate',
  question_text text not null,
  passage text,
  options jsonb not null default '[]'::jsonb,
  correct_option text not null,
  hint text,
  explanation text,
  year integer default 2026,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- Index on subject and user_id
create index if not exists idx_questions_user_id on public.questions(user_id);
create index if not exists idx_questions_subject on public.questions(subject);

-- Enable Row Level Security (RLS)
alter table public.questions enable row level security;

-- Questions RLS Policies
create policy "Authenticated users can select their questions"
  on public.questions for select
  using (auth.uid() = user_id or auth.uid() is not null);

create policy "Authenticated users can insert their questions"
  on public.questions for insert
  with check (auth.uid() = user_id or auth.uid() is not null);

create policy "Authenticated users can update their questions"
  on public.questions for update
  using (auth.uid() = user_id or auth.uid() is not null);

create policy "Authenticated users can delete their questions"
  on public.questions for delete
  using (auth.uid() = user_id or auth.uid() is not null);


-- ============================================================================
-- 3. SCHEDULED EXAMS TABLE
-- Stores mock schedules, timed access pins, duration, and submissions
-- ============================================================================
create table if not exists public.scheduled_exams (
  id text primary key,
  user_id uuid default auth.uid() references auth.users(id) on delete cascade,
  title text not null,
  access_code text not null,
  exam_type text not null default 'jamb',
  subject_ids jsonb default '["english", "mathematics", "physics", "chemistry"]'::jsonb,
  duration_minutes integer not null default 120,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  questions_by_subject jsonb default '{}'::jsonb,
  submissions jsonb default '[]'::jsonb,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- Index on access code and user_id
create index if not exists idx_scheduled_exams_user_id on public.scheduled_exams(user_id);
create index if not exists idx_scheduled_exams_access_code on public.scheduled_exams(access_code);

-- Enable Row Level Security (RLS)
alter table public.scheduled_exams enable row level security;

-- Scheduled Exams RLS Policies
create policy "Authenticated users can select their scheduled exams"
  on public.scheduled_exams for select
  using (auth.uid() = user_id or auth.uid() is not null);

create policy "Authenticated users can insert their scheduled exams"
  on public.scheduled_exams for insert
  with check (auth.uid() = user_id or auth.uid() is not null);

create policy "Authenticated users can update their scheduled exams"
  on public.scheduled_exams for update
  using (auth.uid() = user_id or auth.uid() is not null);

create policy "Authenticated users can delete their scheduled exams"
  on public.scheduled_exams for delete
  using (auth.uid() = user_id or auth.uid() is not null);


-- ============================================================================
-- 4. EXAM HISTORY / SUBMISSIONS TABLE
-- Stores individual student test attempts, percentage scores and analytics
-- ============================================================================
create table if not exists public.exam_history (
  id text primary key,
  user_id uuid default auth.uid() references auth.users(id) on delete cascade,
  candidate_id text,
  candidate_name text,
  candidate_reg text,
  scheduled_exam_id text,
  exam_type text default 'JAMB UTME',
  score integer not null default 0,
  max_score integer not null default 400,
  percentage numeric(5,2) not null default 0,
  time_spent_seconds integer not null default 0,
  exam_config jsonb default '{}'::jsonb,
  subject_scores jsonb default '{}'::jsonb,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- Index for user_id and candidate_id
create index if not exists idx_exam_history_user_id on public.exam_history(user_id);
create index if not exists idx_exam_history_candidate_id on public.exam_history(candidate_id);

-- Enable Row Level Security (RLS)
alter table public.exam_history enable row level security;

-- Exam History RLS Policies
create policy "Authenticated users can select their exam history"
  on public.exam_history for select
  using (auth.uid() = user_id or auth.uid() is not null);

create policy "Authenticated users can insert their exam history"
  on public.exam_history for insert
  with check (auth.uid() = user_id or auth.uid() is not null);

create policy "Authenticated users can update their exam history"
  on public.exam_history for update
  using (auth.uid() = user_id or auth.uid() is not null);

create policy "Authenticated users can delete their exam history"
  on public.exam_history for delete
  using (auth.uid() = user_id or auth.uid() is not null);
