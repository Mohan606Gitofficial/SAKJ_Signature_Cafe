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
  ('signature-filter', 'Signature Filter', 'Slow-brewed, full-bodied and finished with a little jaggery.', 140, 'Coffee', 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=900&q=85', 1),
  ('velvet-cappuccino', 'Velvet Cappuccino', 'A double shot under a cloud of silky, steamed milk.', 180, 'Coffee', 'https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=900&q=85', 2),
  ('iced-caramel', 'Iced Caramel Latte', 'Espresso, chilled milk and our house-made caramel.', 210, 'Coffee', 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=900&q=85', 3),
  ('rose-chai', 'Rose Chai', 'Warming spiced tea with a gentle rose and cardamom finish.', 150, 'Tea & more', 'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?auto=format&fit=crop&w=900&q=85', 4),
  ('pistachio-croissant', 'Pistachio Croissant', 'Flaky, golden layers filled with roasted pistachio cream.', 190, 'From the oven', 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=900&q=85', 5),
  ('dark-chocolate-cookie', 'Dark Chocolate Cookie', 'Crisp edges, a soft centre and generous chocolate chunks.', 110, 'From the oven', 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=900&q=85', 6)
on conflict (id) do nothing;
