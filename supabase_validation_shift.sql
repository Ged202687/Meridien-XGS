-- A executer une seule fois dans l'editeur SQL de Supabase (Dashboard > SQL Editor).
-- Vider l'editeur (Ctrl+A, Suppr) avant de coller. Le script est rejouable.
--
-- Bilan et validation des shifts (facon "MyShift").
--
-- 1. validations_shift : une ligne par jour valide, avec un instantane JSON du
--    bilan au moment de la validation. Un shift valide est fige : son bilan ne
--    bouge plus, meme si l'historique Aureo est corrige ensuite.
-- 2. shift_droits(agent) : qui peut voir / valider le shift d'un agent.
--      - agent : son coach (coach de son equipe) ou le super admin ;
--      - coach : son superviseur (profils_planning.superviseur_id) ou le super admin ;
--      - personne ne valide son propre shift.
-- 3. shift_calculer(agent, date) : interne. Croise le prevu Meridien (plannings,
--    pauses) et le reel Aureo (statuts_historique, pause_details, pause_types)
--    pour une journee d'Abidjan.
-- 4. shift_resume(agent, date) : ce que l'ecran affiche. Renvoie l'instantane
--    si le shift est valide, le calcul en direct sinon.
-- 5. valider_shift / devalider_shift.
-- 6. Verrou : triggers qui refusent toute modification de plannings / pauses
--    sur un jour valide. A la validation, genere_auto passe a false : c'est deja
--    ce que generer_planning_semaine respecte pour les jours edites a la main,
--    donc le cron n'essaie jamais de reecrire un jour valide.
--
-- Journee : celle d'Abidjan, ecrite en toutes lettres comme dans Aureo (rien ne
-- garantit que le serveur restera en UTC apres la migration vers XGS).


-- ---------------------------------------------------------------------------
-- 1. Table
-- ---------------------------------------------------------------------------
create table if not exists public.validations_shift (
  planning_id uuid primary key references public.plannings(id) on delete cascade,
  agent_id uuid not null references public.profils_planning(id) on delete cascade,
  date date not null,
  valide_par uuid references public.profils_planning(id) on delete set null,
  valide_le timestamptz not null default now(),
  genere_auto_avant boolean not null,
  instantane jsonb not null
);

create index if not exists validations_shift_agent_date on public.validations_shift (agent_id, date);


-- ---------------------------------------------------------------------------
-- 2. Droits
-- ---------------------------------------------------------------------------
create or replace function public.shift_droits(p_agent_id uuid)
returns table(peut_voir boolean, peut_valider boolean)
language plpgsql
stable
security definer
set search_path to 'public'
as $function$
declare
  v_moi uuid := auth.uid();
  v_role_moi text;
  v_role_cible text;
  v_equipe_cible uuid;
  v_sup_cible uuid;
  v_coach_de_cible boolean;
  v_sup_de_cible boolean;
begin
  if v_moi is null then
    peut_voir := false;
    peut_valider := false;
    return next;
    return;
  end if;

  select pp.role::text into v_role_moi from profils_planning pp where pp.id = v_moi;
  select pp.role::text, pp.equipe_id, pp.superviseur_id
    into v_role_cible, v_equipe_cible, v_sup_cible
    from profils_planning pp where pp.id = p_agent_id;

  v_coach_de_cible := exists (
    select 1 from equipes e where e.id = v_equipe_cible and e.coach_id = v_moi
  );

  v_sup_de_cible := (v_role_cible = 'coach' and v_sup_cible = v_moi)
    or exists (
      select 1 from equipes e join profils_planning c on c.id = e.coach_id
      where e.id = v_equipe_cible and c.superviseur_id = v_moi
    );

  peut_voir := v_moi = p_agent_id
    or v_role_moi = 'super_admin'
    or v_coach_de_cible
    or v_sup_de_cible;

  peut_valider := v_moi <> p_agent_id and v_role_cible is not null and (
    v_role_moi = 'super_admin'
    or (v_role_cible = 'agent' and v_role_moi = 'coach' and v_coach_de_cible)
    or (v_role_cible = 'coach' and v_role_moi = 'superviseur' and v_sup_cible = v_moi)
  );

  return next;
end;
$function$;

revoke execute on function public.shift_droits(uuid) from public, anon;
grant execute on function public.shift_droits(uuid) to authenticated;


