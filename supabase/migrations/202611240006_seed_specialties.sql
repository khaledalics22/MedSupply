-- MedSupply specialty seed for legacy application IDs.
-- Prepared for review only. Do not execute until approved.

begin;

insert into public.specialties (legacy_id, name, description, is_active)
values
  ('general', 'General', 'General pharmacy products', true),
  ('beauty', 'Beauty', 'Beauty and personal care products', true),
  ('health', 'Health', 'Health and wellness products', true),
  ('baby', 'Baby', 'Baby care products', true),
  ('elderly', 'Elderly', 'Elderly care products', true),
  ('supplements', 'Supplements', 'Nutrition and pharmaceutical supplements', true),
  ('medical', 'Medical', 'Medical devices and measuring supplies', true)
  on conflict (legacy_id) do update set
    name = excluded.name,
    description = excluded.description,
    is_active = excluded.is_active,
    updated_at = pg_catalog.now();

commit;
