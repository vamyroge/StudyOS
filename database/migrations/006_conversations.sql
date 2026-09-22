create table conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  title varchar(300),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id) on delete cascade not null,
  role varchar(20) not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now() not null
);

create index idx_conversations_user on conversations(user_id, created_at desc);
create index idx_messages_conversation on messages(conversation_id, created_at);

alter table conversations enable row level security;
alter table messages enable row level security;

create policy "Users read own conversations" on conversations for select using (auth.uid() = user_id);
create policy "Users insert own conversations" on conversations for insert with check (auth.uid() = user_id);
create policy "Users update own conversations" on conversations for update using (auth.uid() = user_id);
create policy "Users delete own conversations" on conversations for delete using (auth.uid() = user_id);

create policy "Users read own messages" on messages for select using (exists (select 1 from conversations c where c.id = conversation_id and c.user_id = auth.uid()));
create policy "System inserts messages" on messages for insert with check (true);