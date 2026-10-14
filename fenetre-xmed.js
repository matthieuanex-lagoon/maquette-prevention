/* Modélisation de la fenêtre XMed « Prévention » d'après les captures de l'application :
   onglets existants (Vaccins, Examens et consultations, Chronologie) + deux onglets proposés (Score 2, Prévention MT).
   Données patient fictives. Règles : fiches techniques CPAM, simplifiées pour la démonstration. */
(function(){
const REF = new Date(2026, 9, 14);                         // « aujourd'hui » de la démo
const D = s => { const [y,m,d] = s.split('-').map(Number); return new Date(y, m-1, d); };
const fmt = d => d.toLocaleDateString('fr-FR');
const iso = d => d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
const addM = (d, n) => new Date(d.getFullYear(), d.getMonth()+n, d.getDate());
const monthsBetween = (a, b) => (b.getFullYear()-a.getFullYear())*12 + (b.getMonth()-a.getMonth()) - (b.getDate() < a.getDate() ? 1 : 0);
const latest = arr => (arr||[]).map(D).sort((a,b)=>b-a)[0] || null;
const within = (arr, n) => { const l = latest(arr); return l && monthsBetween(l, REF) < n ? l : null; };
const YEAR_END = new Date(REF.getFullYear(), 11, 31);       // « à faire avant le 31/12 de l'année en cours »
const CHOL = 2.586;                                          // 1 g/L = 2,586 mmol/L (cholestérol)

/* ---- Patients fictifs ---- */
const V = (d, nom, val, extra) => Object.assign({d, nom, val}, extra || {});
const PROFILES = {
 E:{label:"Homme de 69 ans — le dossier des captures", sexe:'M', _dob:'1957-03-04', ald:[], meds:{}, ante:[], refus:{},
    vacc:[ V('2013-04-29','REPEVAX SER 0,5ML 1 [Supprimé]','DTCP',{rappel:'2024-08-05'}), V('2019-11-28','PREVENAR 13 SER A/A 0,5ML','Pneumocoque (13 souches)'),
           V('2020-01-24','PNEUMOVAX SER 0,5ML 1','Pneumocoque (23 souches)',{lot:'1031728'}), V('2021-10-27','INFLUVAC TETRA SER 0,5ML 1 [Sup…]','Grippe saisonnière',{lot:'Z20'}),
           V('2022-11-07','INFLUVAC SER 0,5ML 1 [Supprimé]','Grippe saisonnière'), V('2024-01-01','REPEVAX SER+1AIG 0,5ML 1','DTCP',{rappel:'2034-08-05',lot:'X30151V',vert:true}),
           V('2024-11-08','FLUARIXTETRA SER 0,5ML','Grippe saisonnière'), V('2025-01-27','PNEUMOVAX SER 0,5ML 1','Pneumocoque (23 souches)',{rappel:'2030-01-27',lot:'3037819',vert:true}),
           V('2025-07-16','SHINGRIX PDR+SUSP IM FL+FL 1','Varicelle-Zona',{lot:'E53T7…'}), V('2025-11-12','SHINGRIX PDR+SUSP IM FL+FL 1','Varicelle-Zona',{lot:'N4GS4'}),
           V('2025-11-29','VAXIGRIP SER+AIG 0,5ML 1','Grippe saisonnière') ],
    exams:[{nom:'Echographie thyroïdienne', ech:'2027-07-28', statut:'Actif', par:'ANEX Matthieu', pose:'28/09/2026', dans:'10 mois'}],
    ev:{flu:['2025-11-29']}, s2:{tabac:false, pas:135, chol:5.9, hdl:1.4, statine:false, date:'2026-04-18'}},
 A:{label:"Enfant de 11 ans — HPV refusé", sexe:'F', _dob:'2015-03-12', ald:[], meds:{}, ante:[], refus:{HPV:'2025-10-22', MEN:'2025-10-22'},
    vacc:[ V('2016-05-28','PRIORIX PDR+SOLV SER 0,5ML 1','Rougeole-Oreillons-Rubéole'), V('2020-12-28','REPEVAX SER 0,5ML 1 [Supprimé]','DTCP'),
           V('2025-10-22','GARDASIL 9 SER+2 AIG 0,5ML 1','papillomavirus (Humain types 6…',{refus:true}), V('2025-10-22','NIMENRIX PDR+SOL SER IM 1','méningocoque A + C + Y + W-135',{refus:true}),
           V('2026-01-14','REPEVAX SER+1AIG 0,5ML 1','DTCP',{lot:'Y3K12…'}) ], exams:[],
    ev:{}, s2:{tabac:false, pas:null, chol:null, hdl:null, statine:false}},
 B:{label:"Femme de 58 ans — diabète de type 2", sexe:'F', _dob:'1968-05-20', ald:[8], meds:{A10:true}, ante:[], refus:{},
    vacc:[ V('2024-11-05','FLUARIXTETRA SER 0,5ML','Grippe saisonnière') ], exams:[{nom:'Fond d’œil', ech:'2026-12-01', statut:'Actif', par:'ANEX Matthieu', pose:'02/06/2026', dans:'6 mois'}],
    ev:{creat:['2026-02-10'], hba1c:['2026-06-10'], dcc:['2025-02-14'], hpvhr:['2023-09-05'], mammo:['2024-05-20'], flu:['2024-11-05']},
    s2:{tabac:false, pas:138, chol:5.4, hdl:1.4, statine:false, date:'2026-04-18'}},
 C:{label:"Homme de 68 ans — fumeur, sans ALD", sexe:'M', _dob:'1958-02-02', ald:[], meds:{}, ante:[], refus:{},
    vacc:[ V('2026-10-02','VAXIGRIP SER+AIG 0,5ML 1','Grippe saisonnière') ], exams:[],
    ev:{dcc:['2022-11-03'], flu:['2026-10-02']}, s2:{tabac:true, pas:142, chol:5.8, hdl:1.1, statine:false, date:'2026-04-18'}},
 D:{label:"Femme de 74 ans — sans ALD (SCORE2-OP)", sexe:'F', _dob:'1952-06-14', ald:[], meds:{}, ante:[], refus:{},
    vacc:[ V('2026-10-05','VAXIGRIP SER+AIG 0,5ML 1','Grippe saisonnière') ], exams:[],
    ev:{flu:['2026-10-05']}, s2:{tabac:false, pas:150, chol:6.1, hdl:1.5, statine:false, date:'2026-04-18'}}
};
Object.values(PROFILES).forEach(p => { p.dobD = D(p._dob); p.ageM = monthsBetween(p.dobD, REF); p.age = Math.floor(p.ageM/12); });

/* ---- Règles : population → exclusion → réalisation ---- */
const hasAny = (p, list) => list.some(x => p.ald.includes(x));
const nc = why => ({statut:'nc', precision:why});
const ex = why => ({statut:'ex', precision:why});
const ok = (last, ech, prec) => ({statut:'ok', last, ech, precision:prec||''});
const todo = (prec, last, limite) => ({statut:'todo', precision:prec + (limite ? ' — limite : ' + limite : ''), ech:YEAR_END, last:last||null});
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
  const l = within(p.ev.dcc, 24); return l ? ok(l, addM(l,24)) : todo("Test immunologique absent depuis 24 mois", latest(p.ev.dcc));
 },
 DOU(p){
  if(p.sexe!=='F') return nc("Indicateur réservé aux femmes");
  if(!(p.age>=25 && p.age<66)) return nc("Hors tranche 25–65 ans");
  if(p.ante.includes('hysterectomie')) return ex("Hystérectomie totale");
  const ageAt = d => Math.floor(monthsBetween(p.dobD, d)/12);
  const cyt = (p.ev.cytol||[]).map(D).filter(d => ageAt(d)>=25 && ageAt(d)<=29).sort((x,y)=>y-x);   // cytologies comptées entre 25 et 29 ans
  const hpv = (p.ev.hpvhr||[]).map(D).filter(d => ageAt(d)>=30).sort((x,y)=>y-x);                  // HPV-HR comptés à partir de 30 ans
  if(hpv[0] && monthsBetween(hpv[0],REF)<60) return ok(hpv[0], addM(hpv[0],60), "Test HPV-HR");
  if(cyt[0] && monthsBetween(cyt[0],REF)<12) return ok(cyt[0], addM(cyt[0],12), "Cytologie (25–29 ans)");
  if(cyt.length>=2 && monthsBetween(cyt[0],REF)<36 && monthsBetween(cyt[1],cyt[0])>=6) return ok(cyt[0], addM(cyt[0],36), "2 cytologies ≥ 6 mois d’intervalle");
  return todo(p.age>=30 ? "Test HPV-HR absent depuis 5 ans" : "Cytologie absente depuis 1 an (ou 2 en 3 ans)");
 },
 DOS(p){
  if(p.sexe!=='F') return nc("Indicateur réservé aux femmes");
  if(!(p.age>=50 && p.age<75)) return nc("Hors tranche 50–74 ans");
  const l = within(p.ev.mammo, 24); return l ? ok(l, addM(l,24)) : todo("Mammographie absente depuis 24 mois", latest(p.ev.mammo));
 },
 HBA(p){
  if(!(p.ald.includes(8) || p.meds.A10)) return nc("Pas de diabète (antidiabétiques prescrits ou diabète au dossier)");
  const l = within(p.ev.hba1c, 6); return l ? ok(l, addM(l,6)) : todo("HbA1c / fructosamine absente depuis 6 mois");
 },
 GRI(p){
  if(!(p.age>=65 || (p.ageM>=6 && (hasAny(p,ALD_GRIP) || p.meds.R03 || p.meds.L04)))) return nc("Moins de 65 ans, sans facteur de risque");
  const s = campaignStart(), l = latest(p.ev.flu);
  return l && l >= s ? ok(l, new Date(s.getFullYear()+1,3,1), "Campagne en cours") : todo("Aucune dose depuis le " + fmt(s), l);
 },
 COV(p){
  if(!(p.age>=65 || (p.ageM>=6 && (hasAny(p,ALD_GRIP.concat([23])) || p.meds.R03 || p.meds.L04)))) return nc("Moins de 65 ans, sans facteur de risque");
  const s = campaignStart(), l = latest(p.ev.covid);
  return l && l >= s ? ok(l, new Date(s.getFullYear()+1,3,1), "Campagne en cours") : todo("Aucune dose depuis le " + fmt(s), l);
 },
 HPV(p){
  if(!(p.age>=11 && p.age<16)) return nc("Hors tranche 11–15 ans");
  const lo = new Date(p.dobD.getFullYear()+10, p.dobD.getMonth(), 1), hi = new Date(p.dobD.getFullYear()+15, p.dobD.getMonth()+1, 0);
  const doses = (p.ev.hpv||[]).map(D).filter(d => d>=lo && d<=hi).sort((a,b)=>a-b);
  if(doses.length>=2 && monthsBetween(doses[0], doses[doses.length-1])>=3) return ok(doses[doses.length-1], "—", "2 doses ≥ 3 mois");
  return todo(doses.length ? "1 dose sur 2" : "Aucune dose sur 2", doses[0]||null, "fin du mois du 15e anniversaire = " + fmt(hi));
 },
 PNE(p){
  const L = [2,3,5,6,7,8,9,14,19,21,22,24,25,27,28,30];
  if(!(p.age>=65 || (p.age>=18 && (hasAny(p,L) || p.meds.R03 || p.meds.L04)))) return nc("Moins de 65 ans, sans facteur de risque");
  const l = latest(p.ev.vpc); return l && l >= D('2024-03-01') ? ok(l, "Dose unique — terminé") : todo("Aucune dose VPC20/VPC21 depuis mars 2024 (VPC13 et PPV23 ne comptent pas)");
 },
 /* provisoires : description officielle, fiche technique non reçue */
 M9(p){ return (p.ageM>=8 && p.ageM<=21) ? todo("Consultation à réaliser entre 8 et 10 mois") : nc("Enfants de 8 à 21 mois"); },
 M24(p){ return (p.ageM>=22 && p.ageM<=37) ? todo("Consultation à réaliser entre 22 et 26 mois") : nc("Enfants de 22 à 37 mois"); },
 ROR(p){ return (p.ageM>=16 && p.ageM<=35) ? todo("2 doses avant 24 mois") : nc("Enfants de 16 à 35 mois"); },
 MEN(p){ return (p.ageM>=6 && p.ageM<=23) ? todo("1 dose ACWY avant 12 mois") : nc("Enfants de 6 à 23 mois"); },
 DENT(p){
  if(!(p.age>=3 && p.age<=24)) return nc("Personnes de 3 à 24 ans");
  const l = within(p.ev.dent, 12); return l ? ok(l, addM(l,12)) : todo("Aucun suivi bucco-dentaire enregistré depuis 1 an");
 }
};
const ORDER_XW = ['MRC','DIA','DOC','DOU','DOS','HBA','GRI','COV','PNE','HPV','M9','M24','DENT','ROR','MEN'];

