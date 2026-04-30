alter table public.users
  add column if not exists date_of_birth date null,
  add column if not exists gender text null;

alter table public.users
  drop constraint if exists users_date_of_birth_valid,
  add constraint users_date_of_birth_valid
    check (
      date_of_birth is null
      or (
        date_of_birth >= date '1900-01-01'
        and date_of_birth <= current_date
      )
    );

alter table public.users
  drop constraint if exists users_gender_valid,
  add constraint users_gender_valid
    check (
      gender is null
      or gender in (
        'female',
        'male',
        'non_binary',
        'other',
        'prefer_not_to_say'
      )
    );

comment on column public.users.date_of_birth is
  'Optional date of birth for HR and platform demographic reporting. Stores only the date, not derived age.';

comment on column public.users.gender is
  'Optional controlled gender value for aggregate demographic reporting.';
