-- 108: Naprawa realnego, przedistniejącego błędu — polityka RLS
-- "Grupy widoczne dla zalogowanych" wymagała auth.uid() IS NOT NULL, więc
-- niezalogowani odwiedzający publicznej strony /zapisy NIGDY nie widzieli
-- żadnych aktywnych grup (getPublicGroups() zawsze zwracało pustą listę dla
-- prawdziwego anonimowego gościa — widoczność w testach brała się z bycia
-- zalogowanym w przeglądarce). Zastępujemy politykę: aktywne grupy widoczne
-- dla wszystkich (jak publiczne profile nauczycieli), nieaktywne — tylko dla
-- zalogowanych (np. admina przeglądającego historię).

drop policy if exists "Grupy widoczne dla zalogowanych" on public.groups;

create policy "Aktywne grupy widoczne publicznie" on public.groups
  for select
  using (is_active = true or auth.uid() is not null);