/* ---- État de la démonstration ---- */
let cur = 'E', tab = 'vacc', selId = null, dock = 'grille', unit = 'mmol', s2sim = {}, mt = {}, vsel = 0;
const mtOf = () => (mt[cur] = mt[cur] || {});
function evalAll(){
  const p = PROFILES[cur], st = mtOf();
  return ORDER_XW.map(id => {
    let r = Object.assign({id}, RULES[id](p));
    const s = st[id] || {};
    if(r.statut !== 'nc'){
      if(s.excl && (!s.until || D(s.until) > REF)) r = Object.assign({id}, ex("Exclusion saisie par le praticien" + (s.until ? " — jusqu’au " + fmt(D(s.until)) : "")));
      else if(s.done) r = Object.assign({id}, ok(D(s.done), '—', "Forçage manuel du " + fmt(D(s.done))));
      else if(s.refus && r.statut === 'todo') r = Object.assign({id}, r, {statut:'refus', precision:"Refus du " + fmt(D(s.refus)) + " — " + r.precision});
    }
    return Object.assign(r, {prop:!!s.prop, refusBox:!!s.refus, exclBox:!!s.excl, until:s.until || ''});
  });
}
const led = c => '<span class="led led-' + c + '"></span>';
const mtLed = () => evalAll().some(r => r.statut === 'todo') ? 'o' : 'g';
function s2LedColor(){ return 'x'; }   // voyant Score 2 : neutre pour l'instant

