
document.querySelector('.menu')?.addEventListener('click',()=>document.querySelector('.links').classList.toggle('open'));
const cookie=document.querySelector('.cookie'); if(!localStorage.getItem('hc-cookie')) cookie?.classList.add('show');
document.querySelectorAll('[data-cookie]').forEach(b=>b.onclick=()=>{localStorage.setItem('hc-cookie',b.dataset.cookie);cookie.classList.remove('show')});
function rm(){let w=+document.querySelector('#rmWeight').value,r=+document.querySelector('#rmReps').value;if(!w||!r)return;document.querySelector('#rmOut').textContent='1RM estimé : '+Math.round(w*(1+r/30))+' kg'}
function pace(){let d=+document.querySelector('#distance').value,t=document.querySelector('#time').value.split(':').map(Number);if(!d||t.length<2)return;let sec=t.length===3?t[0]*3600+t[1]*60+t[2]:t[0]*60+t[1],p=sec/d,m=Math.floor(p/60),s=Math.round(p%60).toString().padStart(2,'0');document.querySelector('#paceOut').textContent='Allure moyenne : '+m+':'+s+' / km'}



/* ============================================================
   v2 - CALCULATEURS ET ESPACE MEMBRE
   ============================================================ */
function hcPace(sPerKm){
  const m=Math.floor(sPerKm/60), s=Math.round(sPerKm%60).toString().padStart(2,'0');
  return m+':'+s+' /km';
}
/* Zones d'allure : modele indicatif etabli a partir d'une performance recente.
   Ne remplace pas un test de terrain encadre. */
function hcZonesDESACTIVE(){
  const el=document.querySelector('#zOut'); if(!el) return;
  const raw=document.querySelector('#zTime').value.trim();
  const t=raw.split(':').map(Number);
  if(!raw||t.some(isNaN)||t.length<2){ el.textContent='Renseigne un temps valide, par exemple 22:00 ou 0:22:00.'; return; }
  const sec=t.length===3?t[0]*3600+t[1]*60+t[2]:t[0]*60+t[1];
  const km=parseFloat(document.querySelector('#zDist').value)||5;
  const pace=sec/km;
  const vma=3600/pace*1.06;
  const zones=[
    ['Endurance fondamentale',0.60,0.70,'Base aerobie, allure de conversation'],
    ['Endurance active',0.70,0.78,'Footing soutenu regulier'],
    ['Allure specifique 10 km',0.78,0.83,'Travail au seuil bas'],
    ['Allure specifique 5 km',0.83,0.89,'Seuil, effort soutenu'],
    ['Fractionne 3000 m',0.89,0.95,'VO2 max, intervalles courts'],
    ['Vitesse et cote',0.95,1.05,'Puissance, repetitions tres courtes']
  ];
  const lines=zones.map(function(z){
    const a=vma*z[1], b=vma*z[2];
    return '<div style="margin-bottom:6px"><b>'+z[0]+'</b> &nbsp;'+hcPace(3600/b)+' a '+hcPace(3600/a)+
           ' <span class="muted">('+a.toFixed(1)+' a '+b.toFixed(1)+' km/h) - '+z[3]+'</span></div>';
  });
  el.innerHTML='<div style="margin-bottom:10px">VMA estimee : <b>'+vma.toFixed(1)+' km/h</b></div>'+lines.join('');
}

/* Records personnels : stockes uniquement dans le navigateur de l'utilisateur. */
var HC_PR='hc-records';
function hcLoadPR(){ try{ return JSON.parse(localStorage.getItem(HC_PR))||[] }catch(e){ return [] } }
function hcDrawPR(){
  var tb=document.querySelector('#prBody'); if(!tb) return;
  var rows=hcLoadPR();
  if(!rows.length){ tb.innerHTML='<tr><td colspan="4" class="muted">Aucun record enregistre pour le moment.</td></tr>'; return; }
  tb.innerHTML=rows.map(function(r,i){
    return '<tr><td>'+r.dist+'</td><td>'+r.time+'</td><td>'+r.date+'</td>'+
           '<td><button type="button" class="pr-del" data-i="'+i+'" style="background:none;border:0;color:#ff9a9a;cursor:pointer;font-weight:800">Supprimer</button></td></tr>';
  }).join('');
  tb.querySelectorAll('.pr-del').forEach(function(b){
    b.onclick=function(){ var r=hcLoadPR(); r.splice(parseInt(b.dataset.i,10),1); localStorage.setItem(HC_PR,JSON.stringify(r)); hcDrawPR(); };
  });
}
function hcAddPR(){
  var d=document.querySelector('#prDist'), t=document.querySelector('#prTime');
  if(!d||!t||!d.value.trim()||!t.value.trim()) return;
  var rows=hcLoadPR();
  rows.push({dist:d.value.trim(),time:t.value.trim(),date:new Date().toLocaleDateString('fr-FR')});
  localStorage.setItem(HC_PR,JSON.stringify(rows));
  d.value=''; t.value=''; hcDrawPR();
}

/* ============================================================
   v2 - ESPACE MEMBRE (interface de demonstration)
   Comptes et commandes enregistres sur le serveur (Cloudflare D1).
   ============================================================ */
