alter table public.foundation_interest_declarations
  drop constraint foundation_interest_declarations_activities_check1;

alter table public.foundation_interest_declarations
  add constraint foundation_interest_declarations_activities_check1
  check (
    activities <@ array[
      'teenpreneurs',
      'creative_diy',
      'podcasts_audio_video',
      'art_performance_9_13',
      'art_performance_13_18',
      'teenage_talk'
    ]::text[]
  );