-- ---------------------------------------------------------------------------
-- 3. Calcul du bilan (interne)
-- ---------------------------------------------------------------------------
create or replace function public.shift_calculer(p_agent_id uuid, p_date date)
returns jsonb
language plpgsql
stable
set search_path to 'public'
as $function$
declare
  v_planning record;
  v_jour_debut timestamptz := p_date::timestamp at time zone 'Africa/Abidjan';
  v_jour_fin timestamptz := (p_date + 1)::timestamp at time zone 'Africa/Abidjan';
  v_maintenant timestamptz := now();
  v_borne timestamptz;
  v_prevu_debut timestamptz;
  v_prevu_fin timestamptz;
  v_segments jsonb;
  v_pauses_prevues jsonb;
  v_pauses_reelles jsonb;
  v_prod numeric := 0;
  v_pause numeric := 0;
  v_present_prevu numeric := 0;
  v_absence numeric := 0;
  v_depassement numeric := 0;
  v_hors_quota int := 0;
  v_arrivee timestamptz;
  v_depart timestamptz;
begin
  select p.id, p.statut::text as statut, p.heure_debut, p.heure_fin
    into v_planning
    from plannings p
   where p.agent_id = p_agent_id and p.date = p_date;
  if not found then
    return null;
  end if;

  v_borne := least(v_jour_fin, v_maintenant);

  if v_planning.heure_debut is not null and v_planning.heure_fin is not null then
    v_prevu_debut := (p_date + v_planning.heure_debut) at time zone 'Africa/Abidjan';
    v_prevu_fin := (p_date + v_planning.heure_fin) at time zone 'Africa/Abidjan';
  end if;

  -- Statuts Aureo de la journee, coupes a minuit et a maintenant.
  select coalesce(jsonb_agg(jsonb_build_object('statut', s.statut, 'debut', s.debut, 'fin', s.fin) order by s.debut), '[]'::jsonb)
    into v_segments
    from (
      select sh.statut,
             greatest(sh.debut, v_jour_debut) as debut,
             least(coalesce(sh.fin, v_borne), v_borne) as fin
        from statuts_historique sh
       where sh.agent_id = p_agent_id
         and sh.debut < v_borne
         and coalesce(sh.fin, v_borne) > v_jour_debut
    ) s
   where s.fin > s.debut;

  select coalesce(sum(extract(epoch from (s.fin - s.debut))) filter (where s.statut = 'en_prod'), 0),
         coalesce(sum(extract(epoch from (s.fin - s.debut))) filter (where s.statut = 'en_pause'), 0),
         min(s.debut) filter (where s.statut in ('en_prod', 'en_pause')),
         max(s.fin) filter (where s.statut in ('en_prod', 'en_pause'))
    into v_prod, v_pause, v_arrivee, v_depart
    from jsonb_to_recordset(v_segments) as s(statut text, debut timestamptz, fin timestamptz);

  -- Absence : temps prevu (ecoule) sans etre ni en production ni en pause.
  if v_prevu_debut is not null and v_maintenant > v_prevu_debut then
    select coalesce(sum(extract(epoch from (least(s.fin, v_prevu_fin) - greatest(s.debut, v_prevu_debut)))), 0)
      into v_present_prevu
      from jsonb_to_recordset(v_segments) as s(statut text, debut timestamptz, fin timestamptz)
     where s.statut in ('en_prod', 'en_pause')
       and s.fin > v_prevu_debut
       and s.debut < v_prevu_fin;
    v_absence := greatest(extract(epoch from (least(v_prevu_fin, v_maintenant) - v_prevu_debut)) - v_present_prevu, 0);
  end if;

  -- Pauses reelles : duree, depassement du maximum du type, pauses au-dela du
  -- nombre autorise par jour.
  with pd as (
    select greatest(d.debut, v_jour_debut) as debut,
           least(coalesce(d.fin, v_borne), v_borne) as fin,
           d.fin is null as ouverte,
           t.code, t.nom, t.couleur, t.duree_max_minutes, t.occurrences_max_jour,
           row_number() over (partition by d.pause_type_id order by d.debut) as rang
      from pause_details d
      join pause_types t on t.id = d.pause_type_id
     where d.agent_id = p_agent_id
       and d.debut < v_borne
       and coalesce(d.fin, v_borne) > v_jour_debut
  ),
  calc as (
    select pd.*,
           extract(epoch from (pd.fin - pd.debut)) as secondes,
           case when pd.duree_max_minutes is null then 0
                else greatest(extract(epoch from (pd.fin - pd.debut)) - pd.duree_max_minutes * 60, 0)
           end as depassement,
           pd.occurrences_max_jour is not null and pd.rang > pd.occurrences_max_jour as hors_quota
      from pd
     where pd.fin > pd.debut
  )
  select coalesce(jsonb_agg(jsonb_build_object(
           'type', c.code,
           'nom', c.nom,
           'couleur', c.couleur,
           'debut', c.debut,
           'fin', c.fin,
           'ouverte', c.ouverte,
           'secondes', round(c.secondes)::int,
           'duree_max_secondes', c.duree_max_minutes * 60,
           'depassement_secondes', round(c.depassement)::int,
           'hors_quota', c.hors_quota
         ) order by c.debut), '[]'::jsonb),
         coalesce(sum(c.depassement), 0),
         count(*) filter (where c.hors_quota)
    into v_pauses_reelles, v_depassement, v_hors_quota
    from calc c;

  select coalesce(jsonb_agg(jsonb_build_object(
           'type', pa.type_pause,
           'debut', (p_date + pa.heure_debut) at time zone 'Africa/Abidjan',
           'fin', (p_date + pa.heure_fin) at time zone 'Africa/Abidjan'
         ) order by pa.heure_debut), '[]'::jsonb)
    into v_pauses_prevues
    from pauses pa
   where pa.planning_id = v_planning.id;

  return jsonb_build_object(
    'planning', jsonb_build_object(
      'id', v_planning.id,
      'date', p_date,
      'statut', v_planning.statut,
      'prevu_debut', v_prevu_debut,
      'prevu_fin', v_prevu_fin
    ),
    'termine', coalesce(v_prevu_fin <= v_maintenant, v_jour_fin <= v_maintenant),
    'segments', v_segments,
    'pauses_prevues', v_pauses_prevues,
    'pauses_reelles', v_pauses_reelles,
    'totaux', jsonb_build_object(
      'prod_secondes', round(v_prod)::int,
      'pause_secondes', round(v_pause)::int,
      'absence_secondes', round(v_absence)::int,
      'depassement_secondes', round(v_depassement)::int,
      'pauses_hors_quota', v_hors_quota,
      'arrivee', v_arrivee,
      'depart', v_depart,
      'retard_secondes', case when v_arrivee > v_prevu_debut
                              then round(extract(epoch from (v_arrivee - v_prevu_debut)))::int else 0 end,
      'depart_anticipe_secondes', case when v_depart < v_prevu_fin and v_prevu_fin <= v_maintenant
                                       then round(extract(epoch from (v_prevu_fin - v_depart)))::int else 0 end
    )
  );
