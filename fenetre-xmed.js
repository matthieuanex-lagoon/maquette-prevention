/* Modélisation de la fenêtre XMed « Prévention » : onglets existants + Score 2 + Prévention MT (CPAM).
   Toutes les données patient sont fictives. Les règles appliquent les fiches CPAM, de façon simplifiée (démonstration). */
(function(){
const REF = new Date(2026, 9, 14);              // « aujourd'hui » de la démo : 14/10/2026
const D = s => { const [y,m,d] = s.split('-').map(Number); return new Date(y, m-1, d); };
const fmt = d => d.toLocaleDateString('fr-FR');
const addM = (d, n) => new Date(d.getFullYear(), d.getMonth()+n, d.getDate());
const monthsBetween = (a, b) => (b.getFullYear()-a.getFullYear())*12 + (b.getMonth()-a.getMonth()) - (b.getDate() < a.getDate() ? 1 : 0);
const latest = arr => (arr||[]).map(D).sort((a,b)=>b-a)[0] || null;
const within = (arr, n) => { const l = latest(arr); return l && monthsBetween(l, REF) < n ? l : null; };

/* ---- Patients fictifs ---- */
const PROFILES = {
 A:{label:"Enfant de 11 ans — le dossier de la capture", sexe:'F', dob:'1900', _dob:'2015-03-12', ald:[], meds:{}, ante:[], refus:{HPV:'2025-10-22', MEN:'2025-10-22'},
    ev:{}, s2:{tabac:false, pas:null, chol:null, hdl:null, statine:false}},
 B:{label:"Femme de 58 ans — diabète de type 2 (ALD 8)", sexe:'F', _dob:'1968-05-20', ald:[8], meds:{A10:true}, ante:[], refus:{},
    ev:{creat:['2026-02-10'], hba1c:['2026-06-10'], dcc:['2025-02-14'], hpvhr:['2023-09-05'], mammo:['2024-05-20']},
    s2:{tabac:false, pas:138, chol:5.4, hdl:1.4, statine:false, date:'2026-04-18'}},
 C:{label:"Homme de 68 ans — sans ALD", sexe:'M', _dob:'1958-02-02', ald:[], meds:{}, ante:[], refus:{},
    ev:{dcc:['2022-11-03'], flu:['2026-10-02']},
    s2:{tabac:true, pas:142, chol:5.8, hdl:1.1, statine:false, date:'2026-04-18'}}
};
Object.values(PROFILES).forEach(p => { p.dobD = D(p._dob); p.ageM = monthsBetween(p.dobD, REF); p.age = Math.floor(p.ageM/12); });

/* ---- Règles (population → exclusion → réalisation) ---- */
const hasAny = (p, list) => list.some(x => p.ald.includes(x));
const nc = why => ({statut:'nc', precision:why});
const ex = why => ({statut:'ex', precision:why});
const ok = (last, ech, prec) => ({statut:'ok', last, ech, precision:prec||''});
const todo = (prec, ech, last) => ({statut:'todo', precision:prec, ech:ech||'Dès maintenant', last:last||null});
const campaignStart = () => new Date(REF.getMonth() >= 3 ? REF.getFullYear() : REF.getFullYear()-1, 3, 1);
const ALD_GRIP = [1,2,3,5,6,7,8,9,10,12,13,14,15,16,18,19,20,21,22,24,25,27,28,30];

const RULES = {
 MRC(p){
  if(!(p.age>=18 && (hasAny(p,[1,3,5,8,12,13,21,22,24,27]) || p.meds.A10))) return nc("Aucune ALD cardiovasculaire ou de système, ni antidiabétique");
  if(p.ald.includes(19)) return ex("MRC connue (ALD 19)");
  const k = {creat:'créatinine sanguine', alb:'albumine urinaire', creatU:'créatinine urinaire'};
  const miss = Object.keys(k).filter(x => !within(p.ev[x],12));
  if(!miss.length){ const l = new Date(Math.min(...Object.keys(k).map(x=>latest(p.ev[x])))); return ok(l, addM(l,12)); }
  return todo("Manque : " + miss.map(x=>k[x]).join(', ') + " (12 mois)");
 },
 DIA(p){
  if(!(p.age>=45 && hasAny(p,[1,3,5,12,13,19]))) return nc(p.age<45 ? "Moins de 45 ans" : "Aucune ALD cardiovasculaire listée");
  if(p.ald.includes(8) || p.meds.A10) return ex("Diabète connu");
  const l = within(p.ev.gly, 36); return l ? ok(l, addM(l,36)) : todo("Glycémie à jeun absente depuis 36 mois");
 },
 DOC(p){
  if(!(p.age>=50 && p.age<75)) return nc("Hors tranche 50–74 ans");
  if(p.ante.includes('colorectal')) return ex("Antécédent colorectal / acte récent");
  const l = within(p.ev.dcc, 24); return l ? ok(l, addM(l,24)) : todo("Test immunologique absent depuis 24 mois", null, latest(p.ev.dcc));
 },
 DOU(p){
  if(p.sexe!=='F') return nc("Indicateur réservé aux femmes");
  if(!(p.age>=25 && p.age<66)) return nc("Hors tranche 25–65 ans");
  if(p.ante.includes('hysterectomie')) return ex("Hystérectomie totale");
  if(p.age>=30){ const l = within(p.ev.hpvhr, 60); return l ? ok(l, addM(l,60), "Test HPV-HR") : todo("Test HPV-HR absent depuis 5 ans"); }
  const l = within(p.ev.cytol, 12); return l ? ok(l, addM(l,12), "Cytologie") : todo("Cytologie absente depuis 1 an");
 },
 DOS(p){
  if(p.sexe!=='F') return nc("Indicateur réservé aux femmes");
  if(!(p.age>=50 && p.age<75)) return nc("Hors tranche 50–74 ans");
  const l = within(p.ev.mammo, 24); return l ? ok(l, addM(l,24)) : todo("Mammographie absente depuis 24 mois", null, latest(p.ev.mammo));
 },
 HBA(p){
  if(!(p.ald.includes(8) || p.meds.A10)) return nc("Pas de diabète (ALD 8 ou antidiabétiques)");
  const l = within(p.ev.hba1c, 6); return l ? ok(l, addM(l,6)) : todo("HbA1c / fructosamine absente depuis 6 mois");
 },
 GRI(p){
  if(!(p.age>=65 || (p.ageM>=6 && (hasAny(p,ALD_GRIP) || p.meds.R03 || p.meds.L04)))) return nc("Moins de 65 ans, sans facteur de risque");
  const s = campaignStart(), l = latest(p.ev.flu);
  return l && l >= s ? ok(l, new Date(s.getFullYear()+1,3,1), "Campagne en cours") : todo("Aucune dose depuis le " + fmt(s), "Campagne en cours");
 },
 COV(p){
  if(!(p.age>=65 || (p.ageM>=6 && (hasAny(p,ALD_GRIP.concat([23])) || p.meds.R03 || p.meds.L04)))) return nc("Moins de 65 ans, sans facteur de risque");
  const s = campaignStart(), l = latest(p.ev.covid);
  return l && l >= s ? ok(l, new Date(s.getFullYear()+1,3,1), "Campagne en cours") : todo("Aucune dose depuis le " + fmt(s), "Campagne en cours");
 },
 HPV(p){
  if(!(p.age>=11 && p.age<16)) return nc("Hors tranche 11–15 ans");
  const lo = new Date(p.dobD.getFullYear()+10, p.dobD.getMonth(), 1), hi = new Date(p.dobD.getFullYear()+15, p.dobD.getMonth()+1, 0);
  const doses = (p.ev.hpv||[]).map(D).filter(d => d>=lo && d<=hi).sort((a,b)=>a-b);
  const lim = "Avant le " + fmt(hi);
  if(doses.length>=2 && monthsBetween(doses[0], doses[doses.length-1])>=3) return ok(doses[doses.length-1], "—", "2 doses ≥ 3 mois");
  const r = p.refus.HPV ? " — refus enregistré le " + fmt(D(p.refus.HPV)) : "";
  return todo((doses.length ? "1 dose sur 2" : "Aucune dose sur 2") + r, lim, doses[0]||null);
 },
 PNE(p){
  const L = [2,3,5,6,7,8,9,14,19,21,22,24,25,27,28,30];
  if(!(p.age>=65 || (p.age>=18 && (hasAny(p,L) || p.meds.R03 || p.meds.L04)))) return nc("Moins de 65 ans, sans facteur de risque");
  const l = latest(p.ev.vpc); return l && l >= D('2024-03-01') ? ok(l, "Dose unique — terminé") : todo("Aucune dose VPC20/VPC21 depuis mars 2024", "Dès maintenant");
 },
 /* provisoires (ameli.fr) */
 M9(p){ return (p.ageM>=8 && p.ageM<=21) ? todo("Examen à réaliser entre 8 et 10 mois", "Avant 10 mois + 30 j") : nc("Enfants de 8 à 21 mois"); },
 M24(p){ return (p.ageM>=22 && p.ageM<=37) ? todo("Examen à réaliser entre 22 et 26 mois") : nc("Enfants de 22 à 37 mois"); },
 ROR(p){ return (p.ageM>=16 && p.ageM<=35) ? todo("2 doses avant 24 mois") : nc("Enfants de 16 à 35 mois"); },
 MEN(p){ return (p.ageM>=6 && p.ageM<=23) ? todo("1 dose ACWY avant 12 mois") : nc("Enfants de 6 à 23 mois"); },
 DENT(p){
  if(!(p.age>=3 && p.age<=24)) return nc("Personnes de 3 à 24 ans");
  const l = within(p.ev.dent, 12); return l ? ok(l, addM(l,12)) : todo("Aucun suivi bucco-dentaire enregistré depuis 1 an");
 }
};
const ORDER_XW = ['MRC','DIA','DOC','DOU','DOS','HBA','GRI','COV','PNE','HPV','M9','M24','DENT','ROR','MEN'];

/* ---- Gabarit de la fenêtre ---- */
const root = document.getElementById('xwRoot');
const TABS = [['vacc','Vaccins',0],['exam','Examens et consultations',0],['chrono','Chronologie',0],['s2','Score 2',1],['mt','Prévention MT (CPAM)',1]];
root.innerHTML =
 '<p class="xw-note">Reproduction de la fenêtre « Prévention » de XMed à partir de vos captures : les trois onglets existants sont conservés tels quels ; les deux onglets <strong style="color:#00769e">Score 2</strong> et <strong style="color:#00769e">Prévention MT (CPAM)</strong> sont ajoutés (liseré bleu). Données du patient fictives.</p>'+
 '<div class="xw-bar"><label>Patient de démonstration : <select id="xwPat"></select></label><span class="mut" id="xwPatInfo"></span></div>'+
 '<div class="xw-win"><div class="xw-title"><span class="ico"></span><span>Prévention</span><span class="ctl">–&nbsp;☐&nbsp;✕</span></div>'+
 '<div class="xw-tabs" id="xwTabs">'+TABS.map(t=>'<button data-t="'+t[0]+'" class="'+(t[2]?'new':'')+'">'+t[1]+'</button>').join('')+'</div>'+
 '<div id="xwPanes"></div></div>'+
 '<h3 class="s" style="margin-top:26px">Cadre « Prévention » du dossier patient</h3>'+
 '<p class="xw-note">Le cadre latéral de la capture (interrupteur « Chronologie ») pourrait proposer les deux nouvelles vues sous forme résumée.</p>'+
 '<div class="xw-dock"><div class="hd"><span>Prévention</span><span>▢</span></div><div class="xw-seg" id="xwSeg"><button data-d="chrono" class="act">Chronologie</button><button data-d="mt">MT (CPAM)</button><button data-d="s2">Score 2</button></div><div class="bd" id="xwDockBody"></div></div>';

const sel = document.getElementById('xwPat');
Object.keys(PROFILES).forEach(k => sel.insertAdjacentHTML('beforeend','<option value="'+k+'">'+PROFILES[k].label+'</option>'));
let cur = 'A', tab = 'vacc';

/* ---- Vaccins (écran actuel, reconstitué) ---- */
const VROWS = [
 ['28/05/2016','PRIORIX PDR+SOLV SER 0,5ML 1','Rougeole-Oreillons-Rubéole','','','Matthieu ANEX','3400935…'],
 ['28/12/2020','REPEVAX SER 0,5ML 1 [Supprimé]','DTCP','','','Matthieu ANEX',''],
 ['22/10/2025','GARDASIL 9 SER+2 AIG 0,5ML 1','papillomavirus (Humain types 6…','1','','Matthieu ANEX','3400930…'],
 ['22/10/2025','NIMENRIX PDR+SOL SER IM 1','méningocoque A + C + Y + W-…','1','','Matthieu ANEX','3400922…'],
 ['14/01/2026','REPEVAX SER+1AIG 0,5ML 1','DTCP','','Y3K12…','Matthieu ANEX','3400936…']
];
function paneVacc(){
  const side = ['Ajouter','Lire QRCode','Supprimer','Ok','Appliquer*','Rappel','Aperçu','Imprimer le carnet de vaccinations','Envoyer la vaccination sur le DMP*','Aide','Annuler*','Visualisation du calendrier vaccinal','Fermer'];
  return '<div class="xw-body"><div class="xw-main"><table class="xw-grid"><tr><th>Alerte</th><th>Date ▲</th><th>DMP</th><th>Nom commercial</th><th>Valence</th><th>Rappel</th><th>Refus</th><th>Proposé</th><th>Notes</th><th>Lot</th><th>Acteur</th><th>Code CIP</th></tr>'+
   VROWS.map((r,i)=>'<tr class="click'+(i===0?' sel':'')+'" data-v="'+i+'"><td>💡</td><td>'+r[0]+'</td><td>☐</td><td>'+r[1]+'</td><td>'+r[2]+'</td><td></td><td>'+(r[3]?'☑':'☐')+'</td><td>0</td><td></td><td>'+r[4]+'</td><td>'+r[5]+'</td><td>'+r[6]+'</td></tr>').join('')+
   '</table><div class="xw-form" id="xwVForm"></div></div><div class="xw-side">'+
   side.map(s=>'<div class="xw-btn'+(s.endsWith('*')?' dis':'')+(s.length>14?' tall':'')+'">'+s.replace('*','')+'</div>').join('')+'</div></div>';
}
function vForm(i){
  const r = VROWS[i];
  document.getElementById('xwVForm').innerHTML =
   '<div>Date</div><div><span class="fld">'+r[0]+'</span></div><div>Nom commercial</div><div><span class="fld">'+r[1]+'</span></div>'+
   '<div>Valence</div><div><span class="fld">'+r[2]+'</span></div><div>Refus</div><div>'+(r[3]?'☑':'☐')+'</div><div>Acteur</div><div><span class="fld">'+r[5]+'</span></div><div>Notes</div><div><span class="fld" style="display:block;min-height:40px"></span></div>';
}

/* ---- Examens (capture non fournie) ---- */
function paneExam(){
  return '<div class="xw-body"><div class="xw-main xw-pad"><p><strong>Examens et consultations</strong> — écran actuel inchangé.</p><p class="mut">La capture de cet onglet n\'a pas été fournie ; il n\'est donc pas reconstitué ici. Il reste tel qu\'aujourd\'hui (étape 1 : colonnes Proposé / Refusé).</p></div><div class="xw-side"><div class="xw-btn">Ajouter</div><div class="xw-btn">Fermer</div></div></div>';
}

/* ---- Chronologie (SVG) ---- */
function chronoSVG(compact){
  const W = compact ? 310 : 900, H = compact ? 170 : 420, L = compact ? 90 : 220, R = 20, T = 14, B = 34;
  const t0 = new Date(2016,0,1), t1 = new Date(2027,0,1);
  const X = d => L + (d - t0)/(t1 - t0) * (W - L - R);
  const rows = [['Vaccin Rougeole-Oreillons-Rubéole'],['Vaccin papillomavirus (types 6,11,16,18…)'],['Vaccin méningocoque A + C + Y + W-135'],['Vaccin DTCP']];
  const rh = (H - T - B)/rows.length;
  let s = '<svg viewBox="0 0 '+W+' '+H+'" width="100%" role="img" aria-label="Chronologie">';
  for(let y=2016;y<=2027;y++){ const x = X(new Date(y,0,1)); s += '<line x1="'+x+'" x2="'+x+'" y1="'+T+'" y2="'+(H-B)+'" stroke="#d6dde2"/>'; if(!compact || y%2===0) s += '<text x="'+x+'" y="'+(H-B+14)+'" font-size="'+(compact?8:10)+'" text-anchor="middle" fill="#444">01/01/'+(compact?String(y).slice(2):y)+'</text>'; }
  rows.forEach((r,i)=>{ const y = T + rh*(i+.5); s += '<text x="'+(L-8)+'" y="'+(y+4)+'" font-size="'+(compact?9:11)+'" text-anchor="end" fill="#222">'+(compact? r[0].replace(/\(.*\)/,'').slice(0,26) : r[0])+'</text>'; });
  const y = i => T + rh*(i+.5);
  const dot = (d,i) => '<circle cx="'+X(D(d))+'" cy="'+y(i)+'" r="'+(compact?4:5)+'" fill="#2e7d5b"/>';
  const cross = (d,i) => '<text x="'+X(D(d))+'" y="'+(y(i)+5)+'" font-size="15" text-anchor="middle" fill="#f39c12" font-weight="700">✖</text>';
  s += dot('2016-05-28',0) + cross('2025-10-22',1) + cross('2025-10-22',2);
  s += '<line x1="'+X(D('2020-12-28'))+'" x2="'+X(D('2026-01-14'))+'" y1="'+y(3)+'" y2="'+y(3)+'" stroke="#bbb" stroke-width="'+(compact?6:9)+'"/>'+dot('2020-12-28',3)+dot('2026-01-14',3);
  const xt = X(REF);
  s += '<line x1="'+xt+'" x2="'+xt+'" y1="'+T+'" y2="'+(H-B)+'" stroke="#2f6f9f" stroke-width="1.5"/>';
  return s + '</svg>';
}
function paneChrono(){
  return '<div class="xw-top"><div class="xw-btn">Imprimer la chronologie</div><div class="xw-btn">Fermer</div></div><div class="xw-main xw-pad" style="margin:0 6px 6px;position:relative">'+chronoSVG(false)+
   '<div class="legendbox">▲ À venir<br><span style="color:#2e7d5b">●</span> Fait<br><span style="color:#d93025">■</span> En retard<br><span style="color:#f39c12">✖</span> Refusé<br>│ Aujourd\'hui</div></div>';
}

/* ---- Score 2 ---- */
function paneS2(){
  const p = PROFILES[cur], s = p.s2, dt = s.date ? fmt(D(s.date)) : '—';
  const checks = [];
  checks.push([p.age>=40 && p.age<=89, "Âge entre 40 et 89 ans", p.age + " ans" + (p.age>=70 ? " (SCORE2-OP)" : "")]);
  checks.push([!hasAny(p,[1,3,13]), "Pas de maladie cardiovasculaire (prévention primaire)", hasAny(p,[1,3,13]) ? "ALD cardiovasculaire" : "aucune ALD CV"]);
  checks.push([!(s.pas>=180), "Pas d'hypertension sévère (≥ 180/110)", s.pas ? "PAS " + s.pas : "PAS non renseignée"]);
  checks.push([!s.statine, "Pas de traitement hypolipémiant", s.statine ? "traitement en cours" : "aucun"]);
  const diab = p.ald.includes(8) || p.meds.A10;
  const missing = s.pas==null || s.chol==null || s.hdl==null;
  let verdict;
  if(p.age<40 || p.age>89) verdict = '<span class="st st-nc">Non applicable</span><p>Score défini de 40 à 89 ans.</p>';
  else if(diab) verdict = '<span class="st st-ex">SCORE2-Diabetes</span><p>Diabète au dossier : la page de référence renvoie au SCORE2-Diabetes (calcul distinct).</p>';
  else if(checks.some(c=>!c[0])) verdict = '<span class="st st-ex">Non applicable</span><p>Un critère d\'exclusion est présent.</p>';
  else if(missing) verdict = '<span class="st st-todo">Variable manquante</span>';
  else verdict = '<span class="st st-todo">Prêt à calculer</span><p>Les six variables sont au dossier. Le résultat s\'affichera ici dès que l\'algorithme sera intégré.</p>';
  const row = (lab, val, unit, src) => '<tr><td>'+lab+'</td><td>'+(val===null||val===undefined?'<em style="color:#b3261e">manquant</em>':val)+' '+unit+'</td><td>'+(val===null||val===undefined?'—':dt)+'</td><td>'+src+'</td></tr>';
  return '<div class="xw-top"><div class="xw-btn">Imprimer</div><div class="xw-btn">Fermer</div></div><div class="xw-main" style="margin:0 6px 6px"><div class="xw-s2"><div>'+
   '<h4>Variables (aucune saisie : lues au dossier)</h4><table class="xw-grid"><tr><th>Variable</th><th>Valeur</th><th>Date</th><th>Origine</th></tr>'+
   row('Sexe', p.sexe==='F'?'Femme':'Homme', '', 'Fiche patient')+row('Âge', p.age, 'ans', 'Date de naissance')+row('Tabagisme', s.tabac?'Fumeur':'Non fumeur', '', 'Facteurs de risque')+
   row('PAS', s.pas, 'mmHg', 'Constantes')+row('Cholestérol total', s.chol, 'mmol/L', 'Biologie')+row('Cholestérol HDL', s.hdl, 'mmol/L', 'Biologie')+'</table>'+
   '<p class="mut" style="font-size:12px">Les champs seront modifiables à l\'écran pour simuler (ex. arrêt du tabac), sans écriture au dossier — comme à l\'étape 1.</p></div><div>'+
   '<h4>Applicabilité</h4><ul class="xw-chk">'+checks.map(c=>'<li>'+(c[0]?'✅':'❌')+' '+c[1]+' <span class="mut">— '+c[2]+'</span></li>').join('')+'<li>'+(diab?'⚠️':'✅')+' Pas de diabète <span class="mut">— '+(diab?'diabète au dossier':'aucun')+'</span></li></ul>'+
   '<div class="xw-res"><div class="big">— %</div><div class="mut" style="font-size:12px">risque cardiovasculaire à 10 ans</div>'+verdict+
   '<div class="xw-scale"><i style="background:#9bd3a8"></i><i style="background:#f4d35e"></i><i style="background:#f0a45d"></i><i style="background:#d9534f"></i></div><div style="display:flex;justify-content:space-between;font-size:11px;color:#555"><span>0</span><span>2 %</span><span>10 %</span><span>20 %</span></div></div>'+
   '<p class="mut" style="font-size:12px;margin-top:8px">Seuils 2 / 10 / 20 % selon la page de référence. Coefficients ESC à intégrer : aucun chiffre n\'est calculé dans cette maquette.</p></div></div></div>';
}

/* ---- Prévention MT (CPAM) ---- */
let showEuro = false;
function evalAll(){ const p = PROFILES[cur]; return ORDER_XW.map(id => Object.assign({id}, RULES[id](p))); }
const ST = {ok:['st-ok','À jour'], todo:['st-todo','À faire'], ex:['st-ex','Exclu'], nc:['st-nc','Non concerné']};
function paneMT(){
  const res = evalAll(), conc = res.filter(r=>r.statut==='ok'||r.statut==='todo'||r.statut==='ex'), hors = res.filter(r=>r.statut==='nc');
  const row = r => { const i = byId[r.id], st = ST[r.statut];
    return '<tr class="click" data-id="'+r.id+'"><td>'+(r.statut==='todo'?'💡':'')+'</td><td>'+i.titre+(i.source==='ameli'?' <span class="st st-nc" title="Fiche technique non reçue">provisoire</span>':'')+'</td><td><span class="st '+st[0]+'">'+st[1]+'</span></td><td>'+(r.last?fmt(r.last):'—')+'</td><td>'+(r.ech instanceof Date?fmt(r.ech):(r.ech||'—'))+'</td><td style="white-space:normal">'+(r.precision||'')+'</td>'+(showEuro?'<td>'+(r.statut==='todo'||r.statut==='ok'?'5 €':'')+'</td>':'')+'<td>'+(i.source==='fiche'?'Fiche v'+i.ver:'ameli')+'</td></tr>'; };
  const head = '<tr><th>Alerte</th><th>Indicateur</th><th>Statut</th><th>Dernière réalisation</th><th>Échéance / fenêtre</th><th>Précision</th>'+(showEuro?'<th>Montant</th>':'')+'<th>Source</th></tr>';
  const nTodo = res.filter(r=>r.statut==='todo').length;
  return '<div class="xw-top"><div style="display:flex;gap:10px;align-items:center"><div class="xw-btn">Imprimer</div><label style="font-size:12px"><input type="checkbox" id="xwEuro"'+(showEuro?' checked':'')+'> Afficher le montant</label></div><div class="xw-btn">Fermer</div></div>'+
   '<div class="xw-main" style="margin:0 6px 6px"><div class="xw-pad" style="padding-bottom:0"><strong>'+conc.length+' indicateur(s) concernent ce patient</strong> — '+nTodo+' à faire. <span class="mut">Cliquer une ligne pour lire la fiche technique.</span></div>'+
   '<table class="xw-grid" style="margin-top:8px">'+head+'<tr class="grp"><td colspan="'+(showEuro?8:7)+'">Concerne ce patient</td></tr>'+(conc.length?conc.map(row).join(''):'<tr><td colspan="8">Aucun indicateur.</td></tr>')+
   '<tr class="grp"><td colspan="'+(showEuro?8:7)+'">Ne concerne pas ce patient ('+hors.length+') — avec la raison</td></tr>'+hors.map(row).join('')+'</table>'+
   '<p class="mut xw-pad" style="font-size:12px">Statut calculé d\'après le dossier XMed, à titre indicatif : le décompte officiel est établi par l\'Assurance Maladie à partir des remboursements et peut différer (fiches techniques, § Limites). Règles simplifiées pour la démonstration.</p></div>';
}

/* ---- Rendu ---- */
function render(){
  const panes = {vacc:paneVacc, exam:paneExam, chrono:paneChrono, s2:paneS2, mt:paneMT};
  document.getElementById('xwPanes').innerHTML = panes[tab]();
  [...document.querySelectorAll('#xwTabs button')].forEach(b => b.classList.toggle('act', b.dataset.t===tab));
  if(tab==='vacc') vForm(0);
  const p = PROFILES[cur];
  document.getElementById('xwPatInfo').textContent = (p.sexe==='F'?'Femme':'Homme') + ', ' + p.age + ' ans (né' + (p.sexe==='F'?'e':'') + ' le ' + fmt(p.dobD) + ') · date de référence ' + fmt(REF);
  renderDock();
}
let dock = 'chrono';
function renderDock(){
  const b = document.getElementById('xwDockBody'); if(!b) return;
  [...document.querySelectorAll('#xwSeg button')].forEach(x => x.classList.toggle('act', x.dataset.d===dock));
  if(dock==='chrono') b.innerHTML = chronoSVG(true);
  else if(dock==='mt'){
    const r = evalAll().filter(x=>x.statut==='todo');
    b.innerHTML = r.length ? '<strong>À faire ('+r.length+')</strong><ul style="margin:6px 0;padding-left:18px">'+r.map(x=>'<li>'+byId[x.id].titre+'</li>').join('')+'</ul>' : 'Rien à faire selon le dossier.';
  } else { const s = PROFILES[cur]; b.innerHTML = (s.age<40||s.age>89) ? 'Score 2 non applicable ('+s.age+' ans).' : '<strong style="font-size:20px">— %</strong> <span class="mut">à 10 ans — algorithme à intégrer</span>'; }
}
root.addEventListener('click', e => {
  const t = e.target.closest('#xwTabs button'); if(t){ tab = t.dataset.t; render(); return; }
  const d = e.target.closest('#xwSeg button'); if(d){ dock = d.dataset.d; renderDock(); return; }
  const v = e.target.closest('tr[data-v]'); if(v){ root.querySelectorAll('tr[data-v]').forEach(x=>x.classList.remove('sel')); v.classList.add('sel'); vForm(+v.dataset.v); return; }
  const r = e.target.closest('tr[data-id]'); if(r){ document.getElementById('modalBody').innerHTML = detail(byId[r.dataset.id], false); document.getElementById('modalBg').classList.add('on'); return; }
  if(e.target.id==='xwEuro'){ showEuro = e.target.checked; render(); }
});
sel.addEventListener('change', () => { cur = sel.value; render(); });
render();
})();