/* ---- aide : appels serveur ---- */
var HC = (function(){
  var cache = null;
  function api(path, body){
    return fetch(path, {method:'POST', credentials:'same-origin', headers:{'content-type':'application/json'}, body:JSON.stringify(body||{})})
      .then(function(r){ return r.json().catch(function(){ return {}; }).then(function(d){ if(!r.ok) throw new Error(d.error||'Une erreur est survenue.'); return d; }); })
      .catch(function(e){ if(e instanceof TypeError) throw new Error('Impossible de joindre le serveur. Réessaie dans un instant.'); throw e; });
  }
  function me(force){
    if(cache && !force) return cache;
    cache = fetch('/api/me', {credentials:'same-origin'}).then(function(r){ return r.ok ? r.json() : {user:null,orders:[]}; }).catch(function(){ return {user:null,orders:[]}; });
    return cache;
  }
  function esc(t){ return String(t==null?'':t).replace(/[&<>"']/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  return {api:api, me:me, esc:esc};
})();

function hcTab(name){
  document.querySelectorAll('[data-tab]').forEach(function(s){ s.classList.toggle('panel-off', s.dataset.tab!==name); });
  document.querySelectorAll('[data-tabbtn]').forEach(function(b){ b.classList.toggle('on', b.dataset.tabbtn===name); });
}
function hcMsg(id,txt){ var e=document.querySelector(id); if(e) e.textContent=txt; }

document.addEventListener('DOMContentLoaded',function(){
  document.querySelectorAll('[data-tabbtn]').forEach(function(b){ b.onclick=function(){ hcTab(b.dataset.tabbtn); }; });

  var pa=document.querySelector('#prAdd'); if(pa) pa.onclick=hcAddPR;
  hcDrawPR();

  /* Comptes reels : appels au serveur (/api) */
  var rb=document.querySelector('#rBtn'); if(rb) rb.onclick=function(){
    var p=document.querySelector('#rPwd').value, p2=document.querySelector('#rPwd2').value, e=document.querySelector('#rEmail').value.trim();
    if(!document.querySelector('#rPrenom').value.trim()||!document.querySelector('#rNom').value.trim()){ hcMsg('#rMsg','Renseigne ton prénom et ton nom.'); return; }
    if(e.indexOf('@')<0){ hcMsg('#rMsg','Renseigne une adresse email valide.'); return; }
    if(p.length<8){ hcMsg('#rMsg','Le mot de passe doit contenir au moins 8 caractères.'); return; }
    if(p!==p2){ hcMsg('#rMsg','Les deux mots de passe ne correspondent pas.'); return; }
    rb.disabled=true; hcMsg('#rMsg','Création du compte…');
    HC.api('/api/register',{prenom:document.querySelector('#rPrenom').value,nom:document.querySelector('#rNom').value,email:e,tel:document.querySelector('#rTel').value,password:p})
      .then(function(){ location.href='espace.html'; })
      .catch(function(err){ rb.disabled=false; hcMsg('#rMsg',err.message); });
  };

  var cb=document.querySelector('#cBtn'); if(cb) cb.onclick=function(){
    var e=document.querySelector('#cEmail').value.trim();
    if(e.indexOf('@')<0){ hcMsg('#cMsg','Renseigne une adresse email valide.'); return; }
    cb.disabled=true; hcMsg('#cMsg','Connexion…');
    HC.api('/api/login',{email:e,password:document.querySelector('#cPwd').value})
      .then(function(){ location.href='espace.html'; })
      .catch(function(err){ cb.disabled=false; hcMsg('#cMsg',err.message); });
  };

  var fl=document.querySelector('#forgotLink'); if(fl) fl.onclick=function(ev){
    ev.preventDefault();
    hcMsg('#cMsg','Mot de passe oublié ? Écris-moi sur WhatsApp (07 67 92 71 63) ou à castillovictor77600@gmail.com : je le réinitialise pour toi.');
  };

  /* déjà connecté : on envoie directement vers Mon espace */
  if(document.querySelector('#rBtn')) HC.me().then(function(d){ if(d.user) location.href='espace.html'; });
});

/* v3 — compteur de personnes coachées */
(function(){
  var KEY='hc-coached-count';
  var BASE=21;
  var n=parseInt(localStorage.getItem(KEY)||BASE,10);
  if(isNaN(n)||n<BASE) n=BASE;
  var el=document.getElementById('coachedCount');
  var fill=document.getElementById('counterFill');
  if(el){
    el.textContent=n;
    if(fill){ setTimeout(function(){ fill.style.width=Math.min(100,(n/50)*100)+'%'; },150); }
  }
  window.hcIncrementCoached=function(){
    n=n+1; localStorage.setItem(KEY,n);
    if(el) el.textContent=n;
    if(fill) fill.style.width=Math.min(100,(n/50)*100)+'%';
    return n;
  };
})();

/* v3 — codes à usage unique (démo locale) */
(function(){
  var KEY='hc-used-codes';
  function used(){ try{ return JSON.parse(localStorage.getItem(KEY)||'[]'); }catch(e){ return []; } }
  window.hcRedeemCode=function(code){
    code=(code||'').trim().toUpperCase();
    if(!code) return {ok:false,msg:'Entre un code.'};
    if(used().indexOf(code)!==-1) return {ok:false,msg:'Ce code a déjà été utilisé.'};
    var u=used(); u.push(code); localStorage.setItem(KEY,JSON.stringify(u));
    return {ok:true,msg:'Code validé. Ton accès est ouvert.'};
  };
})();

document.getElementById('giftBtn')?.addEventListener('click',function(){
  var c=document.getElementById('giftCode').value;
  var r=window.hcRedeemCode(c);
  var out=document.getElementById('giftOut');
  out.textContent=r.msg; out.style.color=r.ok?'var(--green)':'#ff7a7a';
  if(r.ok && window.hcIncrementCoached) window.hcIncrementCoached();
});


/* ============================================================
   v5 — CHARGE DE TRAVAIL (1 à 20 répétitions)
   Table de pourcentages moyens du 1RM selon le nombre de reps,
   d'apres les cadrages de la litterature en musculation.
   ============================================================ */
var HC_REPS_TABLE = [
  {reps:1,  pct:100, min:100, max:100, zone:"Force maximale"},
  {reps:2,  pct:95,  min:92,  max:97,  zone:"Force maximale"},
  {reps:3,  pct:92,  min:89,  max:94,  zone:"Force maximale"},
  {reps:4,  pct:89,  min:86,  max:92,  zone:"Force maximale"},
  {reps:5,  pct:86,  min:83,  max:89,  zone:"Force"},
  {reps:6,  pct:83,  min:80,  max:86,  zone:"Force"},
  {reps:7,  pct:80,  min:77,  max:83,  zone:"Force / hypertrophie"},
  {reps:8,  pct:78,  min:74,  max:81,  zone:"Hypertrophie"},
  {reps:9,  pct:75,  min:71,  max:79,  zone:"Hypertrophie"},
  {reps:10, pct:73,  min:68,  max:77,  zone:"Hypertrophie"},
  {reps:11, pct:70,  min:65,  max:75,  zone:"Hypertrophie"},
  {reps:12, pct:68,  min:63,  max:73,  zone:"Hypertrophie"},
  {reps:13, pct:66,  min:61,  max:71,  zone:"Hypertrophie / endurance"},
  {reps:14, pct:64,  min:59,  max:69,  zone:"Hypertrophie / endurance"},
  {reps:15, pct:62,  min:57,  max:67,  zone:"Endurance de force"},
  {reps:16, pct:60,  min:55,  max:65,  zone:"Endurance de force"},
  {reps:17, pct:59,  min:54,  max:63,  zone:"Endurance de force"},
  {reps:18, pct:57,  min:52,  max:61,  zone:"Endurance de force"},
  {reps:19, pct:56,  min:51,  max:60,  zone:"Endurance musculaire"},
  {reps:20, pct:54,  min:50,  max:58,  zone:"Endurance musculaire"}
];

function hcRounded(x){ return Math.round(x*2)/2; }

function hcEstimate1RM(weight, reps){
  if(!weight || !reps || reps < 1) return 0;
  if(reps === 1) return weight;
  var epley = weight * (1 + reps/30);
  var brzycki = weight * (36 / (37 - reps));
  return (epley + brzycki) / 2;
}

function hcRepsTable(){
  var out = document.getElementById('rmTable');
  var res = document.getElementById('rmOut');
  if(!out) return;
  var w = parseFloat(document.getElementById('rmWeight').value);
  var r = parseInt(document.getElementById('rmReps').value, 10);
  if(!w || !r || r < 1 || r > 20){
    if(res){ res.style.color = '#ff9a9a'; res.textContent = 'Renseigne une charge valide et un nombre de repetitions entre 1 et 20.'; }
    out.innerHTML = '';
    return;
  }
  var rm = hcEstimate1RM(w, r);
  if(res){ res.style.color = 'var(--green)'; res.textContent = '1RM estime : ' + hcRounded(rm) + ' kg';
    if(window.HC_APERCU_FORCE) window.HC_APERCU_FORCE(hcRounded(rm)); }
  var rows = HC_REPS_TABLE.map(function(l){
    var charge = rm * l.pct / 100;
    var cMin = rm * l.min / 100, cMax = rm * l.max / 100;
    var cls = (l.reps === r) ? ' class="rowactive"' : '';
    return '<tr'+cls+'><td><b>'+l.reps+'</b></td>'+
           '<td>'+hcRounded(charge)+' kg</td>'+
           '<td>'+l.min+' - '+l.max+' % <span class="muted">('+hcRounded(cMin)+' - '+hcRounded(cMax)+' kg)</span></td>'+
           '<td class="muted">'+l.zone+'</td></tr>';
  }).join('');
  out.innerHTML = '<div style="overflow-x:auto;margin-top:18px">'+
    '<table class="rmtab"><thead><tr><th>Rep.</th><th>Charge de travail</th><th>Plage conseillee</th><th>Objectif</th></tr></thead><tbody>'+rows+'</tbody></table></div>'+
    '<p class="muted" style="font-size:12.5px;margin-top:10px">Estimations basees sur des moyennes scientifiques. La tolerance aux repetitions varie beaucoup selon les personnes : teste et ajuste.</p>';
}

/* ============================================================
   v5 — ZONES D'ENTRAINEMENT a partir de plusieurs chronos
   ============================================================ */
var HC_PERFS = [];

function hcParseTime(raw){
  var t = (raw||'').trim().split(':').map(Number);
  if(t.some(isNaN) || t.length < 2) return 0;
  if(t.length === 3) return t[0]*3600 + t[1]*60 + t[2];
  return t[0]*60 + t[1];
}
function hcFmtTime(sec){
  var m = Math.floor(sec/60), s = Math.round(sec%60);
  if(s === 60){ m += 1; s = 0; }
  return m + ':' + String(s).padStart(2,'0');
}
function hcFmtPace(secPerKm){
  var m = Math.floor(secPerKm/60), s = Math.round(secPerKm%60);
  if(s === 60){ m += 1; s = 0; }
  return m + ":" + String(s).padStart(2,'0');
}
function hcDistLabel(d){
  return (d % 1 === 0 ? d : d.toString().replace('.', ',')) + ' km';
}
function hcWhenLabel(w){
  return w === 0 ? 'moins de 3 semaines' : (w === 1 ? '1 a 3 mois' : 'plus de 3 mois');
}

function hcDrawPerfs(){
  var box = document.getElementById('perfList');
  if(!box) return;
  if(!HC_PERFS.length){
    box.innerHTML = '<p class="muted" style="font-size:13px;margin:8px 0">Aucun chrono ajoute pour le moment.</p>';
    return;
  }
  box.innerHTML = HC_PERFS.map(function(p, i){
    return '<div class="perfitem"><span><b>'+hcDistLabel(p.dist)+'</b> - '+hcFmtTime(p.sec)+
           ' <span class="muted">('+hcWhenLabel(p.when)+')</span></span>'+
           '<button type="button" class="perfdel" data-i="'+i+'">Supprimer</button></div>';
  }).join('');
  box.querySelectorAll('.perfdel').forEach(function(b){
    b.onclick = function(){ HC_PERFS.splice(parseInt(b.dataset.i,10),1); hcDrawPerfs(); };
  });
}

function hcAddPerf(){
  var d = parseFloat(document.getElementById('perfDist').value);
  var raw = document.getElementById('perfTime').value;
  var when = parseInt(document.getElementById('perfWhen').value, 10) || 0;
  var sec = hcParseTime(raw);
  var res = document.getElementById('zOut');
  if(!sec){
    if(res){ res.style.color = '#ff9a9a'; res.textContent = 'Renseigne un temps valide, par exemple 22:00 ou 0:22:00.'; }
    return;
  }
  HC_PERFS.push({dist:d, sec:sec, when:when});
  document.getElementById('perfTime').value = '';
  if(res) res.textContent = '';
  hcDrawPerfs();
}

function hcComputeVMA(perfs){
  if(!perfs || !perfs.length) return 0;
  var poids = [1, 0.85, 0.65], somme = 0, total = 0;
  perfs.forEach(function(p){
    var t3000 = p.sec * Math.pow(3000 / (p.dist * 1000), 1.06);
    var w = poids[p.when] || 0.65;
    somme += t3000 * w; total += w;
  });
  return 3600 / ((somme/total) / 3) * 1.04;
}
function hcZonesList(vma){
  var z = [
    ['Recuperation', 0.55, 0.65],
    ['Endurance fondamentale', 0.65, 0.75],
    ['Endurance active (SV1)', 0.75, 0.82],
    ['Allure semi / marathon', 0.80, 0.85],
    ['Allure 10 km (SV2)', 0.85, 0.88],
    ['Allure 5 km', 0.88, 0.92],
    ['VO2 max / fractionne', 0.92, 1.00],
    ['Vitesse / cotes', 1.00, 1.10]
  ];
  return z.map(function(x){
    return {nom:x[0], a: hcFmtPace(3600/(vma*x[1])), b: hcFmtPace(3600/(vma*x[2]))};
  });
}
function hcComputeZones(){
  var out = document.getElementById('zOut');
  if(!out) return;
  if(!HC_PERFS.length){
    out.style.color = '#ff9a9a';
    out.textContent = 'Ajoute au moins un chrono recent pour calculer tes zones.';
    return;
  }
  var poids = [1, 0.85, 0.65];
  var somme = 0, totalPoids = 0;
  HC_PERFS.forEach(function(p){
    var t3000 = p.sec * Math.pow(3000 / (p.dist * 1000), 1.06);  /* modele de Riegel */
    var w = poids[p.when] || 0.65;
    somme += t3000 * w;
    totalPoids += w;
  });
  var t3000moyen = somme / totalPoids;
  var vma = 3600 / (t3000moyen / 3) * 1.04;

  function allure(pct){ return hcFmtPace(3600 / (vma * pct)) + ' /km'; }

  var zones = [
    ['Recuperation',           0.55, 0.65, 'Footing tres lent, retour au calme'],
    ['Endurance fondamentale', 0.65, 0.75, 'Allure de conversation, base aerobie'],
    ['Endurance active (SV1)', 0.75, 0.82, 'Footing soutenu, seuil bas'],
    ['Allure semi / marathon', 0.80, 0.85, 'Allure course longue distance'],
    ['Allure 10 km (SV2)',     0.85, 0.88, 'Seuil, effort soutenu'],
    ['Allure 5 km',            0.88, 0.92, 'Travail au seuil haut'],
    ['VO2 max / fractionne',   0.92, 1.00, 'Intervalles courts, 1 a 5 min'],
    ['Vitesse / cotes',        1.00, 1.10, 'Sprints courts, puissance']
  ];
  var lignes = zones.map(function(z){
    return '<div class="zone"><b>'+z[0]+'</b> <span class="zonepace">'+allure(z[1])+' -> '+allure(z[2])+'</span>'+
           '<span class="muted zonehint">'+z[3]+'</span></div>';
  }).join('');
  var recap = HC_PERFS.map(function(p){ return hcDistLabel(p.dist)+' en '+hcFmtTime(p.sec); }).join(' - ');

  out.style.color = 'var(--text)';
  if(window.HC_APERCU_COURSE) window.HC_APERCU_COURSE(vma, hcZonesList(vma));
  if(window.HC_APERCU_COURSE) window.HC_APERCU_COURSE(vma, hcZonesList(vma));
  out.innerHTML = '<div class="zonehead">VMA estimee : <b>'+vma.toFixed(1)+' km/h</b>'+
    '<span class="muted"> - 3 000 m equivalent : '+hcFmtTime(t3000moyen)+'</span></div>'+lignes+
    '<p class="muted" style="font-size:12.5px;margin-top:12px">Chronos utilises : '+recap+
    '. Les chronos recents pesent davantage. Estimation indicative : elle ne remplace pas un test de terrain encadre.</p>';
}

window.HC_CALC = {
  rm: hcEstimate1RM,
  vma: hcComputeVMA,
  zones: hcZonesList
};

document.getElementById('rmBtn')?.addEventListener('click', hcRepsTable);
document.getElementById('addPerf')?.addEventListener('click', hcAddPerf);
document.getElementById('zBtn')?.addEventListener('click', hcComputeZones);
hcDrawPerfs();


/* ============================================================
   v6 — "TON APERCU PERSONNALISE" : le calculateur vend
   Apres un calcul, on propose un apercu de programme + un pack.
   ============================================================ */
(function(){
  var html = ''
    + '<div id="apercu" class="apercu" style="display:none">'
    + '<div class="eyebrow">TON APERCU PERSONNALISE</div>'
    + '<h3 id="apercuTitre">Ton plan type</h3>'
    + '<div id="apercuCorps"></div>'
    + '<div id="apercuPack" class="packbox"></div>'
    + '</div>';
  var ancre = document.getElementById('zOut') || document.getElementById('rmOut');
  if(!ancre) return;
  var box = document.createElement('div');
  box.innerHTML = html;
  ancre.parentNode.insertBefore(box.firstChild, ancre.nextSibling);

  function afficher(titre, corps, pack){
    var a = document.getElementById('apercu');
    var t = document.getElementById('apercuTitre');
    var c = document.getElementById('apercuCorps');
    var p = document.getElementById('apercuPack');
    if(!a) return;
    t.textContent = titre;
    c.innerHTML = corps;
    p.innerHTML = pack;
    a.style.display = 'block';
    a.scrollIntoView({behavior:'smooth', block:'nearest'});
  }

  window.HC_APERCU_FORCE = function(rmKg){
    var corps = '<p class="muted">Sur la base de ton 1RM estime de <b>'+rmKg+' kg</b> : tes 2 prochaines semaines.</p>'
      + '<div class="prog">'
      + '<div class="progjour"><b>Lundi</b> Force basse, 4 x 5 reps a '+(Math.round(rmKg*0.80*2)/2)+' kg, repos 3 min</div>'
      + '<div class="progjour"><b>Mercredi</b> Hypertrophie, 3 x 10 reps a '+(Math.round(rmKg*0.70*2)/2)+' kg, repos 90 s</div>'
      + '<div class="progjour"><b>Vendredi</b> Force haute, 5 x 3 reps a '+(Math.round(rmKg*0.90*2)/2)+' kg, repos 4 min</div>'
      + '<div class="progjour"><b>Dimanche</b> Rappel technique, 3 x 8 reps a '+(Math.round(rmKg*0.65*2)/2)+' kg, sans forcer</div>'
      + '</div>'
      + '<p class="muted" style="margin-top:12px">Volume conseille : 10 a 14 series par groupe musculaire et par semaine. Progression de 2,5 % toutes les 2 semaines tant que la technique tient.</p>';
    var pack = '<b>Ce que contient le programme complet</b>'
      + '<ul class="packlist">'
      + '<li>Ton plan de force detaille, semaine par semaine, jusqu a 12 semaines</li>'
      + '<li>Toutes tes charges de travail de 1 a 20 repetitions</li>'
      + '<li>La progression hebdomadaire et les semaines de decharge</li>'
      + '<li>La prevention des blessures et les exercices correctifs</li>'
      + '<li>Un appel tous les 15 jours et le suivi de ta progression</li>'
      + '</ul>'
      + '<div class="packprix"><s>45 &euro; / mois</s> <span class="reduc">-33 %</span> <b>30 &euro; par mois</b> <span class="muted">sur 2 mois</span></div>'
      + '<a class="btn" href="#offres-coaching">D&eacute;bloquer mon programme complet</a>';
    afficher('Tes 2 prochaines semaines', corps, pack);
  };

  window.HC_APERCU_COURSE = function(vma, zones){
    var z = zones.slice(1).map(function(x){ return x.nom+', '+x.a+' a '+x.b; }).join(' | ');
    var corps = '<p class="muted">Sur la base de tes chronos, ta VMA estimee est de <b>'+vma.toFixed(1)+' km/h</b>.</p>'
      + '<div class="prog">'
      + '<div class="progjour"><b>Mardi</b> '+zones[2].nom+', 45 min a '+zones[2].a+' a '+zones[2].b+'</div>'
      + '<div class="progjour"><b>Jeudi</b> '+zones[5].nom+', 6 x 3 min a '+zones[5].a+' a '+zones[5].b+', recup 2 min</div>'
      + '<div class="progjour"><b>Samedi</b> '+zones[1].nom+', 1 h a '+zones[1].a+' a '+zones[1].b+'</div>'
      + '<div class="progjour"><b>Un autre jour</b> Renforcement et prevention des blessures, 40 min</div>'
      + '</div>'
      + '<p class="muted" style="margin-top:12px">Toutes tes allures : '+z+'</p>';
    var pack = '<b>Ce que contient le suivi complet</b>'
      + '<ul class="packlist">'
      + '<li>Ton plan sur Google Sheets, accessible sur telephone et ordinateur</li>'
      + '<li>Une mise a jour chaque week-end, adaptee a tes retours</li>'
      + '<li>Le cycle hiver (volume) puis le cycle ete (qualite et vitesse)</li>'
      + '<li>Le renforcement et la prevention des blessures</li>'
      + '<li>Un appel tous les 15 jours, en option</li>'
      + '</ul>'
      + '<div class="packprix"><b>30 &euro; les 2 mois</b> <span class="muted">ou 120 &euro; la saison complete, soit 10 &euro; par mois</span></div>'
      + '<a class="btn" href="#offres-coaching">D&eacute;bloquer mon plan complet</a>';
    afficher('Ta semaine type', corps, pack);
  };
})();

/* v9 - ouverture de la section philosophie */
document.getElementById('philoBtn')?.addEventListener('click',function(){
  var sec=document.getElementById('philosophie');
  if(!sec) return;
  sec.classList.toggle('open');
  var ouvert = sec.classList.contains('open');
  this.textContent = ouvert ? 'MASQUER MA PHILOSOPHIE' : 'DÉCOUVRIR MA PHILOSOPHIE DU COACHING';
  if(ouvert) sec.scrollIntoView({behavior:'smooth',block:'start'});
});

/* ============================================================
   v12 — Paiement PayPal : collecte des informations puis redirection
   ============================================================ */
document.addEventListener('DOMContentLoaded', function(){
  /* v13 : colle ici ton pseudo PayPal.me. */
  var PAYPAL_ME = 'victormoney77';
  var PROG = null;
  var modale = document.getElementById('paywall');

  function ouvrir(nom, prix){
    PROG = {nom:nom, prix:prix};
    document.getElementById('payProgramme').textContent = nom;
    document.getElementById('payPrix').textContent = prix;
    document.getElementById('payOk').hidden = true;
    document.getElementById('payForm').hidden = false;
    modale.hidden = false;
    document.body.style.overflow = 'hidden';
  }
  function fermer(){
    modale.hidden = true;
    document.body.style.overflow = '';
  }

  window.HC_OUVRIR_PAIEMENT = ouvrir;

  document.querySelectorAll('[data-pay]').forEach(function(b){
    b.addEventListener('click', function(e){
      e.preventDefault();
      ouvrir(b.dataset.pay, b.dataset.prix);
    });
  });

  document.getElementById('payClose')?.addEventListener('click', fermer);
  modale?.addEventListener('click', function(e){ if(e.target === modale) fermer(); });

  document.querySelectorAll('.paytab').forEach(function(t){
    t.addEventListener('click', function(){
      document.querySelectorAll('.paytab').forEach(function(x){ x.classList.remove('on'); });
      t.classList.add('on');
      var compte = t.dataset.mode === 'compte';
      document.getElementById('payNoteCompte').hidden = !compte;
    });
  });

  /* v20 : second moyen de paiement. Colle ici ton pseudo Revolut.me (ex : 'victor123').
     Tant que c'est vide, le bouton "Payer par carte (Revolut)" reste caché. */
  var REVOLUT_ME = 'sportifhybride';
  var btnRev = document.getElementById('payRevolut');
  if(REVOLUT_ME && btnRev) btnRev.hidden = false;

  var USER = null;      /* utilisateur connecté (ou null) */
  var pwdBox = null;    /* champ mot de passe injecté pour "Créer mon compte" */
  var msgBox = document.createElement('p');
  msgBox.className = 'paymsg'; msgBox.id = 'payMsg'; msgBox.setAttribute('role','alert');
  (function(){ var go = document.getElementById('payGo'); if(go && go.parentNode) go.parentNode.insertBefore(msgBox, go); })();

  function modeCompte(){ var t=document.querySelector('.paytab.on'); return !!t && t.dataset.mode === 'compte' && !USER; }
  function majMode(){
    var f = document.getElementById('payForm'); if(!f) return;
    if(modeCompte() && !pwdBox){
      pwdBox = document.createElement('div');
      pwdBox.innerHTML = '<input id="payPwd" type="password" placeholder="Mot de passe (8 caractères minimum)" autocomplete="new-password">';
      document.getElementById('payMail').insertAdjacentElement('afterend', pwdBox);
    }
    if(pwdBox) pwdBox.hidden = !modeCompte();
  }
  document.querySelectorAll('.paytab').forEach(function(t){ t.addEventListener('click', majMode); });

  /* si connecté : champs préremplis, onglets masqués */
  HC.me().then(function(d){
    if(!d.user) return;
    USER = d.user;
    var set = function(id,v){ var e=document.getElementById(id); if(e){ e.value = v||''; e.readOnly = true; } };
    set('payPrenom', d.user.prenom); set('payNom', d.user.nom); set('payTel', d.user.tel || '—'); set('payMail', d.user.email);
    if(!d.user.tel){ var tl=document.getElementById('payTel'); if(tl){ tl.value=''; tl.readOnly=false; } }
    var tabs = document.querySelector('.paytabs'); if(tabs) tabs.hidden = true;
    var note = document.getElementById('payNoteCompte'); if(note) note.hidden = true;
  });

  function erreur(t){
    msgBox.textContent = t;
    var c = document.querySelector('.payconsent');
    if(c) c.classList.toggle('err', /case|casilla|checkbox/i.test(t) || /Coche la case/.test(t));
    if(t){ try{ msgBox.scrollIntoView({block:'center', behavior:'smooth'}); }catch(e){} }
  }

  /* vérifie le formulaire, crée (si besoin) le compte puis la commande sur le serveur.
     Renvoie une promesse : le paiement ne s'ouvre qu'une fois la commande enregistrée. */
  function valider(){
    erreur('');
    var p = document.getElementById('payPrenom').value.trim();
    var n = document.getElementById('payNom').value.trim();
    var t = document.getElementById('payTel').value.trim();
    var m = document.getElementById('payMail').value.trim();
    if(!p || !n || !t || !m){ erreur('Renseigne ton prénom, ton nom, ton téléphone et ton email pour continuer.'); return Promise.reject(); }
    if(!/^[^\s@]{1,64}@[^\s@]{1,200}\.[^\s@]{2,}$/.test(m)){ erreur('Entre une adresse e-mail valide : ton récapitulatif de commande y sera envoyé.'); return Promise.reject(); }
    var cons = document.getElementById('payConsent');
    if(cons && !cons.checked){ erreur('Coche la case pour confirmer l’envoi immédiat du contenu et la renonciation au droit de rétractation.'); return Promise.reject(); }
    var etape = Promise.resolve();
    if(modeCompte()){
      var pw = document.getElementById('payPwd') ? document.getElementById('payPwd').value : '';
      if(pw.length < 8){ erreur('Choisis un mot de passe d’au moins 8 caractères.'); return Promise.reject(); }
      etape = HC.api('/api/register', {prenom:p, nom:n, tel:t, email:m, password:pw}).then(function(d){ USER = d.user; });
    }
    /* v59 : le paiement ne depend plus du serveur. On essaie d'enregistrer la commande (6 s max),
       mais si le serveur ne repond pas, le client est quand meme envoye vers le paiement et
       ses informations partent aussi par WhatsApp. */
    return etape
      .then(function(){
        var appel = HC.api('/api/orders', {produit:PROG.nom, methode:PROG.methode, client:{prenom:p, nom:n, tel:t, email:m}});
        var limite = new Promise(function(_, rej){ setTimeout(function(){ rej(new Error('delai')); }, 6000); });
        return Promise.race([appel, limite]);
      })
      .then(function(d){ PROG.ref = d.ref; PROG.enregistree = true; })
      .catch(function(){ PROG.ref = 'à confirmer'; PROG.enregistree = false; })
      .then(function(){
        PROG.p = p; PROG.n = n; PROG.t = t; PROG.m = m;
        document.getElementById('payForm').hidden = true;
        document.getElementById('payOk').hidden = false;
      });
  }

  var recu = ' Après le paiement, envoie ton reçu à castillovictor77600@gmail.com ou sur WhatsApp en rappelant ta référence pour recevoir ton programme.';

  function infoWA(){
    var msg = 'Bonjour Victor, voici ma commande.\n\nPrénom : ' + PROG.p + '\nNom : ' + PROG.n + '\nTéléphone : ' + PROG.t + '\nEmail : ' + PROG.m +
      '\nProgramme : ' + PROG.nom + '\nPrix : ' + PROG.prix + '\nMoyen de paiement : ' + PROG.methode + '\nRéférence : ' + PROG.ref;
    if(window.HC_EXTRA) msg += '\n\n' + window.HC_EXTRA();
    return 'https://wa.me/33767927163?text=' + encodeURIComponent(msg);
  }
  /* affiche la confirmation, un bouton de secours cliquable, puis redirige */
  function finir(action, url, label, delai){
    var intro = PROG.enregistree
      ? '<p><b>Merci !</b> Commande <b>' + PROG.ref + '</b> enregistrée. ' + action + '</p>'
      : '<p><b>Merci !</b> ' + action + '</p>';
    document.getElementById('payOk').innerHTML = intro + '<p class="muted">' + recu + '</p>' +
      '<p><a class="btn" href="' + url + '">' + label + '</a></p>' +
      '<p><a class="btn alt" target="_blank" rel="noopener" href="' + infoWA() + '">M’ENVOYER MES INFOS SUR WHATSAPP</a></p>';
    setTimeout(function(){ window.location.href = url; }, delai);
  }

  document.getElementById('payGo')?.addEventListener('click', function(){
    PROG.methode = 'paypal';
    valider().then(function(){
      var montant = String(PROG.prix).replace(/[^0-9,\.]/g,'').replace(',','.');
      finir('Redirection vers PayPal…', 'https://www.paypal.me/' + PAYPAL_ME + '/' + montant + 'EUR', 'CONTINUER VERS PAYPAL', 1800);
    }).catch(function(){});
  });

  /* virement : WhatsApp s'ouvre avec un message pret (prenom, nom, programme, prix, reference). */
  document.getElementById('payVirement')?.addEventListener('click', function(){
    PROG.methode = 'virement';
    valider().then(function(){
      var msg = 'Bonjour Victor, je souhaite payer par virement bancaire.\n\nPrénom : ' + PROG.p + '\nNom : ' + PROG.n + '\nTéléphone : ' + PROG.t + '\nEmail : ' + PROG.m + '\nProgramme : ' + PROG.nom + '\nPrix : ' + PROG.prix + '\nRéférence : ' + PROG.ref + '\n\nPeux-tu m\'envoyer ton IBAN ?' + (window.HC_EXTRA ? '\n\n' + window.HC_EXTRA() : '');
      var url = 'https://wa.me/33767927163?text=' + encodeURIComponent(msg);
      document.getElementById('payOk').innerHTML = (PROG.enregistree ? '<p><b>Merci !</b> Commande <b>' + PROG.ref + '</b> enregistrée. Ouverture de WhatsApp…</p>' : '<p><b>Merci !</b> Ouverture de WhatsApp…</p>') +
        '<p class="muted">Envoie le message pré-rempli : je te réponds avec mon IBAN. Ton programme est envoyé dès que j\'ai reçu le virement.</p><p><a class="btn" href="' + url + '">OUVRIR WHATSAPP</a></p>';
      setTimeout(function(){ window.location.href = url; }, 1800);
    }).catch(function(){});
  });

  btnRev?.addEventListener('click', function(){
    PROG.methode = 'revolut';
    valider().then(function(){
      finir('Ouverture de Revolut…', 'https://revolut.me/' + REVOLUT_ME, 'CONTINUER VERS REVOLUT', 2400);
    }).catch(function(){});
  });
});

/* Bibliothèque / Mon espace : données réelles du compte */
(function(){
  var box = document.getElementById('mesAchats');
  var hello = document.getElementById('hello');
  var stat = document.getElementById('statsBox');
  var table = document.getElementById('cmdBody');
  var lib = document.getElementById('libItems');
  if(!box && !hello && !table && !lib) return;
  var STATUT = {payee:['Payée — disponible','' ], en_attente:['En attente de paiement','wait'], annulee:['Annulée','wait']};
  function datefr(d){ return d ? d.slice(0,10).split('-').reverse().join('/') : '-'; }
  function pill(st){ var x = STATUT[st] || [st,'wait']; return '<span class="status-pill '+x[1]+'">'+x[0]+'</span>'; }
  function lien(){ return 'https://wa.me/33767927163'; }

  HC.me().then(function(d){
    if(!d.user){
      var pane = document.querySelector('main.wrap');
      if(pane){
        pane.innerHTML = '<div class="eyebrow">MON ESPACE</div><h1 style="font-size:clamp(38px,6vw,64px)">CONNEXION REQUISE</h1>'
          + '<p class="muted" style="max-width:680px">Connecte-toi ou crée ton compte pour retrouver tes programmes et tes commandes.</p>'
          + '<div class="buttons" style="margin-top:22px"><a class="btn" href="compte.html">ME CONNECTER / CRÉER MON COMPTE</a></div>';
      }
      return;
    }
    var o = d.orders || [], payees = o.filter(function(x){ return x.status==='payee'; });
    if(hello) hello.textContent = 'BONJOUR ' + String(d.user.prenom).toUpperCase();
    if(stat) stat.innerHTML =
      '<div class="proof"><strong>'+payees.length+'</strong><span>Programmes disponibles</span></div>'
     +'<div class="proof"><strong>'+(o.length-payees.length-o.filter(function(x){return x.status==='annulee';}).length)+'</strong><span>Commandes en attente</span></div>'
     +'<div class="proof"><strong>'+o.length+'</strong><span>Commandes</span></div>';
    if(table) table.innerHTML = o.length ? o.map(function(x){
      return '<tr><td>'+HC.esc(x.ref)+'</td><td>'+HC.esc(x.produit)+'</td><td>'+x.prix_eur+' €</td><td>'+datefr(x.created_at)+'</td><td>'+pill(x.status)+'</td></tr>';
    }).join('') : '<tr><td colspan="5" class="muted">Aucune commande pour le moment.</td></tr>';
    var info = document.getElementById('infoBody');
    if(info) info.innerHTML = '<tr><td>Nom</td><td>'+HC.esc(d.user.prenom+' '+d.user.nom)+'</td></tr><tr><td>Email</td><td>'+HC.esc(d.user.email)+'</td></tr><tr><td>Téléphone</td><td>'+HC.esc(d.user.tel||'-')+'</td></tr>';
    if(box || lib){
      var vide = document.getElementById('achatsVide');
      var cible = box || lib;
      if(!o.length){ cible.innerHTML=''; if(vide) vide.hidden=false; }
      else {
        if(vide) vide.hidden = true;
        cible.innerHTML = o.map(function(x,i){
          var ok = x.status==='payee';
          return '<article class="card" style="min-height:200px"><div class="card-body"><span class="num">'+String(i+1).padStart(2,'0')+'</span><h3>'+HC.esc(x.produit).toUpperCase()+'</h3>'
            + '<p class="muted">Réf. '+HC.esc(x.ref)+' · '+pill(x.status)+'</p>'
            + (ok ? '<a class="btn" target="_blank" rel="noopener" href="'+lien()+'?text='+encodeURIComponent('Bonjour Victor, je souhaite recevoir mon programme '+x.produit+' (réf. '+x.ref+')')+'">RECEVOIR / OUVRIR MON PROGRAMME</a>'
                    : '<p class="muted">Dès que ton paiement est reçu, ton programme apparaît ici.</p>')
            + '</div></article>';
        }).join('');
      }
    }
    var out = document.getElementById('logoutBtn');
    if(out) out.onclick = function(){ HC.api('/api/logout').then(function(){ location.href='compte.html'; }); };
    var del = document.getElementById('delBtn');
    if(del) del.onclick = function(){
      if(!confirm(window.hcT?hcT('Supprimer définitivement ton compte ? Tes informations personnelles seront effacées.'):'Supprimer définitivement ton compte ? Tes informations personnelles seront effacées.')) return;
      HC.api('/api/account/delete').then(function(){ location.href='index.html'; }).catch(function(e){ alert(e.message); });
    };
  });
})();


/* v15 - choix de la formule de coaching : clic sur une carte = selection */
document.addEventListener('DOMContentLoaded', function(){
  var cartes = document.querySelectorAll('.offres.choix .offre');
  if(!cartes.length) return;
  function choisir(c){ cartes.forEach(function(x){ x.classList.remove('sel'); }); c.classList.add('sel'); }
  cartes.forEach(function(c){
    c.setAttribute('tabindex','0');
    c.addEventListener('click', function(){ choisir(c); });
    c.addEventListener('keydown', function(e){ if((e.key==='Enter'||e.key===' ') && e.target===c){ e.preventDefault(); choisir(c); } });
  });
});


/* v20 - aide avant paiement : WhatsApp + e-mail */
document.addEventListener('DOMContentLoaded', function(){
  var NUM = '33767927163', MAIL = 'castillovictor77600@gmail.com';
  function wa(msg){ return 'https://wa.me/' + NUM + '?text=' + encodeURIComponent(msg); }
  function ml(sujet, msg){ return 'mailto:' + MAIL + '?subject=' + encodeURIComponent(sujet) + '&body=' + encodeURIComponent(msg); }
  function liens(titre){
    return '<a class="wa-link" target="_blank" rel="noopener" href="' + wa('Bonjour Victor, j\'ai une question sur : ' + titre) + '">WhatsApp</a>' +
           '<a class="wa-link mail-link" href="' + ml('Question sur : ' + titre, 'Bonjour Victor,\n\nJ\'ai une question sur : ' + titre + '\n\n') + '">E-mail</a>';
  }
  var boutons = document.querySelectorAll('[data-pay]');
  if(!boutons.length) return;
  var h1 = document.querySelector('h1');
  var titre = h1 ? h1.textContent.replace(/\s+/g, ' ').trim() : 'ton programme';
  var dernier = boutons[boutons.length - 1];
  var conteneur = dernier.closest('.grid, .offres, .actions05') || dernier.parentElement;
  var p = document.createElement('p');
  p.className = 'wa-help';
  p.innerHTML = '<span class="muted">Une question avant de payer ?</span> ' + liens(titre);
  conteneur.insertAdjacentElement('afterend', p);
  var form = document.getElementById('payForm');
  if(form){
    var q = document.createElement('p');
    q.className = 'wa-help'; q.id = 'payWa';
    q.innerHTML = '<span class="muted">Une question ?</span> ' + liens(titre);
    form.appendChild(q);
    document.addEventListener('click', function(e){
      var b = e.target.closest && e.target.closest('[data-pay]');
      if(!b) return;
      q.innerHTML = '<span class="muted">Une question ?</span> ' + liens(b.getAttribute('data-pay') + ' (' + b.getAttribute('data-prix') + ')');
    });
  }
});

/* v20 - photos et videos de preuve.
   Pour en ajouter : mets le fichier dans assets/preuves/ puis ajoute une ligne ci-dessous.
   Cles : victor, steve, fabio, valentine, parcours.
   Types : {t:'img', src:'assets/preuves/photo.webp', alt:'Description'}
           {t:'video', src:'assets/preuves/video.mp4'}   (25 Mo maximum par fichier)
           {t:'youtube', id:'IDENTIFIANT_DE_LA_VIDEO'}   (recommande pour les videos lourdes) */
window.HC_MEDIA = {
  steve: [],
  fabio: [],
  valentine: [{t:'img', src:'assets/preuves/valentine-coach.webp', alt:'Valentine à l\'arrivée, avec son coach'}],
  parcours: []
};
document.addEventListener('DOMContentLoaded', function(){
  document.querySelectorAll('[data-media]').forEach(function(box){
    var items = (window.HC_MEDIA || {})[box.dataset.media] || [];
    if(!items.length){ box.hidden = true; return; }
    box.innerHTML = items.map(function(m){
      if(m.t === 'img'){
        var im = '<img loading="lazy" src="' + m.src + '" alt="' + (m.alt || 'Preuve de progression') + '">';
        return m.label ? '<figure><span class="mlabel">' + m.label + '</span>' + im + '</figure>' : im;
      }
      if(m.t === 'video') return '<video controls preload="metadata" playsinline src="' + m.src + '"></video>';
      if(m.t === 'youtube') return '<iframe loading="lazy" src="https://www.youtube-nocookie.com/embed/' + m.id + '" title="Video" allowfullscreen></iframe>';
      return '';
    }).join('');
  });
});

/* v20 - avis : "Lire la suite" sur les longs temoignages + liens Google */
document.addEventListener('DOMContentLoaded', function(){
  document.querySelectorAll('.avis blockquote.long').forEach(function(bq){
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'avis-more'; b.textContent = 'Lire la suite';
    b.addEventListener('click', function(){
      var open = bq.classList.toggle('open');
      b.textContent = open ? 'Réduire' : 'Lire la suite';
    });
    bq.insertAdjacentElement('afterend', b);
  });
  /* Quand ta fiche Google existe, colle ici ses deux liens (voir et laisser un avis) */
  var GOOGLE_VOIR = '', GOOGLE_LAISSER = '';
  var g = document.getElementById('googleAvis');
  if(g && (GOOGLE_VOIR || GOOGLE_LAISSER)){
    g.innerHTML = (GOOGLE_VOIR ? '<a class="btn alt" target="_blank" rel="noopener" href="' + GOOGLE_VOIR + '">VOIR LES AVIS GOOGLE</a>' : '') +
                  (GOOGLE_LAISSER ? '<a class="btn" target="_blank" rel="noopener" href="' + GOOGLE_LAISSER + '">LAISSER UN AVIS GOOGLE</a>' : '');
    g.hidden = false;
  }
});

/* v26 - photo du podium de Fabio (cote course a pied) + agrandissement du tableau */
window.HC_MEDIA.fabioCourse = [{t:'img', src:'assets/preuves/fabio-podium.webp', alt:'Fabio sur la première marche du podium'}];
document.addEventListener('DOMContentLoaded', function(){
  document.querySelectorAll('.zoomable').forEach(function(img){
    img.style.cursor = 'zoom-in';
    img.addEventListener('click', function(){
      var o = document.createElement('div');
      o.style.cssText = 'position:fixed;inset:0;z-index:100;background:#000d;overflow:auto;padding:20px;cursor:zoom-out';
      o.innerHTML = '<img src="' + img.src + '" alt="' + img.alt + '" style="width:min(1000px,100%);margin:auto;display:block;border-radius:8px">';
      o.addEventListener('click', function(){ o.remove(); });
      document.body.appendChild(o);
    });
  });
});


/* v29 - Mon parcours : compteurs animes + courbe d'abonnes.
   Pour mettre a jour : modifie HC_STATS (points de la courbe) et les chiffres data-count dans parcours.html. */
window.HC_STATS = [
  {l:'2024', v:600},
  {l:'Avr. 2025', v:1000},
  {l:'Sept. 2025', v:1200},
  {l:'Janv. 2026', v:1500},
  {l:'Juin 2026', v:2000},
  {l:'Nov. 2026', v:2200}
];
document.addEventListener('DOMContentLoaded', function(){
  var box = document.getElementById('stats');
  if(!box) return;
  var nf = new Intl.NumberFormat('fr-FR');
  function fmt(el, v){
    var f = el.getAttribute('data-fmt');
    if(f === 'views') return v >= 1e6 ? (Math.round(v/1e4)/100).toString().replace('.',',') + ' M' : nf.format(Math.round(v));
    if(f === 'x') return '×' + (Math.round(v*10)/10).toString().replace('.',',');
    return nf.format(Math.round(v));
  }
  function count(el){
    var end = parseFloat(el.getAttribute('data-count')), t0 = null;
    function step(t){
      if(t0 === null) t0 = t;
      var k = Math.min(1,(t-t0)/1600), e = 1 - Math.pow(1-k,3);
      el.textContent = fmt(el, end*e);
      if(k < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  /* courbe */
  var svg = document.getElementById('followChart'), D = window.HC_STATS, W = 640, H = 300, L = 46, R = 44, T = 24, B = 44;
  var max = Math.ceil(Math.max.apply(null, D.map(function(d){return d.v;}))/500)*500;
  function X(i){ return L + i*(W-L-R)/(D.length-1); }
  function Y(v){ return T + (1 - v/max)*(H-T-B); }
  var line = D.map(function(d,i){ return (i?'L':'M') + X(i).toFixed(1) + ' ' + Y(d.v).toFixed(1); }).join(' ');
  var area = line + ' L' + X(D.length-1) + ' ' + (H-B) + ' L' + X(0) + ' ' + (H-B) + ' Z';
  var grid = '';
  for(var g = 0; g <= max; g += 500){
    grid += '<line x1="'+L+'" x2="'+(W-R)+'" y1="'+Y(g)+'" y2="'+Y(g)+'" stroke="#22302d" stroke-width="1"/><text x="'+(L-8)+'" y="'+(Y(g)+4)+'" text-anchor="end" fill="#7e8b87" font-size="11">'+nf.format(g)+'</text>';
  }
  var dots = D.map(function(d,i){
    var last = i === D.length-1;
    return '<g class="cdot" style="animation-delay:'+(0.9+i*0.18)+'s"><circle cx="'+X(i)+'" cy="'+Y(d.v)+'" r="'+(last?7:5)+'" fill="'+(last?'#35ff84':'#070909')+'" stroke="#35ff84" stroke-width="2.5"/>'
      + '<text x="'+X(i)+'" y="'+(Y(d.v)-14)+'" text-anchor="middle" fill="'+(last?'#35ff84':'#f5f7f6')+'" font-size="'+(last?15:13)+'" font-weight="800">'+nf.format(d.v)+'</text></g>'
      + '<text x="'+X(i)+'" y="'+(H-16)+'" text-anchor="middle" fill="#a6b1ad" font-size="11.5">'+d.l+'</text>';
  }).join('');
  svg.innerHTML = '<defs><linearGradient id="ga" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#35ff84" stop-opacity=".38"/><stop offset="1" stop-color="#35ff84" stop-opacity="0"/></linearGradient>'
    + '<linearGradient id="gl" x1="0" x2="1"><stop offset="0" stop-color="#278cff"/><stop offset="1" stop-color="#35ff84"/></linearGradient></defs>'
    + grid + '<path d="'+area+'" fill="url(#ga)" class="carea"/><path id="cline" d="'+line+'" fill="none" stroke="url(#gl)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>' + dots;
  var path = document.getElementById('cline'), len = path.getTotalLength();
  path.style.strokeDasharray = len; path.style.strokeDashoffset = len;
  var started = false;
  function go(){
    if(started) return; started = true;
    box.classList.add('play');
    path.style.transition = 'stroke-dashoffset 1.6s ease'; path.style.strokeDashoffset = 0;
    box.querySelectorAll('[data-count]').forEach(count);
  }
  if('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting){ go(); io.disconnect(); } }); }, {threshold:.25});
    io.observe(box);
  } else { go(); }
  /* si l'animation ne peut pas se lancer, on affiche quand meme les vrais chiffres */
  box.querySelectorAll('[data-count]').forEach(function(el){ el.textContent = fmt(el, parseFloat(el.getAttribute('data-count'))); });
});

/* v35 - lien de la page courante surligne dans le menu */
document.addEventListener('DOMContentLoaded', function(){
  var f = (location.pathname.split('/').pop() || 'index').replace(/\.html$/,'');
  if(f === 'resultats') f = 'avis';
  if(f === 'bibliotheque' || f === 'compte') f = 'espace';
  document.querySelectorAll('.links a').forEach(function(a){
    var h = ((a.getAttribute('href')||'').replace(/\.html$/,'').split('/').pop()) || 'index';
    if(h === f) a.setAttribute('aria-current','page');
  });
});

/* v39 - avis : carrousel (fleches, points, glisser) */
document.addEventListener('DOMContentLoaded', function(){
  var list = document.querySelector('.avislist');
  if(!list) return;
  var figs = Array.prototype.slice.call(list.children).filter(function(e){ return e.tagName === 'FIGURE'; });
  if(figs.length < 2) return;
  var root = document.createElement('div');
  root.className = 'avsl'; root.setAttribute('role','region'); root.setAttribute('aria-roledescription','carousel'); root.setAttribute('aria-label','Avis'); root.tabIndex = 0;
  var view = document.createElement('div'); view.className = 'avsl-view';
  var track = document.createElement('div'); track.className = 'avsl-track'; view.appendChild(track);
  var slides = figs.map(function(f){
    var s = document.createElement('div'); s.className = 'avsl-slide'; s.appendChild(f); track.appendChild(s); return s;
  });
  var ARR = function(d){ return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="'+d+'"/></svg>'; };
  var prev = document.createElement('button'); prev.type='button'; prev.className='avsl-btn avsl-prev'; prev.setAttribute('aria-label','Avis précédent'); prev.innerHTML = ARR('M15 5l-7 7 7 7');
  var next = document.createElement('button'); next.type='button'; next.className='avsl-btn avsl-next'; next.setAttribute('aria-label','Avis suivant'); next.innerHTML = ARR('M9 5l7 7-7 7');
  var nav = document.createElement('div'); nav.className = 'avsl-nav';
  var count = document.createElement('span'); count.className = 'avsl-count';
  var dots = document.createElement('div'); dots.className = 'avsl-dots';
  var dotEls = slides.map(function(_, i){
    var d = document.createElement('button'); d.type='button'; d.className='avsl-dot'; d.setAttribute('aria-label','Avis ' + (i+1)); d.addEventListener('click', function(){ go(i); }); dots.appendChild(d); return d;
  });
  nav.appendChild(count); nav.appendChild(dots);
  root.appendChild(view); root.appendChild(prev); root.appendChild(next); root.appendChild(nav);
  list.parentNode.insertBefore(root, list); list.style.display = 'none';

  var idx = 0;
  function fit(){ var h = slides[idx].offsetHeight; if(h) view.style.height = h + 'px'; }
  function go(i){
    idx = (i + slides.length) % slides.length;
    track.style.transform = 'translateX(' + (-idx*100) + '%)';
    slides.forEach(function(s, k){ var on = k === idx; s.classList.toggle('on', on); if(on) s.removeAttribute('inert'); else s.setAttribute('inert',''); s.setAttribute('aria-hidden', on ? 'false' : 'true'); });
    dotEls.forEach(function(d, k){ d.classList.toggle('on', k === idx); });
    count.textContent = (idx+1) + ' / ' + slides.length;
    fit();
  }
  prev.addEventListener('click', function(){ go(idx-1); });
  next.addEventListener('click', function(){ go(idx+1); });
  root.addEventListener('keydown', function(e){
    if(e.key === 'ArrowLeft'){ e.preventDefault(); go(idx-1); }
    else if(e.key === 'ArrowRight'){ e.preventDefault(); go(idx+1); }
  });
  var x0 = null, y0 = null;
  view.addEventListener('pointerdown', function(e){ if(e.pointerType === 'mouse') return; x0 = e.clientX; y0 = e.clientY; });
  view.addEventListener('pointerup', function(e){
    if(x0 === null) return;
    var dx = e.clientX - x0, dy = e.clientY - y0; x0 = null;
    if(Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(idx + (dx < 0 ? 1 : -1));
  });
  view.addEventListener('pointercancel', function(){ x0 = null; });
  if(window.ResizeObserver){ var ro = new ResizeObserver(fit); slides.forEach(function(s){ ro.observe(s); }); }
  window.addEventListener('resize', fit);
  window.addEventListener('load', fit);
  go(0);
});

/* v42 : programmes — deux entrées */
(function(){
  var open=document.getElementById('openProgs'),back=document.getElementById('backEntries'),ent=document.getElementById('entries'),list=document.getElementById('progList');
  if(!open||!list)return;
  function show(on){list.hidden=!on;ent.hidden=on;if(on){try{history.replaceState(null,'','#programmes')}catch(e){}}else{try{history.replaceState(null,'',location.pathname)}catch(e){}}window.scrollTo({top:0,behavior:'smooth'})}
  open.addEventListener('click',function(e){e.preventDefault();show(true)});
  back.addEventListener('click',function(e){e.preventDefault();show(false)});
  if(location.hash==='#programmes')show(true);
})();


/* v45 - WhatsApp flottant, boutons WhatsApp, chaine newsletter */
window.HC_NEWSLETTER_URL = 'https://whatsapp.com/channel/0029VbDwRxTCBtxDxqQPFq1v';   /* colle ici le lien de la chaine WhatsApp, ex. https://whatsapp.com/channel/XXXX */
(function(){
  var MSG = "Bonjour Victor, je viens de ton site et j'aimerais en savoir plus sur le coaching.";
  function waHref(){ var m = (window.hcT ? window.hcT(MSG) : MSG); return 'https://wa.me/33767927163?text=' + encodeURIComponent(m); }
  document.addEventListener('DOMContentLoaded', function(){
    if(document.querySelector('#adminRoot') || /admin/.test(location.pathname)) return;
    var a = document.createElement('a');
    a.className = 'wafab'; a.setAttribute('data-wa',''); a.target = '_blank'; a.rel = 'noopener'; a.href = waHref();
    a.setAttribute('aria-label', 'Écris-moi sur WhatsApp');
    a.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false"><path fill="currentColor" d="M4 3h16a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H9l-5 4v-4H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/></svg><span>Écris-moi</span>';
    document.body.appendChild(a);
  });
  document.addEventListener('click', function(e){
    var w = e.target.closest && e.target.closest('[data-wa]');
    if(w){ w.href = waHref(); }
    var n = e.target.closest && e.target.closest('[data-nl]');
    if(n){ e.preventDefault(); if(window.HC_NEWSLETTER_URL) window.open(window.HC_NEWSLETTER_URL, '_blank', 'noopener'); }
  }, true);
})();

/* HC_QUIZ : "Quel programme pour moi ?" (page d'accueil) */
(function(){
  var box = document.getElementById('quiz'); if(!box) return;
  var q = box.querySelector('.quizbox'), st = {}, hist = [];
  var back = box.querySelector('.qback');
  function aff(sel){
    box.querySelectorAll('.qstep,.qres').forEach(function(e){ e.hidden = !e.matches(sel); });
    var intro = box.querySelector('.qintro'); if(intro) intro.hidden = !/data-step/.test(sel);
    back.hidden = !hist.length || /qres|data-res/.test(sel);
  }
  function cle(){
    var o = st.obj;
    if(o === 'force') return 'sbd';
    if(o === 'detente') return 'detente-' + (st.lieu === 'salle' ? 'salle' : 'ext');
    if(o === 'perf') return 'perf-' + (st.lieu === 'salle' ? 'salle' : 'ext');
    if(o === 'muscu') return st.lieu === 'maison' ? 'homebody' : ({a:'full', b:'double', c:'gymbro'}[st.seances] || 'full');
    return o;
  }
  function suite(){
    var o = st.obj;
    if(!o) return aff('[data-step="1"]');
    if(['detente','perf','muscu'].indexOf(o) > -1 && !st.lieu) return aff('[data-step="2"]');
    if(o === 'muscu' && st.lieu === 'salle' && !st.seances) return aff('[data-step="3"]');
    if(['nutrition','course'].indexOf(o) === -1 && !st.suivi) return aff('[data-step="4"]');
    q.dataset.suivi = st.suivi || '';
    aff('[data-res="' + cle() + '"]');
  }
  box.addEventListener('click', function(e){
    var b = e.target.closest('button'); if(!b) return;
    if(b.dataset.k){ st[b.dataset.k] = b.dataset.v; hist.push(b.dataset.k); suite(); }
    else if(b.classList.contains('qreset')){ st = {}; hist = []; suite(); }
    else if(b.classList.contains('qback')){ var k = hist.pop(); if(k) delete st[k]; suite(); }
  });
  suite();
})();

/* HC_EXTRA : formulaire du coaching sur mesure (réponses jointes au paiement et à WhatsApp) */
(function(){
  var f = document.getElementById('cmForm'); if(!f) return;
  function v(id){ var e = document.getElementById(id); return e ? e.value.trim() : ''; }
  window.HC_EXTRA = function(){
    return 'COACHING SUR MESURE - mes réponses :\nSport : ' + (v('cmSport') || '-') + '\nNiveau : ' + v('cmNiveau') + '\nSéances par semaine : ' + v('cmSeances') +
      '\nLieu : ' + v('cmLieu') + '\nBlessures / contraintes : ' + (v('cmBlessures') || '-') + '\nObjectif : ' + v('cmObjectif') + '\nMes attentes : ' + v('cmAttentes');
  };
  var msg = document.getElementById('cmMsg');
  function valide(){
    if(!v('cmObjectif') || !v('cmAttentes')){
      msg.textContent = (window.hcT ? window.hcT('Indique ton objectif et tes attentes pour continuer.') : 'Indique ton objectif et tes attentes pour continuer.');
      try{ msg.scrollIntoView({block:'center', behavior:'smooth'}); }catch(e){}
      return false;
    }
    msg.textContent = ''; return true;
  }
  document.getElementById('cmSend').addEventListener('click', function(){
    if(!valide()) return;
    window.open('https://wa.me/33767927163?text=' + encodeURIComponent('Bonjour Victor, je souhaite un coaching sur mesure.\n\n' + window.HC_EXTRA()), '_blank', 'noopener');
  });
  var pay = document.querySelector('[data-pay]');
  if(pay) pay.addEventListener('click', function(e){ if(!valide()){ e.stopImmediatePropagation(); e.preventDefault(); } }, true);
})();

/* v63 mouvement debut : supprimer ce bloc pour enlever les animations */
(function(){try{
if(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)return;
if(!('IntersectionObserver' in window))return;
var els=[].slice.call(document.querySelectorAll('main .section,main .hpcard,main .card,main .philcard,main .offre,main .hubcard,main .formules,main .steps3>*,main .hpq,main .ctaband'));
var h=innerHeight;
els=els.filter(function(e){return e.getBoundingClientRect().top>h*0.9&&!e.closest('#paywall')});
els.forEach(function(e){e.classList.add('rv')});
var io=new IntersectionObserver(function(es){es.forEach(function(x){if(x.isIntersecting){x.target.classList.add('rv-in');io.unobserve(x.target)}})},{threshold:0.08,rootMargin:'0px 0px -4% 0px'});
els.forEach(function(e){io.observe(e)});
setTimeout(function(){els.forEach(function(e){e.classList.add('rv-in')})},6000);
addEventListener('beforeprint',function(){els.forEach(function(e){e.classList.add('rv-in')})});
}catch(e){}})();
/* v63 mouvement fin */

/* HC_AVIS : avis clients (code a usage unique) */
(function(){ try{
  var f=document.getElementById('avisForm'); if(!f) return;
  var t=function(x){ return window.hcT?window.hcT(x):x; };
  var msg=document.getElementById('avMsg'), go=document.getElementById('avGo'), box=document.getElementById('avisClients');
  var STAR='<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false"><path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z"/></svg>';
  function say(x,k){ msg.textContent=x; msg.className='avmsg '+(k||''); }
  function draw(list){
    if(!list||!list.length) return; box.hidden=false; box.innerHTML='';
    list.forEach(function(r){
      var fg=document.createElement('figure'); fg.className='avis';
      var st=document.createElement('div'); st.className='stars'; st.setAttribute('role','img'); st.setAttribute('aria-label',r.rating+'/5'); st.innerHTML=new Array(r.rating+1).join(STAR); fg.appendChild(st);
      var bq=document.createElement('blockquote'), p=document.createElement('p'); p.textContent='« '+r.comment+' »'; bq.appendChild(p); fg.appendChild(bq);
      var fc=document.createElement('figcaption'), b=document.createElement('b'), sp=document.createElement('span');
      b.textContent=r.prenom+', '+r.age+' '+t('ans'); sp.textContent=(r.sport?r.sport+' · ':'')+t(r.programme); fc.appendChild(b); fc.appendChild(sp); fg.appendChild(fc); box.appendChild(fg);
    });
  }
  fetch('/api/reviews',{credentials:'same-origin'}).then(function(r){return r.ok?r.json():null}).then(function(d){ if(d) draw(d.reviews); }).catch(function(){});
  f.addEventListener('submit',function(e){
    e.preventDefault();
    var d={}; ['prenom','sport','age','programme','comment','code','website'].forEach(function(n){ d[n]=f.elements[n].value; });
    var rt=f.querySelector('input[name=rating]:checked'); d.rating=rt?rt.value:'';
    if(!d.prenom.trim()) return say(t('Renseigne ton prénom.'),'err');
    if(!d.sport.trim()) return say(t('Indique le sport que tu pratiques.'),'err');
    if(!d.age) return say(t('Renseigne ton âge.'),'err');
    if(!d.programme) return say(t('Choisis le programme concerné.'),'err');
    if(!d.rating) return say(t('Choisis une note de 1 à 5 étoiles.'),'err');
    if(d.comment.trim().length<10) return say(t('Écris un commentaire (au moins 10 caractères).'),'err');
    if(!d.code.trim()) return say(t('Entre ton code d\'avis.'),'err');
    go.disabled=true; say(t('Envoi en cours…'));
    fetch('/api/review',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json'},body:JSON.stringify(d)})
      .then(function(r){ return r.json().then(function(j){ return {ok:r.ok,j:j}; },function(){ return {ok:false,j:{}}; }); })
      .then(function(x){
        go.disabled=false;
        if(x.ok){ f.reset(); say(t('Merci ! Ton avis a bien été envoyé. Il sera publié après vérification.'),'ok'); }
        else say(t(x.j&&x.j.error?x.j.error.replace(/\s*\[diagnostic.*$/,''):'Une erreur est survenue. Réessaie dans un instant.'),'err');
      })
      .catch(function(){ go.disabled=false; say(t('Impossible de joindre le serveur. Réessaie dans un instant.'),'err'); });
  });
}catch(e){} })();