end;
$function$;

revoke execute on function public.shift_calculer(uuid, date) from public, anon, authenticated;


-- ---------------------------------------------------------------------------
-- 4. Lecture par l'ecran
-- ---------------------------------------------------------------------------
create or replace function public.shift_resume(p_agent_id uuid, p_date date)
returns jsonb
language plpgsql
stable
security definer
set search_path to 'public'
as $function$
declare
  v_droits record;
  v_planning_id uuid;
  v_validation record;
  v_resultat jsonb;
begin
  select * into v_droits from shift_droits(p_agent_id);
  if not coalesce(v_droits.peut_voir, false) then
    raise exception 'Acces refuse a ce shift.';
  end if;

  select p.id into v_planning_id from plannings p where p.agent_id = p_agent_id and p.date = p_date;
  if v_planning_id is null then
    return null;
  end if;

  select v.valide_par, v.valide_le, v.instantane, pp.nom_complet as valide_par_nom
    into v_validation
    from validations_shift v
    left join profils_planning pp on pp.id = v.valide_par
   where v.planning_id = v_planning_id;

  if found then
    return v_validation.instantane || jsonb_build_object(
      'validation', jsonb_build_object(
        'valide_par', v_validation.valide_par,
        'valide_par_nom', v_validation.valide_par_nom,
        'valide_le', v_validation.valide_le
      ),
      'peut_valider', false,
      'peut_devalider', v_droits.peut_valider
    );
  end if;

  v_resultat := shift_calculer(p_agent_id, p_date);
  return v_resultat || jsonb_build_object(
    'validation', null,
    'peut_valider', v_droits.peut_valider
                    and (v_resultat->>'termine')::boolean
                    and v_resultat->'planning'->>'statut' in ('travail', 'formation'),
    'peut_devalider', false
  );
end;
$function$;

revoke execute on function public.shift_resume(uuid, date) from public, anon;
grant execute on function public.shift_resume(uuid, date) to authenticated;