/* ---- Gabarit ---- */
const root = document.getElementById('xwRoot');
const TABS = [['vacc','Vaccins',()=>led('g'),0],['exam','Examens et consultations',()=>led('g'),0],['mt','Prévention MT (CPAM)',()=>led(mtLed()),1],['chrono','Chronologie',()=>'',0],['s2','Score 2',()=>led('x'),1]];
root.innerHTML =
 '<p class="xw-note">Reproduction de la fenêtre « Prévention » de XMed d’après vos captures. Trois onglets existants sont conservés ; <strong style="color:#00769e">Score 2</strong> et <strong style="color:#00769e">Prévention MT (CPAM)</strong> sont les onglets proposés (liseré bleu). Les voyants colorés des onglets sont une proposition (règle à définir). Données fictives.</p>'+
 '<div class="xw-bar"><label>Patient de démonstration : <select id="xwPat"></select></label><span class="mut" id="xwPatInfo"></span></div>'+
 '<div class="xw-win"><div class="xw-title"><span class="ico"></span><span>Prévention</span><span class="ctl">–&nbsp;☐&nbsp;✕</span></div>'+
 '<div class="xw-tabs" id="xwTabs"></div><div id="xwPanes"></div></div>'+
 '<h3 class="s" style="margin-top:26px">Cadre « Prévention » du dossier patient</h3>'+
 '<p class="xw-note">Le cadre latéral existant (interrupteur Chronologie / Grille) pourrait accueillir les deux nouvelles vues sous forme résumée.</p>'+
 '<div class="xw-dock"><div class="hd"><span>Prévention</span><span id="xwDockLeds"></span></div><div class="xw-seg" id="xwSeg"><button data-d="grille">Grille</button><button data-d="chrono">Chronologie</button><button data-d="mt">MT (CPAM)</button><button data-d="s2">Score 2</button></div><div class="bd" id="xwDockBody"></div></div>';
