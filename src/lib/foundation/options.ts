export const FOUNDATION_CONSENT_VERSION='2026-08-04'
export const FOUNDATION_PRIVACY_NOTICE_VERSION='2026-08-04'
const o=(value:string,label:string)=>({value,label})
export const respondentOptions=[o('parent_guardian','rodzic lub opiekun prawny'),o('young_with_guardian','młody uczestnik wspólnie z rodzicem lub opiekunem')] as const
export const activityOptions=[
  {value:'teenpreneurs',label:'Teenpreneurs, 13–18 lat',minAge:13,maxAge:18},
  {value:'creative_diy',label:'Creative DIY, 10–15 lat',minAge:10,maxAge:15},
  {value:'podcasts_audio_video',label:'Podcasts Creators, 13–18 lat',minAge:13,maxAge:18},
  {value:'art_performance_9_13',label:'Art & Performance, 9–13 lat',minAge:9,maxAge:13},
  {value:'art_performance_13_18',label:'Art & Performance, 13–18 lat',minAge:13,maxAge:18},
  {value:'teenage_talk',label:'Teenage Talk, 13–18 lat',minAge:13,maxAge:18},
] as const
export const municipalityOptions=[o('tarnowo_podgorne','Tarnowo Podgórne'),o('kazmierz','Kaźmierz'),o('rokietnica','Rokietnica'),o('szamotuly','Szamotuły'),o('other','inna gmina')] as const
export const attendanceOptions=[o('definitely_yes','zdecydowanie tak'),o('probably_yes','raczej tak'),o('not_sure','jeszcze nie wiem'),o('part_period','tylko przez część tego okresu'),o('no','nie')] as const
export const dayOptions=[o('monday','poniedziałek'),o('tuesday','wtorek'),o('wednesday','środa'),o('thursday','czwartek'),o('friday','piątek'),o('saturday','sobota')] as const
export const earliestStartOptions=['15:00','16:00','17:00','18:00','19:00'].map(v=>o(v,v)).concat([o('depends_on_day','zależy od dnia')])
export const projectLocationOptions=municipalityOptions.slice(0,4)
export const travelFlexibilityOptions=[o('yes','tak'),o('selected_only','tak, ale tylko do wybranych lokalizacji'),o('no','nie'),o('not_sure','jeszcze nie wiem')] as const
export const transportBarrierOptions=[o('no','nie'),o('probably_not','raczej nie'),o('depends_on_location','tak, zależy od lokalizacji'),o('needs_nearby','tak, potrzebujemy zajęć blisko miejsca zamieszkania'),o('not_sure','trudno powiedzieć')] as const
export const englishComfortOptions=[o('beginner','dopiero zaczyna naukę'),o('single_words','rozumie pojedyncze słowa i proste polecenia'),o('understands_afraid_to_speak','rozumie prostą rozmowę, ale obawia się mówić'),o('everyday_communication','potrafi porozumiewać się w codziennych sytuacjach'),o('fluent','swobodnie komunikuje się po angielsku')] as const
export const motivationOptions=[o('new_people','poznanie nowych osób'),o('peer_conversations','swobodne rozmowy z rówieśnikami'),o('speaking_confidence','większa pewność siebie podczas zabierania głosu'),o('express_opinion','możliwość wyrażania własnego zdania'),o('interests','rozwijanie zainteresowań'),o('own_projects','możliwość tworzenia własnych projektów'),o('english_practice','używanie języka angielskiego w praktyce'),o('confidence','zdobycie większej pewności siebie'),o('microphone_camera','praca z mikrofonem lub kamerą'),o('public_speaking','wystąpienia publiczne'),o('performance','teatr, muzyka lub występy'),o('teamwork','praca w grupie'),o('free_near_home','bezpłatne zajęcia blisko domu'),o('other','inne')] as const
export const preferredContactOptions=[o('email','e-mail'),o('phone','telefon'),o('sms','SMS'),o('whatsapp','WhatsApp'),o('any','bez znaczenia')] as const
export const activitiesForAge=(age:number)=>activityOptions.filter(x=>age>=x.minAge&&age<=x.maxAge)
export const optionValues=(options:readonly {value:string}[])=>options.map(x=>x.value)
