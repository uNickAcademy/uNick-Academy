insert into storage.buckets (id, name, public)
values ('lesson-plans', 'lesson-plans', false);

create policy "Free lesson PDFs are downloadable by everyone"
  on storage.objects for select
  using (
    bucket_id = 'lesson-plans'
    and exists (
      select 1 from public.lesson_plans
      where lesson_plans.pdf_path = storage.objects.name
        and lesson_plans.is_free = true
    )
  );

create policy "Active subscribers can download all lesson PDFs"
  on storage.objects for select
  using (
    bucket_id = 'lesson-plans'
    and exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.subscription_status = 'active'
    )
  );

create policy "Admins can manage lesson PDFs"
  on storage.objects for all
  using (
    bucket_id = 'lesson-plans'
    and exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.is_admin = true
    )
  )
  with check (
    bucket_id = 'lesson-plans'
    and exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.is_admin = true
    )
  );
