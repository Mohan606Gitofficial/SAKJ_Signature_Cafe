create extension if not exists pgcrypto;

create table if not exists public.menu_items (
  id text primary key,
  name text not null check (char_length(name) between 1 and 100),
  description text not null default '',
  price integer not null check (price between 1 and 1000000),
  category text not null check (category in ('Coffee', 'Tea & more', 'From the oven')),
  image_url text not null default '',
  available boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null check (char_length(customer_name) between 2 and 100),
  phone text not null check (char_length(phone) between 7 and 30),
  items jsonb not null check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) > 0),
  total integer not null check (total > 0),
  notes text check (notes is null or char_length(notes) <= 500),
  status text not null default 'new'
    check (status in ('new', 'preparing', 'ready', 'completed', 'cancelled')),
  created_at timestamptz not null default now()
);

alter table public.menu_items enable row level security;
alter table public.admins enable row level security;
alter table public.orders enable row level security;

drop policy if exists "Anyone can view available menu items" on public.menu_items;
create policy "Anyone can view available menu items"
  on public.menu_items for select to anon, authenticated
  using (available or exists (
    select 1 from public.admins where admins.user_id = (select auth.uid())
  ));

drop policy if exists "Admins can manage menu items" on public.menu_items;
create policy "Admins can manage menu items"
  on public.menu_items for all to authenticated
  using (exists (
    select 1 from public.admins where admins.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.admins where admins.user_id = (select auth.uid())
  ));

drop policy if exists "Admins can view their own admin record" on public.admins;
create policy "Admins can view their own admin record"
  on public.admins for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Admins can view orders" on public.orders;
create policy "Admins can view orders"
  on public.orders for select to authenticated
  using (exists (
    select 1 from public.admins where admins.user_id = (select auth.uid())
  ));

drop policy if exists "Admins can update orders" on public.orders;
create policy "Admins can update orders"
  on public.orders for update to authenticated
  using (exists (
    select 1 from public.admins where admins.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.admins where admins.user_id = (select auth.uid())
  ));

create or replace function public.create_order(
  p_customer_name text,
  p_phone text,
  p_items jsonb,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  item jsonb;
  menu_item public.menu_items%rowtype;
  normalized_items jsonb := '[]'::jsonb;
  order_total integer := 0;
  item_id text;
  item_quantity integer;
  new_order_id uuid;
begin
  if p_customer_name is null
     or char_length(trim(p_customer_name)) not between 2 and 100 then
    raise exception 'Please enter a name between 2 and 100 characters.';
  end if;
  if p_phone is null
     or char_length(trim(p_phone)) not between 7 and 30 then
    raise exception 'Please enter a valid phone number.';
  end if;
  if p_notes is not null and char_length(p_notes) > 500 then
    raise exception 'Order notes must be 500 characters or fewer.';
  end if;
  if jsonb_typeof(p_items) is distinct from 'array'
     or jsonb_array_length(p_items) not between 1 and 30 then
    raise exception 'An order must contain between 1 and 30 items.';
  end if;

  for item in select value from jsonb_array_elements(p_items)
  loop
    if jsonb_typeof(item -> 'id') is distinct from 'string'
       or jsonb_typeof(item -> 'quantity') is distinct from 'number'
       or (item ->> 'quantity') !~ '^[0-9]+$' then
      raise exception 'An order item is invalid.';
    end if;

    item_id := item ->> 'id';
    item_quantity := (item ->> 'quantity')::integer;
    if item_quantity not between 1 and 20 then
      raise exception 'Each item quantity must be between 1 and 20.';
    end if;

    select * into menu_item
    from public.menu_items
    where id = item_id and available = true;
    if not found then
      raise exception 'A selected menu item is no longer available.';
    end if;

    order_total := order_total + menu_item.price * item_quantity;
    normalized_items := normalized_items || jsonb_build_array(jsonb_build_object(
      'id', menu_item.id,
      'name', menu_item.name,
      'price', menu_item.price,
      'quantity', item_quantity
    ));
  end loop;

  insert into public.orders (customer_name, phone, items, total, notes)
  values (trim(p_customer_name), trim(p_phone), normalized_items, order_total, nullif(trim(p_notes), ''))
  returning id into new_order_id;

  return new_order_id;
end;
$$;

revoke all on function public.create_order(text, text, jsonb, text) from public;
grant execute on function public.create_order(text, text, jsonb, text) to anon, authenticated;

grant select on public.menu_items to anon, authenticated;
grant insert, update, delete on public.menu_items to authenticated;
grant select on public.admins to authenticated;
grant select, update on public.orders to authenticated;

insert into public.menu_items (id, name, description, price, category, image_url, sort_order)
values
  ('signature-filter', 'Normal Tea', 'Simple, comforting and perfect anytime.', 20, 'Tea & more', '/menu/products/normal-tea.png', 1),
  ('velvet-cappuccino', 'Masala Tea', 'Classic Indian masala chai made with finest spices.', 30, 'Tea & more', '/menu/products/masala-tea.png', 2),
  ('iced-caramel', 'Ginger Tea', 'Aromatic and soothing tea made with fresh ginger.', 30, 'Tea & more', '/menu/products/ginger-tea.png', 3),
  ('rose-chai', 'Lemon Tea', 'Refreshing tea with a tangy lemon twist.', 30, 'Tea & more', '/menu/products/lemon-tea.png', 4),
  ('pistachio-croissant', 'Green Tea', 'Light, healthy and refreshing green tea.', 30, 'Tea & more', '/menu/products/green-tea.png', 5),
  ('dark-chocolate-cookie', 'Kashmiri Kahwa', 'Traditional Kahwa with saffron, almonds and aromatic spices.', 30, 'Tea & more', '/menu/products/kashmiri-kahwa.png', 6),
  ('purple-tea-sangu-poo', 'Purple Tea (Sangu Poo)', 'Delightful and refreshing tea made from Sangu Poo.', 30, 'Tea & more', '/menu/products/purple-tea-sangu-poo.png', 7),
  ('coffee', 'Coffee', 'Rich, aromatic coffee to uplift your mood.', 30, 'Coffee', '/menu/products/coffee.png', 8)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  image_url = excluded.image_url,
  available = true,
  sort_order = excluded.sort_order;

delete from public.menu_items
where id not in (
  'signature-filter',
  'velvet-cappuccino',
  'iced-caramel',
  'rose-chai',
  'pistachio-croissant',
  'dark-chocolate-cookie',
  'purple-tea-sangu-poo',
  'coffee'
);
