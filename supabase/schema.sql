create table if not exists takes (
  id uuid primary key default gen_random_uuid(),
  author_id text not null,
  author_name text not null,
  squad text default 'Phoenix',
  text text not null check (char_length(text) between 8 and 280),
  votes int default 0,
  spiciness_score numeric default 5,
  spiciness_reason text default 'No score reason was saved.',
  heat_tier text default 'Warm',
  category text default 'General debate',
  controversy_type text default 'Opinion challenge',
  audience_split text default 'Mixed audience reaction',
  safety_level text default 'Clean debate',
  tags text[] default array['debate'],
  steelman text,
  remix text,
  debate_brief text,
  created_at timestamptz default now()
);

create table if not exists rebuttals (
  id uuid primary key default gen_random_uuid(),
  take_id uuid references takes(id) on delete cascade,
  content text not null,
  created_at timestamptz default now(),
  unique(take_id)
);

create table if not exists votes (
  id uuid primary key default gen_random_uuid(),
  take_id uuid references takes(id) on delete cascade,
  user_id text not null,
  value int check (value in (-1, 1)),
  unique(take_id, user_id)
);

create index if not exists takes_created_at_idx on takes(created_at desc);
create index if not exists takes_squad_idx on takes(squad);
create index if not exists votes_take_id_idx on votes(take_id);
