/* Interface du calculateur SCORE2 / SCORE2-OP et documentation de la méthode (utilise score2.js) */
(function(){
const A = window.SCORE2ALGO;
const COL = ['#2e7d32', '#e0a100', '#b3261e'];
const LAB = ['Vert', 'Orange', 'Rouge'];

function calcHTML(){
  return '<div class="card" style="background:#fafcfd"><h3 class="s" style="margin-top:0">Calculateur (valeurs de simulation, rien n’est écrit au dossier)</h3>'+
   '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;align-items:end">'+
   '<label>Sexe<br><select data-f="sex"><option value="M">Homme</option><option value="F">Femme</option></select></label>'+
   '<label>Âge (ans)<br><input data-f="age" type="number" min="18" max="100" value="50" style="width:90px"></label>'+
   '<label>PAS (mmHg)<br><input data-f="sbp" type="number" min="60" max="260" value="140" style="width:90px"></label>'+
   '<label>Cholestérol total (mmol/L)<br><input data-f="tchol" type="number" step="0.1" min="1" max="15" value="5.5" style="width:90px"></label>'+
   '<label>HDL (mmol/L)<br><input data-f="hdl" type="number" step="0.1" min="0.3" max="4" value="1.3" style="width:90px"></label>'+
   '<label><input data-f="smoker" type="checkbox" checked> Fumeur</label>'+
   '<label><input data-f="diabetes" type="checkbox"> Diabète</label>'+
   '<label><input data-f="cvd" type="checkbox"> Maladie CV établie</label>'+
   '<label><input data-f="statin" type="checkbox"> Hypolipémiant</label>'+
   '<label><input data-f="severeHTA" type="checkbox"> HTA sévère (≥ 180/110)</label></div>'+
   '<div class="s2out" style="margin-top:14px"></div>'+
   '<p class="mut" style="font-size:12px;margin:8px 0 0">Valeurs par défaut = exemple de l’article SCORE2 (homme, 50 ans, fumeur, PAS 140, CT 5,5, HDL 1,3 → 5,9 % en région à risque faible).</p></div>';
}
function mount(el){
  el.innerHTML = calcHTML();
  const out = el.querySelector('.s2out');
  function read(){
    const g = f => el.querySelector('[data-f='+f+']');
    const n = f => { const v = parseFloat(g(f).value); return isNaN(v) ? null : v; };
    return {sex:g('sex').value, age:n('age'), smoker:g('smoker').checked, sbp:n('sbp'), tchol:n('tchol'), hdl:n('hdl'),
            diabetes:g('diabetes').checked, cvd:g('cvd').checked, statin:g('statin').checked, severeHTA:g('severeHTA').checked};
  }
  function run(){
    const r = A.compute(read());
    if(!r.ok){ out.innerHTML = '<div class="q" style="margin:0"><strong>Score non calculé.</strong><ul>'+r.why.map(w=>'<li>'+w+'</li>').join('')+'</ul></div>'; return; }
    out.innerHTML =
     '<div style="display:flex;gap:18px;align-items:center;flex-wrap:wrap">'+
     '<div style="font-size:42px;font-weight:700;color:'+COL[r.cls]+'">'+r.shown+' %</div>'+
     '<div><strong>'+r.model+'</strong> — risque cardiovasculaire (fatal et non fatal) à 10 ans, région France = risque faible<br>'+
     '<span class="badge" style="background:'+COL[r.cls]+';color:#fff">'+LAB[r.cls]+'</span> '+
     '<span class="mut">repères : vert '+r.thresholds[0]+' · orange '+r.thresholds[1]+' · rouge '+r.thresholds[2]+'</span></div></div>'+
     (r.exact ? '<p class="mut" style="font-size:12.5px">Calcul par la formule du modèle (valeur à la décimale).</p>'
              : '<p class="mut" style="font-size:12.5px">Valeur lue dans le tableau officiel SCORE2-OP : tranche âge '+r.cell.band+'–'+(r.cell.band+4)+' ans, PAS '+r.cell.rows+' mmHg, non-HDL '+r.cell.chol+' mmol/L ; arrondie à l’entier, donnée par tranches.</p>')+
     (r.flags.length ? '<div class="q" style="margin:6px 0 0">'+r.flags.join('<br>')+'</div>' : '');
  }
  el.addEventListener('input', run); el.addEventListener('change', run); run();
}

function docHTML(){
  const f = (v, d) => v.toFixed(d).replace('.', ',');
  const row = (lab, key, d) => '<tr><td>'+lab+'</td><td>'+f(A.K.M[key], d)+'</td><td>'+f(A.K.F[key], d)+'</td></tr>';
  const exM = A.score2('M', 50, 1, 140, 5.5, 1.3), exF = A.score2('F', 50, 1, 140, 5.5, 1.3);
  return '<h3 class="s">Méthode (d’après les deux articles fournis)</h3>'+
   '<table><tr><th>Modèle</th><th>Âges</th><th>Source</th><th>Nature du calcul</th></tr>'+
   '<tr><td>SCORE2</td><td>40–69 ans</td><td>Eur Heart J 2021;42:2439–2454</td><td>Formule du modèle, recalibrée région <strong>risque faible</strong> (France)</td></tr>'+
   '<tr><td>SCORE2-OP</td><td>70–89 ans</td><td>Eur Heart J 2021;42:2455–2467</td><td>Lecture du tableau officiel (Figure 3, panneau A, risque faible) : tranches, entiers</td></tr></table>'+
   '<p><strong>Région :</strong> la France figure dans la région « risque faible » (SCORE2, Figure 5).</p>'+
   '<p><strong>Variables centrées :</strong> cage = (âge − 60) / 5 ; csbp = (PAS − 120) / 20 ; ctchol = CT − 6 ; chdl = (HDL − 1,3) / 0,5 ; fumeur = 0/1.</p>'+
   '<p><strong>Étapes :</strong> x = somme des termes ci-dessous ; risque brut = 1 − S0<sup>exp(x)</sup> ; risque final = 1 − exp(−exp(scale1 + scale2 · ln(−ln(1 − risque brut)))).</p>'+
   '<table><tr><th>Terme</th><th>Homme</th><th>Femme</th></tr>'+
   row('cage','a',4)+row('fumeur','s',4)+row('csbp','b',4)+row('ctchol','c',4)+row('chdl','h',4)+
   row('fumeur × cage','sa',4)+row('csbp × cage','ba',4)+row('ctchol × cage','ca',4)+row('chdl × cage','ha',4)+
   row('S0 (survie de base)','S0',4)+row('scale1 (risque faible)','s1',4)+row('scale2 (risque faible)','s2',4)+'</table>'+
   '<h3 class="s">Vérification</h3>'+
   '<table><tr><th>Exemple publié (résumé de l’article)</th><th>Valeur de l’article</th><th>Valeur calculée ici</th></tr>'+
   '<tr><td>Homme 50 ans, fumeur, PAS 140, CT 5,5, HDL 1,3 — risque faible</td><td>5,9 %</td><td><strong>'+f(exM,2)+' %</strong></td></tr>'+
   '<tr><td>Femme 50 ans, mêmes valeurs — risque faible</td><td>4,2 %</td><td><strong>'+f(exF,2)+' %</strong></td></tr></table>'+
   '<p class="mut">Les valeurs ci-dessus concordent. Les coefficients ne figurent pas dans le corps des articles (supplément en ligne) : ils sont contrôlés par ces exemples et par les cellules du tableau SCORE2 (écart d’environ 1 point au plus, dû à l’arrondi et aux tranches). Pour SCORE2-OP, aucune formule n’est utilisée : le tableau officiel est lu tel quel.</p>'+
   '<p class="mut">Remarque : l’exemple chiffré du texte de l’article SCORE2-OP (homme de 75 ans fumeur, PAS 150, non-HDL 4,5 : 16 % en risque faible ; femme : 14 %) ne correspond pas aux cellules du tableau pour le même profil (23 % et 19 %). Le tableau est retenu ; l’écart est à faire confirmer par le supplément.</p>';
}

document.querySelectorAll('.s2calc').forEach(mount);
document.querySelectorAll('.s2doc').forEach(e => { e.innerHTML = docHTML(); });
})();