-- ---------------------------------------------------------------------------
-- 5. Validation / devalidation
-- ---------------------------------------------------------------------------
create or replace function public.valider_shift(p_planning_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_planning record;
  v_droits record;
  v_instantane jsonb;
begin
  select p.id, p.agent_id, p.date, p.statut::text as statut, p.genere_auto
    into v_planning
    from plannings p
   where p.id = p_planning_id
   for update;
  if not found then
    raise exception 'Shift introuvable.';
  end if;

  if v_planning.statut not in ('travail', 'formation') then
    raise exception 'Seuls les jours travailles ou de formation se valident.';
  end if;

  if exists (select 1 from validations_shift v where v.planning_id = p_planning_id) then
    raise exception 'Ce shift est deja valide.';
  end if;

  select * into v_droits from shift_droits(v_planning.agent_id);
  if not coalesce(v_droits.peut_valider, false) then
    raise exception 'Vous ne pouvez pas valider ce shift.';
  end if;

  v_instantane := shift_calculer(v_planning.agent_id, v_planning.date);
  if not coalesce((v_instantane->>'termine')::boolean, false) then
    raise exception 'Le shift n''est pas encore termine.';
  end if;

  -- Avant l'insertion : une fois la validation posee, le trigger de verrou
  -- refuserait cette mise a jour.
  update plannings set genere_auto = false where id = p_planning_id and genere_auto;

  insert into validations_shift (planning_id, agent_id, date, valide_par, genere_auto_avant, instantane)
  values (p_planning_id, v_planning.agent_id, v_planning.date, auth.uid(), v_planning.genere_auto, v_instantane);

  return shift_resume(v_planning.agent_id, v_planning.date);
end;
$function$;

revoke execute on function public.valider_shift(uuid) from public, anon;
grant execute on function public.valider_shift(uuid) to authenticated;


create or replace function public.devalider_shift(p_planning_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_validation record;
  v_droits record;
begin
  select v.planning_id, v.agent_id, v.date, v.genere_auto_avant
    into v_validation
    from validations_shift v
   where v.planning_id = p_planning_id
   for update;
  if not found then
    raise exception 'Ce shift n''est pas valide.';
  end if;

  select * into v_droits from shift_droits(v_validation.agent_id);
  if not coalesce(v_droits.peut_valider, false) then
    raise exception 'Vous ne pouvez pas devalider ce shift.';
  end if;

  -- Dans cet ordre : le verrou saute d'abord, puis genere_auto retrouve sa valeur.
  delete from validations_shift where planning_id = p_planning_id;
  update plannings set genere_auto = v_validation.genere_auto_avant
   where id = p_planning_id and genere_auto <> v_validation.genere_auto_avant;

  return shift_resume(v_validation.agent_id, v_validation.date);
end;
$function$;

revoke execute on function public.devalider_shift(uuid) from public, anon;
grant execute on function public.devalider_shift(uuid) to authenticated;


-- ---------------------------------------------------------------------------
-- 6. Verrou
-- ---------------------------------------------------------------------------
-- security definer : le controle doit voir toutes les validations, quelle que
-- soit la RLS de celui qui ecrit.
create or replace function public.verrou_shift_plannings()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if exists (select 1 from validations_shift v where v.planning_id = old.id) then
    raise exception 'Ce jour est un shift valide, donc verrouille. Devalidez-le avant de le modifier (pour un agent qui part, desactivez-le plutot que de le supprimer).';
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$function$;

revoke execute on function public.verrou_shift_plannings() from public, anon, authenticated;

drop trigger if exists plannings_verrou_shift on public.plannings;
create trigger plannings_verrou_shift
  before update or delete on public.plannings
  for each row execute function public.verrou_shift_plannings();


create or replace function public.verrou_shift_pauses()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if (tg_op in ('UPDATE', 'DELETE') and exists (select 1 from validations_shift v where v.planning_id = old.planning_id))
     or (tg_op in ('INSERT', 'UPDATE') and exists (select 1 from validations_shift v where v.planning_id = new.planning_id)) then
    raise exception 'Ce jour est un shift valide, donc verrouille. Devalidez-le avant de modifier ses pauses.';
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$function$;

revoke execute on function public.verrou_shift_pauses() from public, anon, authenticated;

drop trigger if exists pauses_verrou_shift on public.pauses;
create trigger pauses_verrou_shift
  before insert or update or delete on public.pauses
  for each row execute function public.verrou_shift_pauses();


-- ---------------------------------------------------------------------------
-- RLS : lecture par ceux qui peuvent voir le shift. Aucune policy d'ecriture,
-- on n'ecrit que par valider_shift() / devalider_shift().
-- ---------------------------------------------------------------------------
alter table public.validations_shift enable row level security;

drop policy if exists validations_shift_lecture on public.validations_shift;
create policy validations_shift_lecture on public.validations_shift
  for select to authenticated
  using ((select d.peut_voir from public.shift_droits(agent_id) d));


-- ---------------------------------------------------------------------------
-- Verification : l'editeur n'affiche que le resultat de la derniere requete.
-- 9 lignes attendues : 7 fonctions et 2 triggers.
-- ---------------------------------------------------------------------------
notify pgrst, 'reload schema';

select 'fonction' as type, p.proname as nom
  from pg_proc p
 where p.pronamespace = 'public'::regnamespace
   and p.proname in ('shift_droits', 'shift_calculer', 'shift_resume', 'valider_shift',
                     'devalider_shift', 'verrou_shift_plannings', 'verrou_shift_pauses')
union all
select 'trigger', t.tgname
  from pg_trigger t
 where t.tgname in ('plannings_verrou_shift', 'pauses_verrou_shift')
order by 1, 2;