const sel = document.getElementById('xwPat');
Object.keys(PROFILES).forEach(k => sel.insertAdjacentHTML('beforeend','<option value="'+k+'">'+PROFILES[k].label+'</option>'));

/* ---- Boutons latéraux (comme l'écran actuel) ---- */
function sideButtons(enableCancel){
  const b = (t, dis) => '<div class="xw-btn' + (dis ? ' dis' : '') + '" data-act="' + t + '">' + (enableCancel && t === 'Fait' ? 'Forcer « Fait »' : t) + '</div>';
  return '<div class="xw-side">' + b('Ajouter') + b('Appliquer', 1) + b('Annuler la saisie', !enableCancel) + b('Fait') + '<div style="height:8px"></div>' + b(enableCancel ? 'Annuler le forçage' : 'Annuler le rappel', enableCancel ? 1 : 0) + b('Ouvrir le document', 1) +
   b('Imprimer') + b('Impression PDF') + '<label style="font-size:12px;margin:4px 0"><input type="checkbox"> Voir l’historique</label><div style="flex:1"></div>' + b('Fermer') + '</div>';
}

/* ---- Vaccins ---- */
function paneVacc(){
  const p = PROFILES[cur], rows = p.vacc.slice().sort((a,b)=>a.d<b.d?-1:1);
  return '<div class="xw-body"><div class="xw-main"><table class="xw-grid"><tr><th>Alerte</th><th>Date ▲</th><th>DMP</th><th>Nom commercial</th><th>Valence</th><th>Rappel</th><th>Refus</th><th>Proposé</th><th>Notes</th><th>Lot</th><th>Acteur</th><th>Code CIP</th></tr>'+
   rows.map((r,i)=>'<tr class="click'+(i===vsel?' sel':'')+'" data-v="'+i+'"><td>'+(r.vert?'<span class="bulb on">●</span>':'<span class="bulb">○</span>')+'</td><td>'+fmt(D(r.d))+'</td><td>☐</td><td>'+r.nom+'</td><td>'+r.val+'</td><td>'+(r.rappel?fmt(D(r.rappel)):'')+'</td><td>'+(r.refus?'☑':'☐')+'</td><td>0</td><td></td><td>'+(r.lot||'')+'</td><td>Matthieu ANEX</td><td>3400930…</td></tr>').join('')+
   '</table></div>' + sideButtons() + '</div>';
}

/* ---- Examens et consultations ---- */
function paneExam(){
  const p = PROFILES[cur], e = p.exams[0];
  const grid = '<table class="xw-grid"><tr><th>Examen</th><th>Répétition</th><th>Note</th><th>Statut</th><th>Créé par</th><th>Proposé</th><th>Refusé</th><th>Échéance</th></tr>' +
    p.exams.map((x,i)=>'<tr class="'+(i===0?'sel':'')+'"><td>'+x.nom+'</td><td></td><td></td><td>'+x.statut+'</td><td>'+x.par+'</td><td>☐</td><td>☐</td><td>'+fmt(D(x.ech))+'</td></tr>').join('') + '</table>';
  const form = e ? '<div class="xw-form" style="grid-template-columns:90px 1fr"><div></div><div class="mut">Posé le '+e.pose+' par '+e.par+'</div><div>Examen :</div><div><span class="fld" style="display:block">'+e.nom+'</span></div>'+
    '<div>dans</div><div><span class="fld">'+e.dans.split(' ')[0]+'</span> '+e.dans.split(' ')[1]+' ou le <span class="fld" style="min-width:90px;display:inline-block"></span></div><div></div><div>☐ Répéter tous les <span class="fld">1</span> an(s) pendant <span class="fld">10</span> an(s)</div>'+
    '<div>Note :</div><div><span class="fld" style="display:block;min-height:22px"></span></div><div></div><div style="color:#2f6f9f">→ '+e.nom+' le '+fmt(D(e.ech))+'</div></div>' : '<div class="xw-pad mut">Aucun examen programmé pour ce patient.</div>';
  return '<div class="xw-body"><div class="xw-main">' + grid + form + '</div>' + sideButtons() + '</div>';
}

