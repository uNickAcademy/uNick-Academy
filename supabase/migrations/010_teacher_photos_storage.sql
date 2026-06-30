-- Public storage bucket for teacher profile photos (self-service upload).
-- Path convention: {teacher_id}/photo.png — one current photo per teacher, overwritten on re-upload.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('teacher-photos', 'teacher-photos', true, 5242880, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

create policy "Teacher photos are publicly readable"
on storage.objects for select
using (bucket_id = 'teacher-photos');

create policy "Teachers can upload their own photo"
on storage.objects for insert
with check (
  bucket_id = 'teacher-photos'
  and auth.uid() in (
    select profile_id from public.teachers where id::text = (storage.foldername(name))[1]
  )
);

create policy "Teachers can replace their own photo"
on storage.objects for update
using (
  bucket_id = 'teacher-photos'
  and auth.uid() in (
    select profile_id from public.teachers where id::text = (storage.foldername(name))[1]
  )
);

create policy "Teachers can delete their own photo"
on storage.objects for delete
using (
  bucket_id = 'teacher-photos'
  and auth.uid() in (
    select profile_id from public.teachers where id::text = (storage.foldername(name))[1]
  )
);
