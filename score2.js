/* SCORE2 / SCORE2-OP — France = région « risque faible » (SCORE2 working group, Eur Heart J 2021;42:2439-2454, Fig. 5 ;
   SCORE2-OP working group, Eur Heart J 2021;42:2455-2467).
   - 40–69 ans : modèle SCORE2 (formule, recalibrée région « faible »). Vérifié sur les exemples publiés (5,9 % / 4,2 %).
   - 70–89 ans : SCORE2-OP, lu dans le tableau officiel (Figure 3, panneau A « low risk »), par tranches. */
(function(root){
'use strict';

/* ---- SCORE2 : coefficients du modèle, région « faible » ---- */
const K = {
  M:{a:.3742, s:.6012, b:.2777, c:.1458, h:-.2698, sa:-.0755, ba:-.0255, ca:-.0281, ha:.0426, S0:.9605, s1:-.5699, s2:.7476},
  F:{a:.4648, s:.7744, b:.3131, c:.1002, h:-.2606, sa:-.1088, ba:-.0277, ca:-.0226, ha:.0613, S0:.9776, s1:-.7380, s2:.7019}
};
function score2(sex, age, smoker, sbp, tchol, hdl){
  const k = K[sex], s = smoker ? 1 : 0;
  const ca = (age-60)/5, cs = (sbp-120)/20, ct = tchol-6, ch = (hdl-1.3)/0.5;
  const x = k.a*ca + k.s*s + k.b*cs + k.c*ct + k.h*ch + k.sa*s*ca + k.ba*cs*ca + k.ca*ct*ca + k.ha*ch*ca;
  const u = 1 - Math.pow(k.S0, Math.exp(x));                       // risque non recalibré
  return 100 * (1 - Math.exp(-Math.exp(k.s1 + k.s2*Math.log(-Math.log(1-u)))));   // recalibration région faible
}

/* ---- SCORE2-OP : Figure 3, panneau A (risque faible). Lignes PAS : 160-179, 140-159, 120-139, 100-119 ; colonnes non-HDL : 3.0-3.9, 4.0-4.9, 5.0-5.9, 6.0-6.9 ---- */
const OP = {
 70:{WNS:[[10,11,12,12],[9,9,10,10],[7,7,8,8],[6,6,6,7]], WS:[[17,18,19,20],[14,15,16,16],[11,12,13,14],[9,10,10,11]],
     MNS:[[15,16,18,19],[12,13,14,16],[10,11,12,13],[8,8,9,10]], MS:[[22,24,26,28],[18,19,21,23],[14,16,17,19],[12,13,14,15]]},
 75:{WNS:[[15,15,16,17],[13,13,14,15],[11,11,12,13],[9,10,10,11]], WS:[[21,22,23,24],[18,19,20,21],[15,16,17,18],[13,14,15,15]],
     MNS:[[19,21,24,27],[16,18,21,23],[14,15,18,20],[12,13,15,17]], MS:[[24,27,31,34],[21,23,26,30],[18,20,23,26],[15,17,19,22]]},
 80:{WNS:[[20,21,22,23],[18,19,20,21],[16,17,18,19],[15,15,16,17]], WS:[[25,26,28,29],[23,24,25,26],[20,21,22,23],[18,19,20,21]],
     MNS:[[23,27,32,37],[21,25,29,34],[19,22,26,31],[17,20,24,28]], MS:[[26,31,36,41],[24,28,33,38],[22,25,30,34],[19,23,27,31]]},
 85:{WNS:[[28,29,30,31],[26,27,28,29],[24,25,26,27],[23,24,25,26]], WS:[[31,32,33,34],[29,30,31,32],[27,28,29,30],[25,26,27,28]],
     MNS:[[29,35,42,49],[28,33,40,47],[26,32,38,45],[25,30,36,43]], MS:[[29,35,42,49],[27,33,40,47],[26,32,38,45],[25,30,36,43]]}
};
function scoreOP(sex, age, smoker, sbp, tchol, hdl){
  const nonHdl = tchol - hdl, flags = [];
  let r = sbp >= 160 ? 0 : sbp >= 140 ? 1 : sbp >= 120 ? 2 : 3;
  if(sbp >= 180) flags.push("PAS ≥ 180 : au-delà du tableau, risque sous-estimé");
  if(sbp < 100) flags.push("PAS < 100 : tranche 100–119 retenue");
  let c = nonHdl >= 6 ? 3 : nonHdl >= 5 ? 2 : nonHdl >= 4 ? 1 : 0;
  if(nonHdl >= 7) flags.push("Non-HDL ≥ 7,0 : au-delà du tableau, risque sous-estimé");
  if(nonHdl < 3) flags.push("Non-HDL < 3,0 : tranche 3,0–3,9 retenue");
  const band = age >= 85 ? 85 : age >= 80 ? 80 : age >= 75 ? 75 : 70;
  const key = (sex === 'F' ? 'W' : 'M') + (smoker ? 'S' : 'NS');
  return {value: OP[band][key][r][c], flags, cell:{band, rows:['160-179','140-159','120-139','100-119'][r], chol:['3,0–3,9','4,0–4,9','5,0–5,9','6,0–6,9'][c]}};
}

/* ---- Seuils des figures (légende vert / orange / rouge) ---- */
function classify(model, age, v){
  if(model==='OP') return v < 7.5 ? 0 : v < 15 ? 1 : 2;
  const [lo, hi] = age < 50 ? [2.5, 7.5] : [5, 10];
  return v < lo ? 0 : v < hi ? 1 : 2;
}
const CLASS_TXT = {
  SCORE2_lt50: ['< 2,5 %','2,5 à < 7,5 %','≥ 7,5 %'], SCORE2_50: ['< 5 %','5 à < 10 %','≥ 10 %'], OP: ['< 7,5 %','7,5 à < 15 %','≥ 15 %']
};

/* ---- Point d'entrée : applicabilité + calcul ---- */
function compute(p){
  // p : {sex:'M'|'F', age, smoker, sbp, tchol, hdl, diabetes, cvd, statin, severeHTA}
  const why = [];
  if(p.cvd) why.push("Maladie cardiovasculaire établie : le score ne s'applique pas (prévention secondaire).");
  if(p.severeHTA) why.push("Hypertension sévère (≥ 180/110) : score non applicable.");
  if(p.statin) why.push("Traitement hypolipémiant : score non applicable (valeurs sous traitement).");
  if(p.diabetes) why.push("Diabète : le SCORE2 est publié « sans diabète ». SCORE2-Diabetes (modèle distinct) est prévu, en attente du document de référence.");
  if(p.age < 40 || p.age > 89) why.push("Âge hors de la plage 40–89 ans.");
  if(why.length) return {ok:false, why, diabetes:!!p.diabetes};
  const miss = [];
  if(p.sbp==null) miss.push('PAS'); if(p.tchol==null) miss.push('cholestérol total'); if(p.hdl==null) miss.push('HDL');
  if(miss.length) return {ok:false, missing:miss, why:['Variable(s) manquante(s) : ' + miss.join(', ') + '.']};
  if(p.age <= 69){
    const v = score2(p.sex, p.age, p.smoker, p.sbp, p.tchol, p.hdl);
    const cls = classify('S2', p.age, v);
    return {ok:true, model:'SCORE2', value:v, shown:v.toFixed(1).replace('.',','), cls, thresholds: CLASS_TXT[p.age<50?'SCORE2_lt50':'SCORE2_50'], exact:true, flags:[]};
  }
  const o = scoreOP(p.sex, p.age, p.smoker, p.sbp, p.tchol, p.hdl);
  return {ok:true, model:'SCORE2-OP', value:o.value, shown:String(o.value), cls:classify('OP', p.age, o.value), thresholds:CLASS_TXT.OP, exact:false, flags:o.flags, cell:o.cell};
}

root.SCORE2ALGO = {compute, score2, scoreOP, K, OP};
if(typeof module !== 'undefined') module.exports = root.SCORE2ALGO;
})(typeof window !== 'undefined' ? window : globalThis);
