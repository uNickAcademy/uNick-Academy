create policy "Admins can view all lesson plans"
  on public.lesson_plans for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.is_admin = true
    )
  );
