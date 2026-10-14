/* Interface du calculateur SCORE2 / SCORE2-OP / SCORE2-Diabetes et documentation de la méthode (utilise score2.js) */
(function(){
const A = window.SCORE2ALGO;
const COL = ['#2e7d32', '#e0a100', '#b3261e'];
const LAB = ['Vert', 'Orange', 'Rouge'];
const f2 = (v, d) => v.toFixed(d).replace('.', ',');

function calcHTML(){
  return '<div class="card" style="background:#fafcfd"><h3 class="s" style="margin-top:0">Calculateur (valeurs de simulation, rien n’est écrit au dossier)</h3>'+
   '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;align-items:end">'+
   '<label>Sexe<br><select data-f="sex"><option value="M">Homme</option><option value="F">Femme</option></select></label>'+
   '<label>Âge (ans)<br><input data-f="age" type="number" min="18" max="100" value="50" style="width:90px"></label>'+
   '<label>PAS (mmHg)<br><input data-f="sbp" type="number" min="60" max="260" value="140" style="width:90px"></label>'+
   '<label>Cholestérol total (mmol/L)<br><input data-f="tchol" type="number" step="0.1" min="1" max="15" value="5.5" style="width:90px"></label>'+
   '<label>HDL (mmol/L)<br><input data-f="hdl" type="number" step="0.1" min="0.3" max="4" value="1.3" style="width:90px"></label>'+
   '<label><input data-f="smoker" type="checkbox" checked> Fumeur</label>'+
   '<label><input data-f="cvd" type="checkbox"> Maladie CV établie</label>'+
   '<label><input data-f="statin" type="checkbox"> Hypolipémiant</label>'+
   '<label><input data-f="severeHTA" type="checkbox"> HTA sévère (≥ 180/110)</label>'+
   '<label><input data-f="diabetes" type="checkbox"> Diabète</label></div>'+
   '<div class="dmbox" style="display:none;margin-top:10px;padding:10px;border:1px dashed #00769e;border-radius:8px">'+
   '<strong>SCORE2-Diabetes</strong> — variables du diabète<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px;align-items:end;margin-top:6px">'+
   '<label>Code CIM10 du diabète<br><select data-f="dmCode"><option value="E11">E11 — type 2</option><option value="E10">E10 — type 1</option><option value="E13">E13 — autre diabète</option><option value="">non renseigné</option></select></label>'+
   '<label>Âge au diagnostic (ans)<br><input data-f="ageDx" type="number" min="10" max="90" value="55" style="width:90px"></label>'+
   '<label>HbA1c<br><input data-f="hba1c" type="number" step="0.1" value="58" style="width:80px"> <select data-f="hunit"><option value="mmol">mmol/mol</option><option value="pct">%</option></select></label>'+
   '<label>DFG estimé (mL/min/1,73 m²)<br><input data-f="egfr" type="number" min="5" max="150" value="80" style="width:90px"></label></div></div>'+
   '<div class="s2out" style="margin-top:14px"></div>'+
   '<p class="mut" style="font-size:12px;margin:8px 0 0">Valeurs par défaut = exemple de l’article SCORE2 (homme, 50 ans, fumeur, PAS 140, CT 5,5, HDL 1,3 → 5,9 % en région à risque faible).</p></div>';
}
function mount(el){
  el.innerHTML = calcHTML();
  const out = el.querySelector('.s2out'), box = el.querySelector('.dmbox');
  const g = f => el.querySelector('[data-f='+f+']');
  const n = f => { const v = parseFloat(g(f).value); return isNaN(v) ? null : v; };
  function read(){
    const hb = n('hba1c');
    return {sex:g('sex').value, age:n('age'), smoker:g('smoker').checked, sbp:n('sbp'), tchol:n('tchol'), hdl:n('hdl'),
            diabetes:g('diabetes').checked, dmCode:g('dmCode').value, cvd:g('cvd').checked, statin:g('statin').checked, severeHTA:g('severeHTA').checked,
            ageDx:n('ageDx'), egfr:n('egfr'), hba1c: hb == null ? null : (g('hunit').value === 'pct' ? A.hba1cPctToMmol(hb) : hb)};
  }
  function run(){
    const inp = read();
    box.style.display = inp.diabetes ? 'block' : 'none';
    const r = A.compute(inp);
    if(!r.ok){ out.innerHTML = '<div class="q" style="margin:0"><strong>Score non calculé.</strong><ul>'+r.why.map(w=>'<li>'+w+'</li>').join('')+'</ul></div>'; return; }
    const color = r.cls == null ? '#37474f' : COL[r.cls];
    out.innerHTML =
     '<div style="display:flex;gap:18px;align-items:center;flex-wrap:wrap">'+
     '<div style="font-size:42px;font-weight:700;color:'+color+'">'+r.shown+' %</div>'+
     '<div><strong>'+r.model+'</strong> — risque cardiovasculaire (fatal et non fatal) à 10 ans, région France = risque faible<br>'+
     (r.cls == null ? '<span class="badge" style="background:#eceff1;color:#37474f">Pas de seuil défini dans l’article</span>'
       : '<span class="badge" style="background:'+COL[r.cls]+';color:#fff">'+LAB[r.cls]+'</span> <span class="mut">repères : vert '+r.thresholds[0]+' · orange '+r.thresholds[1]+' · rouge '+r.thresholds[2]+'</span>')+'</div></div>'+
     (r.exact ? '<p class="mut" style="font-size:12.5px">Calcul par la formule du modèle (valeur à la décimale).</p>'
              : r.cell ? '<p class="mut" style="font-size:12.5px">Valeur lue dans le tableau officiel SCORE2-OP : tranche âge '+r.cell.band+'–'+(r.cell.band+4)+' ans, PAS '+r.cell.rows+' mmHg, non-HDL '+r.cell.chol+' mmol/L ; arrondie à l’entier, donnée par tranches.</p>' : '')+
     (r.flags.length ? '<div class="q" style="margin:6px 0 0">'+r.flags.join('<br>')+'</div>' : '');
  }
  el.addEventListener('input', run); el.addEventListener('change', run); run();
}

function docHTML(){
  const row = (lab, key, d) => '<tr><td>'+lab+'</td><td>'+f2(A.K.M[key], d)+'</td><td>'+f2(A.K.F[key], d)+'</td></tr>';
  const exM = A.score2('M', 50, 1, 140, 5.5, 1.3), exF = A.score2('F', 50, 1, 140, 5.5, 1.3);
  const dRow = (lab, kk) => '<tr><td>'+lab+'</td><td>'+(A.DM.M[kk] === undefined ? '' : f2(A.DM.M[kk], 2))+'</td><td>'+(A.DM.F[kk] === undefined ? '' : f2(A.DM.F[kk], 2))+'</td></tr>';
  const dm = (sx, dx, hb, eg) => A.scoreDiabetes(sx, 60, 0, 140, 5.5, 1.3, dx, hb, eg);
  const ver = [['Homme 60 ans, non fumeur, PAS 140, CT 5,5, HDL 1,3 — diabète diagnostiqué à 60 ans, HbA1c 50, DFG 90','M',60,50,90,8.4],
               ['Idem — diabète diagnostiqué à 50 ans, HbA1c 70, DFG 60','M',50,70,60,12.9],
               ['Femme, mêmes valeurs — diabète à 60 ans, HbA1c 50, DFG 90','F',60,50,90,6.1],
               ['Femme — diabète à 50 ans, HbA1c 70, DFG 60','F',50,70,60,9.8]];
  return '<h3 class="s">Méthode (d’après les trois articles fournis)</h3>'+
   '<table><tr><th>Modèle</th><th>Population</th><th>Source</th><th>Nature du calcul</th></tr>'+
   '<tr><td>SCORE2</td><td>40–69 ans, sans diabète</td><td>Eur Heart J 2021;42:2439–2454</td><td>Formule du modèle, recalibrée région <strong>risque faible</strong> (France)</td></tr>'+
   '<tr><td>SCORE2-OP</td><td>70–89 ans, sans diabète</td><td>Eur Heart J 2021;42:2455–2467</td><td>Lecture du tableau officiel (Figure 3, panneau A, risque faible) : tranches, entiers</td></tr>'+
   '<tr><td>SCORE2-Diabetes</td><td>40–79 ans, diabète de type 2, sans maladie CV</td><td>Eur Heart J 2023;44:2544–2556</td><td>Estimation à partir des rapports de risque du Tableau 2 (arrondis à 2 décimales) ; mêmes facteurs de recalibration que SCORE2</td></tr></table>'+
   '<p><strong>Région :</strong> la France figure dans la région « risque faible » (SCORE2, Figure 5).</p>'+
   '<h3 class="s">SCORE2 — formule</h3>'+
   '<p><strong>Variables centrées :</strong> cage = (âge − 60) / 5 ; csbp = (PAS − 120) / 20 ; ctchol = CT − 6 ; chdl = (HDL − 1,3) / 0,5 ; fumeur = 0/1.</p>'+
   '<p><strong>Étapes :</strong> x = somme des termes ci-dessous ; risque brut = 1 − S0<sup>exp(x)</sup> ; risque final = 1 − exp(−exp(scale1 + scale2 · ln(−ln(1 − risque brut)))).</p>'+
   '<table><tr><th>Terme</th><th>Homme</th><th>Femme</th></tr>'+
   row('cage','a',4)+row('fumeur','s',4)+row('csbp','b',4)+row('ctchol','c',4)+row('chdl','h',4)+
   row('fumeur × cage','sa',4)+row('csbp × cage','ba',4)+row('ctchol × cage','ca',4)+row('chdl × cage','ha',4)+
   row('S0 (survie de base)','S0',4)+row('scale1 (risque faible)','s1',4)+row('scale2 (risque faible)','s2',4)+'</table>'+
   '<h3 class="s">SCORE2-Diabetes — modèle</h3>'+
   '<p>Même structure que SCORE2, avec les rapports de risque du <strong>Tableau 2</strong> de l’article (exponentielle des coefficients ; effet principal et terme d’interaction avec l’âge). Centrages : âge 60 ans, PAS 120, CT 6, HDL 1,3, <strong>âge au diagnostic 50 ans</strong> (par 5 ans), <strong>HbA1c 31 mmol/mol</strong> (1 ET = 9,34), <strong>ln(DFG) 4,5</strong> (1 ET = 0,15). Survie de base médiane : 0,9625 (hommes), 0,9795 (femmes). Recalibration : mêmes facteurs que SCORE2 (l’article le précise).</p>'+
   '<table><tr><th>Rapport de risque (effet principal)</th><th>Homme</th><th>Femme</th></tr>'+
   dRow('Âge (par 5 ans)','a')+dRow('Tabagisme actuel','smk')+dRow('PAS (par 20 mmHg)','sbp')+dRow('Cholestérol total (par 1 mmol/L)','tc')+dRow('HDL (par 0,5 mmol/L)','hdl')+dRow('Antécédent de diabète','dm')+
   dRow('Âge au diagnostic (par 5 ans)','dx')+dRow('HbA1c (par ET)','hb')+dRow('ln DFG (par ET)','eg')+dRow('ln DFG² (terme quadratique)','eg2')+'</table>'+
   '<table><tr><th>Terme d’interaction avec l’âge</th><th>Homme</th><th>Femme</th></tr>'+
   dRow('Tabagisme × âge','smkA')+dRow('PAS × âge','sbpA')+dRow('Cholestérol total × âge','tcA')+dRow('HDL × âge','hdlA')+dRow('Diabète × âge','dmA')+dRow('HbA1c × âge','hbA')+dRow('ln DFG × âge','egA')+'</table>'+
   '<h3 class="s">Vérification</h3>'+
   '<table><tr><th>Exemple publié</th><th>Valeur de l’article</th><th>Valeur calculée ici</th></tr>'+
   '<tr><td>SCORE2 — homme 50 ans, fumeur, PAS 140, CT 5,5, HDL 1,3 (risque faible)</td><td>5,9 %</td><td><strong>'+f2(exM,2)+' %</strong></td></tr>'+
   '<tr><td>SCORE2 — femme, mêmes valeurs (risque faible)</td><td>4,2 %</td><td><strong>'+f2(exF,2)+' %</strong></td></tr>'+
   ver.map(v => '<tr><td>SCORE2-Diabetes — '+v[0]+' (risque faible)</td><td>'+f2(v[5],1)+' %</td><td><strong>'+f2(dm(v[1],v[2],v[3],v[4]),2)+' %</strong></td></tr>').join('')+'</table>'+
   '<p class="mut">SCORE2 : concordance. SCORE2-Diabetes : les rapports de risque du tableau sont arrondis à deux décimales, ce qui donne une <strong>sous-estimation de 0,2 à 0,5 point</strong> par rapport aux valeurs publiées. Le résultat est donc affiché « ≈ » avec cet avertissement, en attendant les coefficients exacts du supplément en ligne (annexes 1 et 2 de l’article). Aucun ajustement n’a été fait pour « coller » aux exemples.</p>'+
   '<p class="mut">Pour SCORE2-OP, aucune formule n’est utilisée : le tableau officiel est lu tel quel. Le texte de l’article SCORE2-OP (homme de 75 ans fumeur, PAS 150, non-HDL 4,5 : 16 % ; femme : 14 %) ne correspond pas aux cellules du tableau pour le même profil (23 % et 19 %) : le tableau est retenu.</p>'+
   '<p class="mut">Seuils vert / orange / rouge : ceux des figures de SCORE2 et SCORE2-OP. L’article SCORE2-Diabetes ne définit pas de seuils d’action (il évalue des classes &lt; 5, 5–10, 10–15, 15–20, &gt; 25 % pour des comparaisons statistiques) : aucune couleur n’est donc affichée pour ce modèle.</p>';
}

document.querySelectorAll('.s2calc').forEach(mount);
document.querySelectorAll('.s2doc').forEach(e => { e.innerHTML = docHTML(); });
})();
