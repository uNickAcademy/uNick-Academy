-- Admin can already edit every other teachers.* field for any teacher (see
-- "Admin zarządza nauczycielami" on public.teachers). The teacher-photos
-- storage bucket had no equivalent: only the teacher themself could write to
-- their own folder, so an admin fixing up a colleague's photo had no path
-- that didn't require that teacher's own login. Mirror the same admin check
-- onto storage.objects for this bucket.
create policy "Admin zarządza zdjęciami nauczycieli"
on storage.objects
for all
using (
  bucket_id = 'teacher-photos'
  and exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
)
with check (
  bucket_id = 'teacher-photos'
  and exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
