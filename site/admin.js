(function(){
  var KEY='', ORD=[];
  var SITE='https://sportifhybride.com';
  var $=function(i){return document.getElementById(i)};
  function esc(t){return String(t==null?'':t).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
  function call(p,b){b=b||{};b.key=KEY;return fetch(p,{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json'},body:JSON.stringify(b)}).then(function(r){return r.json().then(function(d){if(!r.ok)throw new Error(d.error||'Erreur');return d},function(){throw new Error('Réponse illisible')})})}
  function toast(t){var d=document.createElement('div');d.className='toast';d.textContent=t;document.body.appendChild(d);setTimeout(function(){d.remove()},2200)}
  function dt(s){if(!s)return '';var d=new Date(String(s).replace(' ','T')+'Z');if(isNaN(d))return s;return d.toLocaleString('fr-FR',{timeZone:'Europe/Paris',day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}).replace(',',' à')}
  function num(t){var d=String(t||'').replace(/[^\d+]/g,'');if(!d)return '';if(d.charAt(0)==='+')return d.slice(1).replace(/\D/g,'');if(d.indexOf('00')===0)return d.slice(2);if(d.length===10&&d.charAt(0)==='0')return '33'+d.slice(1);if(d.length===9)return '33'+d;return d.replace(/\D/g,'')}
  var PAY={paypal:'PayPal',revolut:'Revolut',virement:'Virement bancaire'};
  function recap(o){
    return ['Bonjour '+(o.client_prenom||'')+',','','Merci pour ta commande chez Hybride Coaching !','',
      'RÉCAPITULATIF DE COMMANDE',
      'Référence : '+o.ref,
      'Produit : '+o.produit,
      'Prix : '+o.prix_eur+' €',
      'Mode de paiement : '+(PAY[o.methode]||o.methode||'-'),
      'Commande passée le : '+dt(o.created_at),
      'Paiement confirmé le : '+dt(o.paid_at),'',
      'Ton code pour laisser un avis (usage unique) : '+o.code,
      'Tu peux le saisir ici : '+SITE+'/avis.html','',
      'Victor Castillo · Hybride Coaching'].join('\n')
  }
  function msgButtons(o){
    if(o.status!=='payee'||!o.code)return '';
    var m=recap(o);
    return (o.client_email?'<a class="abtn" href="mailto:'+encodeURIComponent(o.client_email).replace('%40','@')+'?subject='+encodeURIComponent('Ta commande '+o.ref+' · Hybride Coaching')+'&body='+encodeURIComponent(m)+'">E-mail</a>':'')+'<button data-copy="'+o.id+'">Copier</button>';
  }
  var LED=[];
  function ym(s){return String(s||'').slice(0,7)}
  function eur(n){return n.toLocaleString('fr-FR')+' €'}
  function totals(){
    var m={};
    ORD.forEach(function(o){if(o.status==='payee'&&o.paid_at){var k=ym(o.paid_at);m[k]=m[k]||{o:0,l:0};m[k].o+=o.prix_eur}});
    LED.forEach(function(l){var k=ym(l.day);m[k]=m[k]||{o:0,l:0};m[k].l+=l.amount_eur});
    return m;
  }
  function stats(){
    var m=totals(),keys=Object.keys(m).sort().reverse(),tot=0;
    keys.forEach(function(k){tot+=m[k].o+m[k].l});
    var now=new Date().toISOString().slice(0,7),cur=m[now]?m[now].o+m[now].l:0;
    var w=ORD.filter(function(o){return o.status==='en_attente'}).length;
    $('top').innerHTML='<div class="stat"><b>'+eur(tot)+'</b><span>gagné depuis le début</span></div><div class="stat"><b>'+eur(cur)+'</b><span>gagné ce mois-ci</span></div><div class="stat"><b>'+ORD.filter(function(o){return o.status==='payee'}).length+'</b><span>commandes payées</span></div><div class="stat"><b>'+w+'</b><span>en attente de paiement</span></div>';
    $('months').innerHTML=keys.map(function(k){return '<tr><td>'+esc(k)+'</td><td>'+eur(m[k].o)+'</td><td>'+eur(m[k].l)+'</td><td><b>'+eur(m[k].o+m[k].l)+'</b></td></tr>'}).join('')||'<tr><td colspan="4">Aucun revenu.</td></tr>';
    $('ledger').innerHTML=LED.map(function(l){return '<tr><td>'+esc(l.day)+'</td><td>'+esc(l.label)+'</td><td>'+eur(l.amount_eur)+'</td><td><button data-ldel="'+l.id+'">Supprimer</button></td></tr>'}).join('')||'<tr><td colspan="4">Aucune ligne.</td></tr>';
    var P={};
    ORD.filter(function(o){return o.status==='payee'}).forEach(function(o){var n=o.produit.replace(/ \+ suivi$/,''),g=P[n]=P[n]||{n:0,s:0,e:0};g.n++;g.e+=o.prix_eur;if(/ \+ suivi$/.test(o.produit))g.s++});
    $('progs').innerHTML=Object.keys(P).sort(function(a,b){return P[b].e-P[a].e}).map(function(k){return '<tr><td>'+esc(k)+'</td><td>'+P[k].n+'</td><td>'+P[k].s+'</td><td>'+eur(P[k].e)+'</td></tr>'}).join('')||'<tr><td colspan="4">Aucune vente.</td></tr>';
    var today=new Date().toISOString().slice(0,10),due=ORD.filter(function(o){return o.status==='payee'&&o.code&&!o.code_used&&!o.reminded_at&&o.end_date&&o.end_date<=today});
    $('relN').textContent=due.length?'('+due.length+')':'';
    $('rem').innerHTML=due.map(function(o){return '<tr><td>'+esc(o.ref)+'</td><td>'+esc(o.client_prenom+' '+o.client_nom)+'<br>'+esc(o.client_email||'')+'</td><td>'+esc(o.produit)+'</td><td>'+esc(o.end_date)+'</td><td>'
      +(o.client_email?'<a class="abtn" href="mailto:'+encodeURIComponent(o.client_email).replace('%40','@')+'?subject='+encodeURIComponent('Ton avis sur ton programme · Hybride Coaching')+'&body='+encodeURIComponent('Bonjour '+o.client_prenom+',\n\nTon programme ('+o.produit+') est terminé. J\u2019espère qu\u2019il t\u2019a plu !\nSi tu as 2 minutes, ton avis m\u2019aide beaucoup.\n\nTon code (usage unique) : '+o.code+'\nTu peux le saisir ici : '+SITE+'/avis.html\n\nMerci, et à bientôt.\nVictor Castillo · Hybride Coaching')+'">E-mail</a>':'')
      +'<button data-rem="'+o.id+'">Marquer comme relancé</button></td></tr>'}).join('')||'<tr><td colspan="5">Aucune relance à faire.</td></tr>';
    DUE=due.map(function(o){return o.id});
  }
  var DUE=[];
  function drawOrders(){
    stats();
    $('rows').innerHTML=ORD.map(function(o){
      var cl=esc((o.client_prenom||'')+' '+(o.client_nom||''))+'<br>'+esc(o.client_email||'')+'<br>'+esc(o.client_tel||'');
      var code=o.code?'<span class="code">'+esc(o.code)+'</span><br><small>'+(o.code_used?'utilisé':'non utilisé')+'</small>':'-';
      return '<tr><td>'+esc(o.ref)+'</td><td>'+esc(dt(o.created_at))+'</td><td>'+esc(o.produit)+'</td><td>'+o.prix_eur+' €</td><td>'+esc(o.methode||'-')+'</td><td>'+cl+'</td><td><b>'+esc(o.status)+'</b>'+(o.paid_at?'<br>'+esc(dt(o.paid_at)):'')+'</td><td>'+(o.status==='payee'?'<input type="date" data-d="s" data-id="'+o.id+'" value="'+esc(o.start_date||'')+'"><br><input type="date" data-d="e" data-id="'+o.id+'" value="'+esc(o.end_date||'')+'">':'-')+'</td><td>'+code+'</td>'
        +'<td><button data-id="'+o.id+'" data-st="payee">Payée ✓</button><button data-id="'+o.id+'" data-st="en_attente">En attente</button><button data-id="'+o.id+'" data-st="annulee">Annuler</button><br>'+msgButtons(o)+'</td></tr>';
    }).join('')||'<tr><td colspan="10">Aucune commande.</td></tr>';
  }
  function loadOrders(){return Promise.all([call('/api/admin/orders'),call('/api/admin/ledger',{action:'list'})]).then(function(x){$('login').hidden=true;$('panel').hidden=false;ORD=x[0].orders;LED=x[1].entries;drawOrders()}).catch(function(e){$('err').textContent=e.message})}
  function stars(n){return '★★★★★☆☆☆☆☆'.slice(5-n,10-n)}
  function loadReviews(){return call('/api/admin/reviews').then(function(d){
    var p=d.reviews.filter(function(r){return r.status==='pending'}).length;$('pendN').textContent=p?'('+p+')':'';
    $('revs').innerHTML=d.reviews.map(function(r){
      return '<div class="rv'+(r.status==='pending'?' pend':'')+'"><b>'+esc(r.prenom)+', '+r.age+' ans</b> · '+esc(r.sport||'')+' · '+esc(r.programme)+' · <span style="color:#ffb400">'+stars(r.rating)+'</span> · <i>'+esc(r.status==='pending'?'à valider':r.status==='published'?'publié':'refusé')+'</i> · '+esc(dt(r.created_at))
        +'<p>'+esc(r.comment)+'</p><button data-rv="'+r.id+'" data-act="publish">Publier</button><button data-rv="'+r.id+'" data-act="reject">Refuser</button><button data-rv="'+r.id+'" data-act="delete">Supprimer</button></div>';
    }).join('')||'<p class="muted">Aucun avis pour le moment.</p>';
  })}
  function loadCodes(){return call('/api/admin/codes').then(function(d){
    $('codes').innerHTML=d.codes.map(function(c){return '<tr><td><span class="code">'+esc(c.code)+'</span></td><td>'+esc(c.ref||c.note||'-')+'</td><td>'+esc(dt(c.created_at))+'</td><td>'+(c.used_at?esc(dt(c.used_at)):'non')+'</td></tr>'}).join('')||'<tr><td colspan="4">Aucun code.</td></tr>';
  })}
  function tab(n){
    [].forEach.call(document.querySelectorAll('[data-tab]'),function(b){b.classList.toggle('on',b.dataset.tab===n)});
    [].forEach.call(document.querySelectorAll('[data-pane]'),function(s){s.hidden=s.dataset.pane!==n});
    if(n==='reviews')loadReviews().catch(function(e){alert(e.message)});
    if(n==='codes')loadCodes().catch(function(e){alert(e.message)});
  }
  function csv(){
    var L=[['Réf','Créée','Produit','Prix','Moyen','Prénom','Nom','Email','Tel','Statut','Payée le','Début','Fin','Code avis']];
    ORD.forEach(function(o){L.push([o.ref,o.created_at,o.produit,o.prix_eur,o.methode||'',o.client_prenom,o.client_nom,o.client_email,o.client_tel,o.status,o.paid_at||'',o.start_date||'',o.end_date||'',o.code||''])});
    var t=L.map(function(r){return r.map(function(v){return '"'+String(v==null?'':v).replace(/"/g,'""')+'"'}).join(';')}).join('\n');
    var a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['﻿'+t],{type:'text/csv'}));a.download='commandes.csv';document.body.appendChild(a);a.click();a.remove();
  }
  var PW='';
  function post(p,b){return fetch(p,{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json'},body:JSON.stringify(b)}).then(function(r){return r.json().then(function(d){if(!r.ok)throw new Error(d.error||'Erreur');return d},function(){throw new Error('Réponse illisible')})})}
  function enter(tok){KEY=tok;PW='';$('key').value='';$('code').value='';$('err').textContent='';loadOrders().then(function(){return loadReviews()}).catch(function(){})}
  $('go').onclick=function(){
    $('err').textContent='';
    if(!$('setupBox').hidden){var a=$('npw').value,c=$('npw2').value;if(a.length<10){$('err').textContent='Choisis un mot de passe d\'au moins 10 caractères.';return}if(a!==c){$('err').textContent='Les deux mots de passe ne sont pas identiques.';return}post('/api/admin/setup',{password:a}).then(function(d){$('npw').value='';$('npw2').value='';enter(d.token)}).catch(function(e){$('err').textContent=e.message});return}
    if(!$('codeBox').hidden){post('/api/admin/verify',{password:PW,code:$('code').value}).then(function(d){enter(d.token)}).catch(function(e){$('err').textContent=e.message});return}
    PW=$('key').value;
    post('/api/admin/login',{password:PW}).then(function(d){if(d.step==='ok')enter(d.token);else if(d.step==='setup'){$('setupBox').hidden=false;$('key').hidden=true;$('npw').focus()}else{$('codeBox').hidden=false;$('key').hidden=true;$('code').focus()}}).catch(function(e){$('err').textContent=e.message});
  };
  $('key').onkeydown=function(e){if(e.key==='Enter')$('go').click()};
  $('code').onkeydown=function(e){if(e.key==='Enter')$('go').click()};
  $('chgpw').onclick=function(){var n=$('newpw').value;if(n!==$('newpw2').value)return alert('Les deux mots de passe ne sont pas identiques.');call('/api/admin/password',{current:$('curpw').value,next:n}).then(function(){$('curpw').value='';$('newpw').value='';$('newpw2').value='';toast('Mot de passe changé')}).catch(function(x){alert(x.message)})};
  $('refresh').onclick=function(){loadOrders()};
  $('csv').onclick=csv;
  document.querySelector('.admtabs').onclick=function(e){var b=e.target.closest('button');if(b)tab(b.dataset.tab)};
  $('newcode').onclick=function(){call('/api/admin/code',{note:$('note').value}).then(function(d){$('note').value='';toast('Code créé : '+d.code);loadCodes()}).catch(function(x){alert(x.message)})};
  $('rows').onclick=function(e){
    var c=e.target.closest('[data-copy]');
    if(c){var o=ORD.filter(function(x){return String(x.id)===c.dataset.copy})[0];if(o&&navigator.clipboard)navigator.clipboard.writeText(recap(o)).then(function(){toast('Message copié')});return}
    var b=e.target.closest('button[data-st]');if(!b)return;
    call('/api/admin/mark',{id:b.dataset.id,status:b.dataset.st}).then(function(d){if(d.sent)toast('Récapitulatif envoyé par e-mail · code '+d.code);else if(d.code)toast((d.sendError?d.sendError+' · ':'')+'Code d\'avis : '+d.code+' (envoi : bouton E-mail)');return loadOrders()}).catch(function(x){alert(x.message)})
  };
  $('rows').onchange=function(e){var i=e.target.closest('input[data-d]');if(!i)return;var id=i.dataset.id,o=ORD.filter(function(x){return String(x.id)===id})[0];if(i.dataset.d==='s')o.start_date=i.value;else o.end_date=i.value;
    call('/api/admin/dates',{id:id,start:o.start_date||'',end:o.end_date||''}).then(function(){toast('Dates enregistrées');stats()}).catch(function(x){alert(x.message)})};
  $('addL').onclick=function(){call('/api/admin/ledger',{action:'add',label:$('lbl').value,amount:$('amt').value,day:$('lday').value}).then(function(d){LED=d.entries;$('lbl').value='';$('amt').value='';stats();toast('Ajouté')}).catch(function(x){alert(x.message)})};
  $('ledger').onclick=function(e){var b=e.target.closest('[data-ldel]');if(!b||!confirm('Supprimer cette ligne ?'))return;call('/api/admin/ledger',{action:'delete',id:b.dataset.ldel}).then(function(d){LED=d.entries;stats()}).catch(function(x){alert(x.message)})};
  $('rem').onclick=function(e){var b=e.target.closest('[data-rem]');if(!b)return;call('/api/admin/remind',{ids:[b.dataset.rem]}).then(loadOrders).catch(function(x){alert(x.message)})};
  $('remAll').onclick=function(){if(!DUE.length)return toast('Aucune relance à faire');call('/api/admin/remind',{ids:DUE,send:true}).then(function(d){toast(d.sent+' relance(s) envoyée(s)'+(d.error?' · '+d.error:''));return loadOrders()}).catch(function(x){alert(x.message)})};
  $('lday').value=new Date().toISOString().slice(0,10);
  $('revs').onclick=function(e){var b=e.target.closest('button[data-rv]');if(!b)return;
    if(b.dataset.act==='delete'&&!confirm('Supprimer cet avis définitivement ?'))return;
    call('/api/admin/review-set',{id:b.dataset.rv,action:b.dataset.act}).then(loadReviews).catch(function(x){alert(x.message)})};
})();
