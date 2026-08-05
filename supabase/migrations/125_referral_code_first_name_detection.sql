-- ============================================================================
-- 120: Wykrywanie imienia w polu „imię i nazwisko".
--
-- Migracja 119 brała pierwszy człon pola, a na produkcji 62 ze 146 rekordów
-- ma dane zapisane jako „Nazwisko Imię" — powstawały kody typu uNickPszczola…
-- zamiast uNickAnna…
--
-- E-mail nie rozstrzyga: kolejność w pszczola.anna@ nic nie mówi o tym, który
-- człon jest imieniem (80 ze 146 adresów zawiera oba człony, w obu kolejnościach).
-- Głównym sygnałem jest więc słownik imion, pomocniczym końcówka nazwiskowa,
-- a przypadki nierozstrzygnięte dostają flagę do ręcznego przeglądu zamiast
-- po cichu wygenerowanego złego kodu.
--
-- Skuteczność na produkcji: 137/146 „pewne", 4 z końcówki, 5 niepewnych.
-- ============================================================================

create or replace function public.is_polish_first_name(p_token text)
returns boolean
language sql
immutable
set search_path to 'public'
as $$
  select lower(btrim(coalesce(p_token, ''))) = any (array[
    'adam','adrian','agata','agnieszka','aleksander','aleksandra','alicja','alina','amelia','andrzej',
    'aneta','anna','antoni','arkadiusz','artur','barbara','bartlomiej','bartosz','beata','bernadeta',
    'blanka','bogdan','bogumila','bogusalw','bozena','bronislaw','cezary','damian','daniel','danuta',
    'dariusz','dawid','diana','dominik','dominika','dorota','edyta','elzbieta','emilia','emil',
    'ewa','ewelina','filip','franciszek','gabriel','gabriela','grazyna','grzegorz','halina','hanna',
    'helena','henryk','hubert','igor','ilona','irena','iwona','iza','izabela','jacek',
    'jadwiga','jagoda','jakub','jan','janina','janusz','jaroslaw','jerzy','joanna','jolanta',
    'jozef','judyta','julia','julian','justyna','kacper','kamil','kamila','karol','karolina',
    'katarzyna','kazimierz','kinga','klaudia','konrad','krystian','krystyna','krzysztof','lena','leszek',
    'lidia','liliana','lucyna','lukasz','maciej','magdalena','maja','malgorzata','marcelina','marcin',
    'marek','maria','mariola','mariusz','marta','martyna','mateusz','michal','mikolaj','milena',
    'miroslaw','monika','natalia','nikola','nina','norbert','oliwia','olga','pamela','patrycja',
    'patryk','paulina','pawel','piotr','przemyslaw','radoslaw','rafal','remigiusz','renata','robert',
    'roman','ryszard','sandra','sebastian','sylwia','szymon','slawomir','stanislaw','stefan','sabina',
    'tadeusz','tomasz','urszula','wanda','waldemar','weronika','wiktor','wiktoria','wioletta','witold',
    'wladyslaw','wlodzimierz','wojciech','zbigniew','zdzislaw','zofia','zuzanna','aldona','ala','ania',
    'antonina','apolonia','arletta','aurelia','celina','cecylia','czeslaw','dagmara','daria','dionizy',
    'edward','eliza','elwira','eryk','estera','eugeniusz','fabian','felicja','gerard','gustaw',
    'ida','ignacy','inga','jaroslawa','kajetan','kalina','karina','klara','kornelia','ksawery',
    'laura','leon','leokadia','lilianna','lucjan','ludwik','maksymilian','malwina','marianna','marzena',
    'melania','miloslaw','mirella','nadia','natasza','nela','olaf','oskar','otylia','paula',
    'roksana','rozalia','ruta','stanislawa','stella','sonia','teresa','tymon','tymoteusz','wacław',
    'walentyna','wera','wiesław','wiesława','zenon','zyta','alan','borys','cyprian','dagny',
    'ewaryst','gniewomir','iga','jasmina','lena','liwia','maurycy','nadzieja','pola','rita',
    'sara','tola','wanessa','xawery','zaneta','zaneta','jagna','basia','kasia','asia'
  ])
$$;

comment on function public.is_polish_first_name(text) is
  'Czy token jest rozpoznawalnym polskim imieniem. Główny sygnał przy odróżnianiu imienia od nazwiska w polu „imię i nazwisko".';

create or replace function public.looks_like_surname(p_token text)
returns boolean
language sql
immutable
set search_path to 'public'
as $$
  select lower(btrim(coalesce(p_token, ''))) ~
    '(ski|ska|cki|cka|dzki|dzka|wicz|czyk|czak|owski|owska|ewski|ewska|inski|inska|ynski|ynska)$'
$$;

create or replace function public.pick_first_name(p_name text)
returns table (imie text, pewnosc text)
language plpgsql
immutable
set search_path to 'public'
as $$
declare
  v_norm text := btrim(translate(coalesce(p_name, ''),
                  'ąćęłńóśźżĄĆĘŁŃÓŚŹŻ', 'acelnoszzACELNOSZZ'));
  t1 text := split_part(v_norm, ' ', 1);
  t2 text := split_part(v_norm, ' ', 2);
  d1 boolean;
  d2 boolean;
begin
  if coalesce(t2, '') = '' then
    return query select t1, case when public.is_polish_first_name(t1) then 'pewne' else 'jeden_czlon' end;
    return;
  end if;

  d1 := public.is_polish_first_name(t1);
  d2 := public.is_polish_first_name(t2);

  if d1 and not d2 then return query select t1, 'pewne'; return; end if;
  if d2 and not d1 then return query select t2, 'pewne'; return; end if;

  if public.looks_like_surname(t1) and not public.looks_like_surname(t2) then
    return query select t2, case when d1 and d2 then 'oba_imiona_koncowka' else 'koncowka' end; return;
  end if;
  if public.looks_like_surname(t2) and not public.looks_like_surname(t1) then
    return query select t1, case when d1 and d2 then 'oba_imiona_koncowka' else 'koncowka' end; return;
  end if;

  return query select t1, 'niepewne';
end $$;

comment on function public.pick_first_name(text) is
  'Wyciąga imię z pola „imię i nazwisko" zapisanego w dowolnej kolejności. Zwraca też pewność: pewne / koncowka / jeden_czlon / niepewne.';

revoke execute on function public.is_polish_first_name(text) from public, anon;
revoke execute on function public.looks_like_surname(text)   from public, anon;
revoke execute on function public.pick_first_name(text)      from public, anon;
grant  execute on function public.is_polish_first_name(text) to authenticated, service_role;
grant  execute on function public.looks_like_surname(text)   to authenticated, service_role;
grant  execute on function public.pick_first_name(text)      to authenticated, service_role;
