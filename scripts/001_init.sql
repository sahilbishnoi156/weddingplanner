create table if not exists cities (
  id serial primary key,
  name text unique not null,
  created_at timestamptz not null default now()
);

create table if not exists guests (
  id serial primary key,
  name text not null,
  city_id integer references cities(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists categories (
  id serial primary key,
  name text unique not null,
  type text not null default 'checkbox',
  created_at timestamptz not null default now()
);

create table if not exists guest_checks (
  guest_id integer not null references guests(id) on delete cascade,
  category_id integer not null references categories(id) on delete cascade,
  checked boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (guest_id, category_id)
);

create index if not exists idx_guests_city_id on guests(city_id);
create index if not exists idx_guest_checks_guest on guest_checks(guest_id);
create index if not exists idx_guest_checks_category on guest_checks(category_id);