/* ---- Chronologie (SVG générée depuis les vaccins et examens) ---- */
function chronoSVG(compact){
  const p = PROFILES[cur];
  const groups = {};
  p.vacc.forEach(v => (groups[v.val] = groups[v.val] || []).push(v));
  const gk = Object.keys(groups).sort((a,b)=> D(groups[b][0].d) - D(groups[a][0].d));
  const rows = gk.map(k => ({lab:'Vaccin ' + k.replace(/\s*\(Humain.*$/, ''), type:'v', items:groups[k]})).concat(p.exams.map(e => ({lab:e.nom, type:'e', items:[e]})));
  const years = [];
  rows.forEach(r => r.items.forEach(i => { years.push(D(i.d || i.ech).getFullYear()); if(i.rappel) years.push(D(i.rappel).getFullYear()); }));
  const y0 = Math.min(...years, REF.getFullYear()) - 1, y1 = Math.max(...years, REF.getFullYear()) + 1;
  const W = compact ? 330 : 940, L = compact ? 118 : 230, R = 16, T = 10, B = 30, rh = compact ? 30 : 64;
  const H = T + rh*rows.length + B;
  const X = d => L + (d - new Date(y0,0,1)) / (new Date(y1,0,1) - new Date(y0,0,1)) * (W - L - R);
  let s = '<svg viewBox="0 0 '+W+' '+H+'" width="100%" role="img" aria-label="Chronologie">';
  const nv = rows.filter(r => r.type==='v').length;
  if(nv) s += '<rect x="'+X(new Date(y0,6,1))+'" y="'+(T+2)+'" width="'+(X(new Date(y1,0,1))-X(new Date(y0,6,1)))+'" height="'+(rh*nv-4)+'" fill="#e3edf9"/>';
  const step = (y1 - y0) > 14 ? 2 : 1;
  for(let y=y0; y<=y1; y+=step){ const x = X(new Date(y,0,1)); s += '<line x1="'+x+'" x2="'+x+'" y1="'+T+'" y2="'+(H-B)+'" stroke="#d6dde2"/><text x="'+x+'" y="'+(H-B+14)+'" font-size="'+(compact?8:10)+'" text-anchor="middle" fill="#444">01/01/'+(compact?String(y).slice(2):y)+'</text>'; }
  rows.forEach((r,i) => {
    const y = T + rh*(i+.5);
    s += '<text x="'+(L-8)+'" y="'+(y+4)+'" font-size="'+(compact?9:11)+'" text-anchor="end" fill="#222">'+(compact ? r.lab.slice(0,18) : r.lab)+'</text>';
    const real = r.items.filter(x => !x.refus && r.type==='v').map(x => D(x.d)).sort((a,b)=>a-b);
    const rap = r.items.map(x => x.rappel).filter(Boolean).map(D).filter(d => d > REF).sort((a,b)=>b-a)[0];
    const ends = real.slice(); if(rap) ends.push(rap);
    if(ends.length > 1) s += '<line x1="'+X(ends[0])+'" x2="'+X(ends[ends.length-1])+'" y1="'+y+'" y2="'+y+'" stroke="#bbb" stroke-width="'+(compact?5:8)+'"/>';
    real.forEach(d => s += '<circle cx="'+X(d)+'" cy="'+y+'" r="'+(compact?4:5.5)+'" fill="#2e7d5b"/>');
    r.items.filter(x => x.refus).forEach(x => s += '<text x="'+X(D(x.d))+'" y="'+(y+5)+'" font-size="15" text-anchor="middle" fill="#f39c12" font-weight="700">✖</text>');
    const tri = rap || (r.type==='e' ? D(r.items[0].ech) : null);
    if(tri) s += '<polygon points="'+(X(tri)-6)+','+(y+6)+' '+(X(tri)+6)+','+(y+6)+' '+X(tri)+','+(y-7)+'" fill="#3f78b5"/>';
  });
  const xt = X(REF);
  s += '<line x1="'+xt+'" x2="'+xt+'" y1="'+T+'" y2="'+(H-B)+'" stroke="#2f6f9f" stroke-width="1.5"/>';
  return s + '</svg>';
}
function paneChrono(){
  return '<div class="xw-top"><div class="xw-btn" data-act="Imprimer">Imprimer la chronologie</div><div class="xw-btn">Fermer</div></div><div class="xw-main xw-pad" style="margin:0 6px 6px;position:relative">'+chronoSVG(false)+
   '<div class="legendbox"><span style="background:#e3edf9;padding:0 6px">&nbsp;</span> Vaccins<br><span style="color:#3f78b5">▲</span> À venir<br><span style="color:#2e7d5b">●</span> Fait<br><span style="color:#d93025">■</span> En retard<br><span style="color:#f39c12">✖</span> Refusé<br>│ Aujourd’hui</div></div>';
}

/* ---- Score 2 (algorithme : score2.js, articles ESC 2021) ---- */
function s2input(p){
  const s = p.s2, o = s2sim[cur] || {}, pick = (k, v) => (o[k] !== undefined ? o[k] : v);
  return {sex:p.sexe, age:p.age, smoker:pick('smoker', s.tabac), sbp:pick('sbp', s.pas), tchol:pick('chol', s.chol), hdl:pick('hdl', s.hdl),
          diabetes:p.ald.includes(8) || !!p.meds.A10, cvd:hasAny(p,[1,3,13]), statin:pick('statine', s.statine), severeHTA:p.ald.includes(12)};
}
function s2result(){
  const p = PROFILES[cur], inp = s2input(p), r = SCORE2ALGO.compute(inp);
  const COL = ['#2e7d32', '#e0a100', '#b3261e'], LAB = ['Vert', 'Orange', 'Rouge'];
  if(!r.ok){
    return '<div class="big" style="font-size:26px">— %</div><span class="st st-ex">Non calculé</span><ul style="text-align:left;font-size:12px">' + r.why.map(w => '<li>' + w + '</li>').join('') + '</ul>' +
      (r.diabetes ? '<div class="mut" style="font-size:11.5px;text-align:left">Variables supplémentaires attendues pour SCORE2-Diabetes (d’après la publication, à confirmer sur document) : âge au diagnostic du diabète, HbA1c, DFG estimé.</div>' : '');
  }
  return '<div class="big" style="color:' + COL[r.cls] + '">' + r.shown + ' %</div><div class="mut" style="font-size:12px">risque cardiovasculaire à 10 ans — ' + r.model + ' (France : risque faible)</div>' +
    '<span class="st" style="background:' + COL[r.cls] + ';color:#fff">' + LAB[r.cls] + '</span>' +
    '<div class="mut" style="font-size:11.5px;margin-top:6px">vert ' + r.thresholds[0] + ' · orange ' + r.thresholds[1] + ' · rouge ' + r.thresholds[2] + '</div>' +
    (r.exact ? '' : '<div class="mut" style="font-size:11.5px">Lu dans le tableau officiel (tranches, entiers)</div>') +
    (r.flags.length ? '<div style="font-size:11.5px;color:#b26a00">' + r.flags.join('<br>') + '</div>' : '');
}
function paneS2(){
  const p = PROFILES[cur], s = p.s2, inp = s2input(p), dt = s.date ? fmt(D(s.date)) : '—';
  const conv = v => v == null ? null : (unit === 'g' ? +(v / CHOL).toFixed(2) : v);
  const num = (f, v, step) => '<input type="number" data-sim="' + f + '" step="' + (step || 1) + '" value="' + (v == null ? '' : v) + '" placeholder="manquant">';
  const row = (lab, ctl, u, src) => '<tr><td>' + lab + '</td><td>' + ctl + ' ' + u + '</td><td>' + (ctl.includes('value=""') ? '—' : dt) + '</td><td>' + src + '</td></tr>';
  const ante = [
    [!inp.cvd, 'Pas de maladie cardiovasculaire établie', inp.cvd ? 'ALD cardiovasculaire' : 'aucune'],
    [!inp.severeHTA, 'Pas d’HTA sévère', inp.severeHTA ? 'au dossier' : 'aucune'],
    [!inp.statin, 'Pas de traitement hypolipémiant', inp.statin ? 'en cours' : 'aucun'],
    [!inp.diabetes, 'Pas de diabète (sinon SCORE2-Diabetes)', inp.diabetes ? 'diabète au dossier' : 'aucun']
  ];
  const u = unit === 'g' ? 'g/L' : 'mmol/L', stp = unit === 'g' ? 0.01 : 0.1;
  return '<div class="xw-top"><div style="display:flex;gap:6px"><div class="xw-btn" data-act="Imprimer">Imprimer</div><div class="xw-btn" data-act="Impression PDF">Impression PDF</div></div><div class="xw-btn">Fermer</div></div><div class="xw-main" style="margin:0 6px 6px"><div class="xw-s2"><div>' +
   '<h4>Variables lues au dossier (modifiables pour simuler)</h4><table class="xw-grid"><tr><th>Variable</th><th>Valeur</th><th>Date</th><th>Origine</th></tr>' +
   row('Sexe', p.sexe === 'F' ? 'Femme' : 'Homme', '', 'Fiche patient') + row('Âge', String(p.age), 'ans', 'Date de naissance') +
   row('Tabagisme', '<label><input type="checkbox" data-sim="smoker"' + (inp.smoker ? ' checked' : '') + '> Fumeur</label>', '', 'Facteurs de risque') +
   row('PAS', num('sbp', inp.sbp), 'mmHg', 'Constantes') + row('Cholestérol total', num('chol', conv(inp.tchol), stp), u, 'Biologie') + row('Cholestérol HDL', num('hdl', conv(inp.hdl), stp), u, 'Biologie') + '</table>' +
   '<p style="font-size:12.5px">Unité des lipides : <label><input type="radio" name="xwUnit" value="mmol"' + (unit === 'mmol' ? ' checked' : '') + '> mmol/L</label> <label><input type="radio" name="xwUnit" value="g"' + (unit === 'g' ? ' checked' : '') + '> g/L</label> <span class="mut">(1 g/L = 2,586 mmol/L ; calcul toujours en mmol/L)</span></p>' +
   '<p class="mut" style="font-size:12px">Simulation devant le patient (ex. arrêt du tabac) : rien n’est écrit au dossier. <a href="#" id="xwS2Reset">Revenir aux valeurs du dossier</a></p></div><div>' +
   '<h4>Applicabilité</h4><ul class="xw-chk">' + ante.map(c => '<li>' + (c[0] ? '✅' : '❌') + ' ' + c[1] + ' <span class="mut">— ' + c[2] + '</span></li>').join('') +
   '<li>' + ((p.age >= 40 && p.age <= 89) ? '✅' : '❌') + ' Âge entre 40 et 89 ans <span class="mut">— ' + p.age + ' ans' + (p.age >= 70 ? ' (SCORE2-OP)' : '') + ' · calcul proposé dès 40 ans, à revalider</span></li></ul>' +
   '<div class="xw-res" id="xwS2Res">' + s2result() + '</div>' +
   '<p class="mut" style="font-size:12px;margin-top:8px">Source : articles SCORE2 et SCORE2-OP (ESC 2021), région France = risque faible.</p></div></div></div>';
}

/* ---- Prévention MT (CPAM) : même langage visuel que Examens et consultations ---- */
const ST = {ok:['st-ok','À jour'], todo:['st-todo','À faire'], refus:['st-refus','Refusé'], ex:['st-ex','Exclu'], nc:['st-nc','Non concerné']};
function paneMT(){
  const res = evalAll(), conc = res.filter(r => r.statut !== 'nc'), hors = res.filter(r => r.statut === 'nc');
  const nTodo = res.filter(r => r.statut === 'todo').length;
  if(!selId || !res.some(r => r.id === selId && r.statut !== 'nc')) selId = (conc[0] || {}).id || null;
  const row = r => { const i = byId[r.id], st = ST[r.statut], act = r.statut !== 'nc';
    const echeance = r.statut === 'todo' ? 'Avant le ' + fmt(r.ech) : (r.ech instanceof Date ? fmt(r.ech) : (r.statut === 'ok' && r.ech ? r.ech : ''));
    const cb = (k, v) => act ? '<input type="checkbox" data-mt="' + k + '" data-id="' + r.id + '"' + (v ? ' checked' : '') + '>' : '';
    return '<tr class="click' + (r.id === selId ? ' sel' : '') + '" data-id="' + r.id + '"><td>' + (r.statut === 'todo' ? led('o') : (r.statut === 'ok' ? led('g') : (r.statut === 'refus' ? led('r') : ''))) + '</td><td>' + i.titre + (i.source === 'ameli' ? ' <span class="st st-nc" title="Fiche technique non reçue">provisoire</span>' : '') + '</td>' +
      '<td><span class="st ' + st[0] + '">' + st[1] + '</span></td><td>' + (r.last ? fmt(r.last) : '') + '</td><td>' + echeance + '</td>' +
      '<td>' + cb('prop', r.prop) + '</td><td>' + cb('refus', r.refusBox) + '</td><td>' + cb('excl', r.exclBox) + (act && r.exclBox ? '<br><span class="mut" style="font-size:11px">jusqu’au</span> <input type="date" data-mt="until" data-id="' + r.id + '" value="' + r.until + '">' : '') + '</td><td style="white-space:normal;min-width:240px">' + (r.precision || '') + '</td><td>' + (i.source === 'fiche' ? 'v' + i.ver : 'liste') + '</td></tr>'; };
  const head = '<tr><th></th><th>Indicateur</th><th>Statut</th><th>Réalisé le</th><th>Échéance</th><th>Proposé</th><th>Refusé</th><th>Exclu</th><th>Précision</th><th>Fiche</th></tr>';
  return '<div class="xw-body"><div class="xw-main"><div class="xw-pad" style="padding-bottom:0"><strong>' + conc.length + ' indicateur(s) concernent ce patient</strong> — ' + nTodo + ' à faire avant le ' + fmt(YEAR_END) + '. <span class="mut">Double-clic sur une ligne : fiche technique.</span></div>' +
   '<table class="xw-grid" style="margin-top:8px">' + head + '<tr class="grp"><td colspan="10">Concerne ce patient</td></tr>' + (conc.length ? conc.map(row).join('') : '<tr><td colspan="10">Aucun indicateur.</td></tr>') +
   '<tr class="grp"><td colspan="10">Ne concerne pas ce patient (' + hors.length + ') — avec la raison</td></tr>' + hors.map(row).join('') + '</table>' +
   '<p class="mut xw-pad" style="font-size:12px">« Fait » est posé automatiquement quand la donnée est trouvée au dossier ; sinon il peut être forcé à la main. Statut calculé d’après le dossier XMed, à titre indicatif : le décompte officiel est établi par l’Assurance Maladie à partir des remboursements et peut différer. Règles simplifiées pour la démonstration.</p></div>' +
   sideButtons(true) + '</div>';
}

/* ---- Rendu ---- */
function render(){
  const panes = {vacc:paneVacc, exam:paneExam, chrono:paneChrono, s2:paneS2, mt:paneMT};
  document.getElementById('xwTabs').innerHTML = TABS.map(t => '<button data-t="' + t[0] + '" class="' + (t[3] ? 'new ' : '') + (t[0] === tab ? 'act' : '') + '">' + t[2]() + t[1] + '</button>').join('');
  document.getElementById('xwPanes').innerHTML = panes[tab]();
  const p = PROFILES[cur];
  document.getElementById('xwPatInfo').textContent = (p.sexe === 'F' ? 'Femme' : 'Homme') + ', ' + p.age + ' ans (né' + (p.sexe === 'F' ? 'e' : '') + ' le ' + fmt(p.dobD) + ') · date de référence ' + fmt(REF);
  renderDock();
}
function renderDock(){
  const b = document.getElementById('xwDockBody'); if(!b) return;
  const p = PROFILES[cur];
  [...document.querySelectorAll('#xwSeg button')].forEach(x => x.classList.toggle('act', x.dataset.d === dock));
  document.getElementById('xwDockLeds').innerHTML = led(mtLed()) + ' ' + led('x');
  if(dock === 'chrono') b.innerHTML = chronoSVG(true);
  else if(dock === 'grille'){
    const groups = {}; p.vacc.filter(v => !v.refus).forEach(v => (groups[v.val] = groups[v.val] || []).push(v));
    const rows = [];
    Object.keys(groups).forEach(k => { const g = groups[k].sort((a,c)=>a.d<c.d?-1:1), l = g[g.length-1], rap = g.map(x=>x.rappel).filter(Boolean).sort().pop();
      if(rap || monthsBetween(D(l.d), REF) < 60) rows.push(['Vaccin', k.slice(0,16), rap ? fmt(D(rap)) : '', rap ? 'Rappel atte…' : 'Fait', fmt(D(l.d))]); });
    p.exams.forEach(e => rows.push(['Examen', e.nom.slice(0,16), fmt(D(e.ech)), 'A faire', '']));
    b.innerHTML = '<table class="xw-grid"><tr><th>Type</th><th>Examen / …</th><th>Échéance</th><th>Statut</th><th>Réalisé le</th></tr>' + rows.map(r => '<tr><td>' + r[0] + '</td><td>' + r[1] + '</td><td>' + r[2] + '</td><td>' + r[3] + '</td><td>' + r[4] + '</td></tr>').join('') + '</table>';
  } else if(dock === 'mt'){
    const r = evalAll().filter(x => x.statut === 'todo');
    b.innerHTML = r.length ? '<strong>À faire avant le ' + fmt(YEAR_END) + ' (' + r.length + ')</strong><ul style="margin:6px 0;padding-left:18px">' + r.map(x => '<li>' + byId[x.id].titre + '</li>').join('') + '</ul>' : 'Rien à faire selon le dossier.';
  } else { const r = SCORE2ALGO.compute(s2input(p)); b.innerHTML = r.ok ? '<strong style="font-size:22px">' + r.shown + ' %</strong> <span class="mut">à 10 ans — ' + r.model + '</span>' : '<span class="mut">Score 2 non calculé : ' + r.why[0] + '</span>'; }
}
function printMT(){
  const p = PROFILES[cur], res = evalAll();
  const done = res.filter(r => r.statut === 'ok'), todo = res.filter(r => r.statut === 'todo' || r.statut === 'refus'), excl = res.filter(r => r.statut === 'ex');
  const tbl = (rows, cols) => rows.length ? '<table><tr>' + cols.map(c => '<th>' + c[0] + '</th>').join('') + '</tr>' + rows.map(r => '<tr>' + cols.map(c => '<td>' + c[1](r) + '</td>').join('') + '</tr>').join('') + '</table>' : '<p><em>Aucun.</em></p>';
  const name = r => byId[r.id].titre;
  const doc = document.getElementById('xwPrintDoc') || document.body.appendChild(Object.assign(document.createElement('div'), {id:'xwPrintDoc'}));
  doc.innerHTML = '<h1>Prévention — médecin traitant (CPAM)</h1><p>' + (p.sexe === 'F' ? 'Femme' : 'Homme') + ', ' + p.age + ' ans · édité le ' + fmt(REF) + '</p>' +
    '<h2>Fait</h2>' + tbl(done, [['Indicateur', name], ['Réalisé le', r => r.last ? fmt(r.last) : '—'], ['Origine', r => r.precision && r.precision.indexOf('Forçage') === 0 ? 'Forçage manuel' : 'Dossier']]) +
    '<h2>À faire — avant le ' + fmt(YEAR_END) + '</h2>' + tbl(todo, [['Indicateur', name], ['Précision', r => r.precision || ''], ['Refus', r => r.statut === 'refus' ? 'oui' : '']]) +
    (excl.length ? '<h2>Exclus</h2>' + tbl(excl, [['Indicateur', name], ['Motif', r => r.precision]]) : '') +
    '<p class="foot">Statut indicatif calculé d’après le dossier XMed ; le décompte officiel est établi par l’Assurance Maladie.</p>';
  document.body.classList.add('print-doc'); window.print(); setTimeout(() => document.body.classList.remove('print-doc'), 500);
}
function printXw(){ document.body.classList.add('print-xw'); window.print(); setTimeout(() => document.body.classList.remove('print-xw'), 500); }

root.addEventListener('click', e => {
  const t = e.target.closest('#xwTabs button'); if(t){ tab = t.dataset.t; render(); return; }
  const d = e.target.closest('#xwSeg button'); if(d){ dock = d.dataset.d; renderDock(); return; }
  if(e.target.id === 'xwS2Reset'){ e.preventDefault(); s2sim[cur] = {}; render(); return; }
  const a = e.target.closest('[data-act]');
  if(a){
    const act = a.dataset.act;
    if(act === 'Imprimer' || act === 'Impression PDF'){ if(tab === 'mt') printMT(); else printXw(); return; }
    if(tab === 'mt' && selId){
      if(act === 'Fait'){ const st = mtOf()[selId] = mtOf()[selId] || {}; st.done = iso(REF); st.refus = null; render(); return; }
      if(act === 'Annuler la saisie' || act === 'Annuler le forçage'){ delete mtOf()[selId]; render(); return; }
    }
    return;
  }
  const v = e.target.closest('tr[data-v]'); if(v){ vsel = +v.dataset.v; root.querySelectorAll('tr[data-v]').forEach(x => x.classList.remove('sel')); v.classList.add('sel'); return; }
  const r = e.target.closest('tr[data-id]');
  if(r && !e.target.closest('input')){ selId = r.dataset.id; root.querySelectorAll('tr[data-id]').forEach(x => x.classList.toggle('sel', x === r)); return; }
});
root.addEventListener('dblclick', e => { const r = e.target.closest('tr[data-id]'); if(r){ document.getElementById('modalBody').innerHTML = detail(byId[r.dataset.id], false); document.getElementById('modalBg').classList.add('on'); } });
root.addEventListener('change', e => {
  const m = e.target.dataset && e.target.dataset.mt;
  if(m){
    const id = e.target.dataset.id, st = mtOf()[id] = mtOf()[id] || {};
    if(m === 'prop') st.prop = e.target.checked;
    if(m === 'refus') st.refus = e.target.checked ? iso(REF) : null;
    if(m === 'excl'){ st.excl = e.target.checked; st.until = e.target.checked ? iso(addM(REF, 12)) : null; }   // délai de sortie par défaut : 12 mois
    if(m === 'until') st.until = e.target.value || null;
    selId = id; render(); return;
  }
  if(e.target.name === 'xwUnit'){ unit = e.target.value; render(); }
});
root.addEventListener('input', e => {
  const f = e.target.dataset && e.target.dataset.sim; if(!f) return;
  const o = s2sim[cur] = s2sim[cur] || {};
  if(e.target.type === 'checkbox') o[f] = e.target.checked;
  else {
    let v = e.target.value === '' ? null : parseFloat(e.target.value);
    if(v != null && (f === 'chol' || f === 'hdl') && unit === 'g') v = v * CHOL;   // saisie en g/L → calcul en mmol/L
    o[f] = v;
  }
  const res = document.getElementById('xwS2Res'); if(res) res.innerHTML = s2result();
  renderDock();
});
sel.addEventListener('change', () => { cur = sel.value; selId = null; vsel = 0; render(); });
render();
})();
