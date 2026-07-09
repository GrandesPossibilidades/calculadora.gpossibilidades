-- Rode este script no SQL Editor do Supabase (dashboard do projeto).
-- Cria as tabelas do histórico compartilhado de orçamentos + RLS.

create sequence if not exists public.orcamentos_numero_seq;

create table if not exists public.orcamentos (
  id uuid primary key default gen_random_uuid(),
  numero integer not null default nextval('public.orcamentos_numero_seq'),
  criado_em timestamptz not null default now(),
  cliente text,
  observacao text,
  empresa text not null default 'GA' check (empresa in ('GA', 'PA')),
  custo_total numeric not null default 0,
  preco_total numeric not null default 0,
  margem_total numeric not null default 0,
  margem_pct numeric not null default 0,
  criado_por text not null
);

create table if not exists public.orcamento_itens (
  id uuid primary key default gen_random_uuid(),
  orcamento_id uuid not null references public.orcamentos (id) on delete cascade,
  nome text,
  fornecedor text,
  referencia text,
  referencias text[] not null default (array[])::text[],
  ordem integer not null default 0,
  custo_unit numeric not null default 0,
  quantidade numeric not null default 1,
  frete numeric not null default 0,
  comissao_pct numeric not null default 0,
  imposto_pct numeric not null default 15,
  preco_unit numeric not null default 0,
  total_item numeric not null default 0,
  margem_item numeric not null default 0
);

create index if not exists orcamento_itens_orcamento_id_idx on public.orcamento_itens (orcamento_id);
create index if not exists orcamentos_criado_em_idx on public.orcamentos (criado_em desc);

alter table public.orcamentos enable row level security;
alter table public.orcamento_itens enable row level security;

-- Histórico compartilhado: qualquer usuário autenticado (Gabriel ou Beatriz) vê e edita tudo.
-- Sem acesso anônimo/público.
drop policy if exists "orcamentos_select_auth" on public.orcamentos;
create policy "orcamentos_select_auth" on public.orcamentos for select to authenticated using (true);

drop policy if exists "orcamentos_insert_auth" on public.orcamentos;
create policy "orcamentos_insert_auth" on public.orcamentos for insert to authenticated with check (true);

drop policy if exists "orcamentos_update_auth" on public.orcamentos;
create policy "orcamentos_update_auth" on public.orcamentos for update to authenticated using (true);

drop policy if exists "orcamentos_delete_auth" on public.orcamentos;
create policy "orcamentos_delete_auth" on public.orcamentos for delete to authenticated using (true);

drop policy if exists "orcamento_itens_select_auth" on public.orcamento_itens;
create policy "orcamento_itens_select_auth" on public.orcamento_itens for select to authenticated using (true);

drop policy if exists "orcamento_itens_insert_auth" on public.orcamento_itens;
create policy "orcamento_itens_insert_auth" on public.orcamento_itens for insert to authenticated with check (true);

drop policy if exists "orcamento_itens_update_auth" on public.orcamento_itens;
create policy "orcamento_itens_update_auth" on public.orcamento_itens for update to authenticated using (true);

drop policy if exists "orcamento_itens_delete_auth" on public.orcamento_itens;
create policy "orcamento_itens_delete_auth" on public.orcamento_itens for delete to authenticated using (true);

-- Lista compartilhada de fornecedores (cresce conforme os usuários cadastram
-- novos em "Outros" na tela do item).
create table if not exists public.fornecedores (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  criado_em timestamptz not null default now()
);

alter table public.fornecedores enable row level security;

drop policy if exists "fornecedores_select_auth" on public.fornecedores;
create policy "fornecedores_select_auth" on public.fornecedores for select to authenticated using (true);

drop policy if exists "fornecedores_insert_auth" on public.fornecedores;
create policy "fornecedores_insert_auth" on public.fornecedores for insert to authenticated with check (true);

insert into public.fornecedores (nome) values
  ('EDG Gráfica'), ('M2 Flex'), ('Cubo CMYK'), ('Trio Gráfica'), ('Passe Vip'),
  ('Drika Brindes'), ('Mercado Livre'), ('Printi'), ('LG Sign')
on conflict (nome) do nothing;

-- Rode o bloco abaixo SOMENTE DEPOIS de criar os 2 usuários em
-- Authentication > Users > Add user (email + senha). Isso grava o nome de cada um
-- em user_metadata, usado pelo app para preencher "criado_por" corretamente.
update auth.users set raw_user_meta_data = raw_user_meta_data || '{"name": "Gabriel"}'::jsonb
  where email = 'gp@gpossibilidades.com.br';

update auth.users set raw_user_meta_data = raw_user_meta_data || '{"name": "Beatriz"}'::jsonb
  where email = 'beatriz@gpossibilidades.com.br';
