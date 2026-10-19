begin;

insert into public.menu_items (id, name, description, price, category, image_url, sort_order)
values
  ('signature-filter', 'Normal Tea', 'Simple, comforting and perfect anytime.', 20, 'Tea & more', '', 1),
  ('velvet-cappuccino', 'Masala Tea', 'Classic Indian masala chai made with finest spices.', 30, 'Tea & more', '', 2),
  ('iced-caramel', 'Ginger Tea', 'Aromatic and soothing tea made with fresh ginger.', 30, 'Tea & more', '', 3),
  ('rose-chai', 'Lemon Tea', 'Refreshing tea with a tangy lemon twist.', 30, 'Tea & more', '', 4),
  ('pistachio-croissant', 'Green Tea', 'Light, healthy and refreshing green tea.', 30, 'Tea & more', '', 5),
  ('dark-chocolate-cookie', 'Kashmiri Kahwa', 'Traditional Kahwa with saffron, almonds and aromatic spices.', 30, 'Tea & more', '', 6),
  ('purple-tea-sangu-poo', 'Purple Tea (Sangu Poo)', 'Delightful and refreshing tea made from Sangu Poo.', 30, 'Tea & more', '', 7),
  ('coffee', 'Coffee', 'Rich, aromatic coffee to uplift your mood.', 30, 'Coffee', '', 8)
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

commit;
