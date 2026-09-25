-- A executer une seule fois dans l'editeur SQL de Supabase (Dashboard > SQL Editor).
-- Vider l'editeur (Ctrl+A, Suppr) avant de coller. Le script est rejouable.
--
-- Bilan de shift : la pause dejeuner n'est pas du temps de travail.
-- Remplace uniquement shift_calculer() (voir supabase_validation_shift.sql).
--
-- Meme regle que l'ecran Presence d'Aureo, portee par pause_types :
--   - compte_presence = false (aujourd'hui : lunch) : ni temps de travail, ni
--     presence. Le dejeuner sort du total "Pauses" et devient un total a part.
--   - taux d'occupation = production / (production + pauses dont
--     compte_occupation = true). Le dejeuner n'y entre pas.
--
-- Absence sur l'horaire : on compare des durees, pas des creneaux.
--   attendu = horaire prevu - dejeuner prevu (Meridien, type_pause 'dejeuner')
--   present = production + pauses sur l'horaire - dejeuner reel (Aureo)
--   absence = attendu - present, jamais negative.
-- Un agent deconnecte pendant son dejeuner n'est donc pas compte absent, et un
-- dejeuner pris plus tot ou plus tard que prevu ne penalise pas. Un dejeuner
-- plus long que prevu, lui, apparait en absence.
--
-- Les shifts deja valides gardent l'instantane pris a leur validation : les
-- devalider puis les revalider pour recalculer.


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
  v_fin_ecoulee timestamptz;
  v_segments jsonb;
  v_pauses_prevues jsonb;
  v_pauses_reelles jsonb;
  v_prod numeric := 0;
  v_pause numeric := 0;
  v_present_prevu numeric := 0;
  v_attendu numeric := 0;
  v_absence numeric := 0;
  v_depassement numeric := 0;
  v_hors_quota int := 0;
  v_dejeuner numeric := 0;
  v_dejeuner_horaire numeric := 0;
  v_dejeuner_prevu numeric := 0;
  v_occupation_impact numeric := 0;
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

  -- Pauses reelles : duree, depassement du maximum du type, pauses au-dela du
  -- nombre autorise par jour, et part non travaillee (dejeuner).
  with pd as (
    select greatest(d.debut, v_jour_debut) as debut,
           least(coalesce(d.fin, v_borne), v_borne) as fin,
           d.fin is null as ouverte,
           t.code, t.nom, t.couleur, t.duree_max_minutes, t.occurrences_max_jour,
           t.compte_presence, t.compte_occupation,
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
           'hors_quota', c.hors_quota,
           'compte_presence', c.compte_presence
         ) order by c.debut), '[]'::jsonb),
         coalesce(sum(c.depassement), 0),
         count(*) filter (where c.hors_quota),
         coalesce(sum(c.secondes) filter (where not c.compte_presence), 0),
         coalesce(sum(c.secondes) filter (where c.compte_occupation), 0),
         coalesce(sum(extract(epoch from (least(c.fin, v_prevu_fin) - greatest(c.debut, v_prevu_debut))))
                    filter (where not c.compte_presence and c.fin > v_prevu_debut and c.debut < v_prevu_fin), 0)
    into v_pauses_reelles, v_depassement, v_hors_quota, v_dejeuner, v_occupation_impact, v_dejeuner_horaire
    from calc c;

  if v_prevu_debut is not null and v_maintenant > v_prevu_debut then
    v_fin_ecoulee := least(v_prevu_fin, v_maintenant);

    select coalesce(sum(extract(epoch from (least(s.fin, v_fin_ecoulee) - greatest(s.debut, v_prevu_debut)))), 0)
      into v_present_prevu
      from jsonb_to_recordset(v_segments) as s(statut text, debut timestamptz, fin timestamptz)
     where s.statut in ('en_prod', 'en_pause')
       and s.fin > v_prevu_debut
       and s.debut < v_fin_ecoulee;

    select coalesce(sum(greatest(extract(epoch from (
             least((p_date + pa.heure_fin) at time zone 'Africa/Abidjan', v_fin_ecoulee)
             - greatest((p_date + pa.heure_debut) at time zone 'Africa/Abidjan', v_prevu_debut))), 0)), 0)
      into v_dejeuner_prevu
      from pauses pa
     where pa.planning_id = v_planning.id
       and pa.type_pause = 'dejeuner';

    v_attendu := greatest(extract(epoch from (v_fin_ecoulee - v_prevu_debut)) - v_dejeuner_prevu, 0);
    v_absence := greatest(v_attendu - greatest(v_present_prevu - v_dejeuner_horaire, 0), 0);
  end if;

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
      'pause_secondes', round(greatest(v_pause - v_dejeuner, 0))::int,
      'dejeuner_secondes', round(v_dejeuner)::int,
      'travail_attendu_secondes', round(v_attendu)::int,
      'absence_secondes', round(v_absence)::int,
      'depassement_secondes', round(v_depassement)::int,
      'pauses_hors_quota', v_hors_quota,
      'taux_occupation', case when v_prod + v_occupation_impact > 0
                              then round(v_prod / (v_prod + v_occupation_impact), 4) end,
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
-- Verification : une ligne attendue, qui doit contenir "dejeuner_secondes".
-- ---------------------------------------------------------------------------
notify pgrst, 'reload schema';

select p.proname, position('dejeuner_secondes' in pg_get_functiondef(p.oid)) > 0 as a_jour
  from pg_proc p
 where p.pronamespace = 'public'::regnamespace
   and p.proname = 'shift_calculer';
