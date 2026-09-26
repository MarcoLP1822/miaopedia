(() => {
  'use strict';
  const cats = window.CATS || [];
  const $ = (s) => document.querySelector(s);
  const escape = (value) => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const updateURL = url => { try { history.replaceState(null,'',url); } catch { /* Some file previews disallow history updates. */ } };
  let storage;try{storage=window.localStorage;}catch{/* Storage may be disabled. */}
  const album=window.MiaoAlbum.createAlbum(storage,cats.map(c=>c.id));
  const state = {filter:'all',query:'',view:'explore',albumTab:'favorites',visible:[],navigation:[],current:null,opener:null,openerId:null};
  const heart='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/></svg>';
  const announce=text=>{$('#album-status').textContent=text;};
  const guide=(name,variant)=>`<span class="guide-avatar guide-avatar--${variant}" aria-hidden="true"></span><span class="guide-name">${name}</span>`;
  function favoriteButton(cat,compact=false){const saved=album.favorites.has(cat.id);return `<button class="favorite-button ${compact?'favorite-button--small':''}" data-favorite="${cat.id}" aria-pressed="${saved}" aria-label="${saved?'Rimuovi':'Salva'} ${escape(cat.name)} ${saved?'dai':'nei'} preferiti">${heart}${compact?'':`<span>${saved?'Nel mio album':'Salva nel mio album'}</span>`}</button>`;}

  const catDialog = $('#cat-dialog');
  const infoDialog = $('#info-dialog');
  const label = cat => cat.kind === 'wild' ? (cat.discoveryYear ? `Felino selvatico · Novità ${cat.discoveryYear}` : 'Felino selvatico') : cat.kind === 'domestic' ? 'Specie domestica' : 'Razza domestica';
  const imageMarkup = (cat, className, lazy = true, fit = cat.photo?.fit) => cat.photo ? `<img class="${className}" style="object-fit:${fit==='contain'?'contain':'cover'}" src="${escape(cat.photo.src.startsWith('data:') ? cat.photo.src : './'+cat.photo.src)}" alt="${escape(cat.name)}" ${lazy ? 'loading="lazy"' : ''} decoding="async" width="700" height="700">` : `<div class="${className} text-portrait"><span aria-hidden="true">🐾</span><p>${escape(cat.scientific)}</p></div>`;


  function previewPhoto(cat,lazy=true) {
    const backdrop=cat.photo ? `<img class="preview-backdrop" src="${escape(cat.photo.src.startsWith('data:') ? cat.photo.src : './'+cat.photo.src)}" alt="" aria-hidden="true" ${lazy?'loading="lazy"':''} decoding="async" width="700" height="700">` : '';
    return backdrop+imageMarkup(cat,'preview-image',lazy,'contain');
  }

  function detailPhoto(cat) {
    const backdrop = cat.photo ? `<img class="detail-backdrop" src="${escape(cat.photo.src.startsWith('data:') ? cat.photo.src : './'+cat.photo.src)}" alt="" aria-hidden="true" decoding="async">` : '';
    return `<div class="detail-photo">${backdrop}${imageMarkup(cat,'detail-image',false,'contain')}</div>`;
  }

  function render() {
    const query=normalize(state.query.trim());
    state.visible=cats.filter(cat=>{
      const collection=state.view==='album' ? (state.albumTab==='favorites'?album.favorites:album.seen).has(cat.id) : state.filter==='all'||(state.filter==='home'?cat.kind!=='wild':cat.kind==='wild');
      return collection&&normalize([cat.name,cat.wiki.replaceAll('_',' '),cat.scientific,cat.place,cat.trait].join(' ')).includes(query);
    });
    $('#catalog').innerHTML=state.visible.map((cat,i)=>`<article class="cat-card ${album.seen.has(cat.id)?'is-explored':''}"><button class="card-open" data-cat="${cat.id}" aria-label="Scopri ${escape(cat.name)}"><div class="photo-wrap">${previewPhoto(cat,i>3)}<span class="card-stamp ${cat.kind==='wild'?'wild':''}">${cat.discoveryYear?'NOVITÀ '+cat.discoveryYear:cat.kind==='wild'?'SELVATICO':cat.kind==='domestic'?'SPECIE DOMESTICA':'DI CASA'}</span></div><div class="card-body"><div class="card-title-row"><h3>${escape(cat.name)}</h3><span class="card-arrow" aria-hidden="true">↗</span></div><p class="card-latin">${escape(cat.scientific)}${cat.kind==='breed'?' · razza':''}</p><p class="card-fact">${escape(cat.fact)}</p><div class="card-bottom"><span class="card-trait">${escape(cat.trait)}</span><span class="card-number">${String(cats.indexOf(cat)+1).padStart(2,'0')}</span></div></div></button>${favoriteButton(cat,true)}<span class="explored-stamp" ${album.seen.has(cat.id)?'':'hidden'}>✓ Esplorato</span></article>`).join('');
    $('#all-count').textContent=cats.length;
    $('#result-count').textContent=`${state.visible.length} ${state.visible.length===1?'scheda da esplorare':'schede da esplorare'}`;
    $('#empty').hidden=state.visible.length>0;
    $('#empty-title').textContent=state.view==='album'&&!query?(state.albumTab==='favorites'?'Il tuo album aspetta il primo musetto':'La prima scoperta ti aspetta'):'Nessun musetto trovato';
    $('#empty-description').textContent=state.view==='album'&&!query?(state.albumTab==='favorites'?'Tocca il cuore vicino a un gatto per ritrovarlo qui.':'Apri una scheda: qui ritroverai tutti i gatti che hai esplorato.'):'Prova con un altro nome, oppure esplora tutti i gatti.';
    $('#collection-heading').textContent=state.view==='album'?'Il mio album':'Scegli un musetto';
    $('#explore-filters').hidden=state.view==='album';
    $('#album-filters').hidden=state.view!=='album';
    $('#collection-hint').textContent=state.view==='album'?'I tuoi piccoli incontri, da ritrovare quando vuoi.':state.filter==='wild'?'I cugini selvatici: ammirali, conoscili, rispettali.':'Una foto, un dettaglio da cercare, una piccola scoperta.';
    $('#album-button').setAttribute('aria-pressed',String(state.view==='album'));
    $('#album-button-label').textContent=state.view==='album'?'Torna ai gatti':'Il mio album';
    document.querySelectorAll('[data-filter]').forEach(b=>{const active=b.dataset.filter===state.filter;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
    document.querySelectorAll('[data-album-tab]').forEach(b=>{const active=b.dataset.albumTab===state.albumTab;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
    syncAlbum();
  }
  function syncAlbum(){
    $('#favorite-count').textContent=album.favorites.size;
    $('#album-favorite-count').textContent=album.favorites.size;
    $('#album-seen-count').textContent=album.seen.size;
    $('#explored-count').textContent=`${album.seen.size} di ${cats.length} esplorati`;
    $('#album-progress').value=album.seen.size;$('#album-progress').max=cats.length;
    $('#album-progress').setAttribute('aria-label',`${album.seen.size} gatti esplorati su ${cats.length}`);
    $('#storage-note').textContent=album.persistent?'Il tuo album resta in questo browser, su questo dispositivo.':'Il browser non permette il salvataggio: l’album resterà disponibile solo in questa sessione.';
    $('#random-cat').disabled=state.visible.length===0;
  }
  function toggleFavorite(id){
    const cat=cats.find(c=>c.id===id);if(!cat)return;
    const saved=album.toggle(id);
    const focusInCatalog=document.activeElement?.closest('#catalog');
    render();
    document.querySelectorAll(`[data-favorite="${id}"]`).forEach(b=>{
      b.setAttribute('aria-pressed',String(saved));b.setAttribute('aria-label',`${saved?'Rimuovi':'Salva'} ${cat.name} ${saved?'dai':'nei'} preferiti`);
      const text=b.querySelector('span');if(text)text.textContent=saved?'Nel mio album':'Salva nel mio album';
      b.classList.remove('just-saved');if(saved)b.classList.add('just-saved');
    });
    if(focusInCatalog)(document.querySelector(`#catalog [data-favorite="${id}"]`)||$('#album-button')).focus({preventScroll:true});
    announce(`${cat.name} ${saved?'aggiunto ai':'rimosso dai'} preferiti.${album.persistent?'':' Salvataggio disponibile solo per questa sessione.'}`);
  }
  function credit(cat) {
    if(!cat.photo) return '';
    const p=cat.photo;
    return `<details class="photo-credit"><summary>Fotografia e fonte</summary><p>${escape(p.title)} — ${escape(p.author)}.<br><a href="${escape(p.source)}" target="_blank" rel="noopener noreferrer">Fotografia originale</a> · ${p.licenseUrl?`<a href="${escape(p.licenseUrl)}" target="_blank" rel="noopener noreferrer">${escape(p.license)}</a>`:escape(p.license)}.<br>Immagine ridimensionata e convertita in WebP. Nella scheda la foto è intera, con una copia sfocata sullo sfondo. <a href="${escape(cat.source)}" target="_blank" rel="noopener noreferrer">Scheda di riferimento</a>.</p></details>`;
  }
  function historyMarkup(cat) {
    const h=cat.history;if(!h)return '';
    return `<details class="cat-history"><summary><span>La sua storia</span><span class="history-preview">${escape(h.date)} <span aria-hidden="true">＋</span></span></summary><div class="history-content"><span class="history-label">${escape(h.label)}</span><p>${escape(h.note)}</p><a href="${escape(h.source)}" target="_blank" rel="noopener noreferrer">Fonte: ${escape(h.sourceName)} ↗</a></div></details>`;
  }
  const discoveries={
    b1:['Osserva gli occhi e il mantello. Quale dettaglio ti colpisce?','Come sono gli occhi del Ragdoll?'],
    b2:['Cerca la coda: quanto sembra folta?','Che cosa rende inconfondibile il Maine Coon?'],
    b3:['Cerca le parti più scure del mantello.','Quali parti del Siamese sono più scure?'],
    b4:['Guarda le guance tonde. Ti ricordano un orsacchiotto?','Il British Shorthair è sempre grigio?'],
    b6:['Cerca le macchie: alcune sembrano piccoli anelli?','Che forma possono avere le macchie del Bengala?'],
    b8:['Osserva i riflessi del mantello grigio-blu.','Di che colore sono gli occhi del Blu di Russia?'],
    b11:['Guarda le punte delle orecchie.','In quale direzione si incurvano le orecchie?'],
    b15:['Cerca le zampine bianche nella fotografia.','A che cosa somigliano le quattro zampine bianche?'],
    b17:['Osserva il pelo corto e la corporatura.','Che cosa sorprende del corpo del Burmese?'],
    b21:['Guarda il mantello: riesci a distinguere piccole onde?','Che cosa rende speciale il pelo del Cornish Rex?'],
    b27:['Cerca la codina nella foto, se è visibile.','A che cosa assomiglia la coda del Japanese Bobtail?'],
    b29:['Osserva la forma del musetto.','Quale forma ricorda il musetto del Korat?'],
    b39:['Osserva gli occhi e le orecchie.','Quali dettagli sono grandi nel piccolo Singapura?'],
    b40:['Guarda la coda folta: a che animale ti fa pensare?','A quale altra razza è parente il Somalo?'],
    b41:['Guarda da vicino il suo aspetto quasi senza pelo.','Lo Sphynx è sempre completamente senza pelo?'],
    w1:['Segui con gli occhi le strisce del mantello.','Tutte le tigri hanno le stesse strisce?'],
    w3:['Cerca la lunga coda, se è visibile nella fotografia.','A che cosa serve la lunga coda del leopardo delle nevi?'],
    w4:['Osserva le zampe e immaginalo sulla sabbia.','Che cosa c’è sotto le zampe del gatto delle sabbie?'],
    w5:['Osserva le orecchie basse e il pelo folto.','Che cosa dà al Manul il suo musetto inconfondibile?'],
    w6:['Guarda le punte delle orecchie.','Che cosa porta il Caracal sulle orecchie?'],
    w7:['Osserva il corpo e immaginalo mentre corre.','In che cosa è un campione il ghepardo?'],
    w8:['Cerca una rosetta nel mantello. Che cosa noti al centro?','Quale dettaglio puoi trovare nelle rosette del giaguaro?'],
    w10:['Guarda la forma delle grandi macchie.','A che cosa assomigliano le macchie del leopardo nebuloso?'],
    w41:['Osserva il mantello e poi scopri la sua storia.','Che cosa ha aiutato a riconoscere il tilcayo nel 2026?'],
    domestic:['Scegli un dettaglio del mantello e confrontalo con un altro gatto.','I gatti senza pedigree appartengono a una specie diversa?']
  };
  function openCat(id,updateHash=true,direction=0) {
    const cat=cats.find(c=>c.id===id);if(!cat)return;
    const wasOpen=catDialog.open;
    if(!wasOpen){state.opener=document.activeElement===document.body?null:document.activeElement;state.openerId=id;state.navigation=(state.visible.some(c=>c.id===id)?state.visible:cats).map(c=>c.id);}
    state.current=id;
    const firstVisit=album.visit(id);
    const wild=cat.kind==='wild';
    const discovery=discoveries[id]||['Scegli un dettaglio da ricordare: le orecchie, il mantello o la coda.',`Quale curiosità si nasconde nella scheda di ${cat.name}?`];
    $('#cat-details').innerHTML=`<div class="detail-top" style="--enter-x:${direction*18}px"><div class="detail-visual"><div class="photo-label"><span>RITRATTO N° ${String(cats.indexOf(cat)+1).padStart(2,'0')}</span><span class="mini-stamp">✓ Esplorato</span></div>${detailPhoto(cat)}<div class="look-note"><div class="guide">${guide('Mochi dice…','siamese')}</div><h3>Guarda bene!</h3><p>${escape(discovery[0])}</p></div><p class="swipe-hint">Scorri la foto per incontrare un altro gatto <span aria-hidden="true">↔</span></p></div><div class="detail-copy"><span class="detail-type">${label(cat)}</span><h2 id="cat-title">${escape(cat.name)}</h2><p class="detail-scientific">${escape(cat.scientific)}</p>${favoriteButton(cat)}<dl class="detail-specs"><div><dt>${wild?'Dove vive':cat.kind==='domestic'?'Dove lo trovi':'Origine / sviluppo'}</dt><dd>${escape(cat.place)}</dd></div><div><dt>${wild?'Il suo ambiente':'Il suo mantello'}</dt><dd>${escape(cat.trait)}</dd></div><div><dt>La sua famiglia</dt><dd>${cat.kind==='breed'?'Gatto domestico':cat.kind==='domestic'?'Felidi · specie domestica':'Felidi · specie selvatica'}</dd></div></dl><section class="discovery"><div class="guide">${guide('Yuzu è curiosa','ginger')}</div><p class="discovery-label">Una piccola scoperta</p><h3>${escape(discovery[1])}</h3><button class="reveal-button" id="reveal-fact" aria-expanded="false" aria-controls="discovery-answer">Svela la curiosità <span aria-hidden="true">↗</span></button><div id="discovery-answer" class="discovery-answer" hidden><p>${escape(cat.fact)}</p></div></section>${historyMarkup(cat)}</div></div><p class="detail-footnote">${wild?'I felini selvatici si ammirano nel loro ambiente, a distanza e rispettando la loro libertà.':'Ogni gatto ha il suo carattere. Avvicinati con calma e lascia che sia lui a scegliere quando farsi accarezzare.'}</p>${credit(cat)}`;
    const index=state.navigation.indexOf(id);
    $('#dialog-position').textContent=`${index+1} / ${state.navigation.length}`;
    $('#previous-cat').disabled=index<=0;$('#next-cat').disabled=index===state.navigation.length-1;
    if(infoDialog.open)infoDialog.close();
    if(!catDialog.open){catDialog.showModal();document.body.style.overflow='hidden';}
    catDialog.scrollTop=0;$('#cat-details').scrollTop=0;
    if(updateHash)updateURL('#'+id);
    render();
    if(firstVisit)announce(`${cat.name}: una nuova scoperta nel tuo album.`);
    if(wasOpen)$('#cat-title').setAttribute('tabindex','-1');
    if(wasOpen)$('#cat-title').focus({preventScroll:true});
  }
  function stepCat(delta){
    const index=state.navigation.indexOf(state.current);
    if(state.navigation[index+delta])openCat(state.navigation[index+delta],true,delta);
  }
  function openInfo(content){
    if(catDialog.open)catDialog.close();
    $('#info-content').innerHTML=content;
    infoDialog.showModal();document.body.style.overflow='hidden';infoDialog.scrollTop=0;
  }
  const about=`<h2 id="info-title">Una famiglia, tante differenze <span aria-hidden="true">🐾</span></h2><div class="info-cards"><div class="info-card"><span aria-hidden="true">🐈</span><h3>Che cos'è una specie?</h3><p>Il leone, la tigre e il gatto domestico sono specie diverse. Sono tutti parenti: appartengono alla famiglia dei felidi.</p></div><div class="info-card"><span aria-hidden="true">🎀</span><h3>E una razza?</h3><p>Persiano, Siamese e Maine Coon sono razze del gatto domestico. Cambiano nell'aspetto, ma appartengono alla stessa specie: <em>Felis catus</em>.</p></div></div><h3>E il gatto che incontri ogni giorno?</h3><p>Molti gatti non hanno una razza riconosciuta. Sono gatti domestici, proprio come quelli con pedigree. E sono altrettanto speciali!</p><h3>Che cosa trovi qui</h3><p>Le 40 specie selvatiche del riferimento CatSG 2017, il tilcayo descritto nel 2026, il gatto domestico e le 45 razze del catalogo CFA.</p><p class="fine-print">Le classificazioni possono cambiare con nuove ricerche. Nella sezione «Foto, fonti e catalogo» trovi i riferimenti e i limiti dell'elenco.</p>`;
  function sources(){
    const items=cats.map(c=>`<li><strong>${escape(c.name)}</strong><a href="${escape(c.source||'https://en.wikipedia.org/wiki/'+c.wiki)}" target="_blank" rel="noopener noreferrer">Scheda enciclopedica</a>${c.photo?` · Foto: ${escape(c.photo.author)} · <a href="${escape(c.photo.source)}" target="_blank" rel="noopener noreferrer">originale e attribuzione</a> · ${c.photo.licenseUrl?`<a href="${escape(c.photo.licenseUrl)}" target="_blank" rel="noopener noreferrer">${escape(c.photo.license)}</a>`:escape(c.photo.license)}`:''}</li>`).join('');
    openInfo(`<h2 id="info-title">Foto, fonti e catalogo</h2><h3>42 specie nel nostro catalogo</h3><p>Il catalogo comprende tutte le <a href="https://www.catsg.org/cats/livingspecies" target="_blank" rel="noopener noreferrer">40 specie selvatiche elencate dal Cat Specialist Group IUCN</a>, più il gatto domestico e il tilcayo (<em>Leopardus tilcayo</em>), descritto nel settembre 2026. La base segue la <a href="https://www.catsg.org/classification" target="_blank" rel="noopener noreferrer">classificazione CatSG del 2017</a>, attualmente in revisione. Il tilcayo è un aggiornamento successivo a quel riferimento: non era incluso nell’elenco del 2017. Le 42 specie sono quelle presenti qui, non un nuovo conteggio universale dei felidi. Altre revisioni recenti possono distinguere ulteriori specie.</p><h3>La novità del 2026: il tilcayo</h3><p>Un piccolo felino delle foreste degli Yungas, in Bolivia, già conosciuto dalle comunità locali. Le analisi del DNA hanno aiutato a riconoscerlo come una specie distinta. Fonti: <a href="https://www.nationalgeographic.it/scoperta-una-nuova-specie-di-felino-bolivia" target="_blank" rel="noopener noreferrer">National Geographic</a> e <a href="https://www.cell.com/current-biology/fulltext/S0960-9822(26)01110-3" target="_blank" rel="noopener noreferrer">studio su Current Biology</a>. Molti aspetti della sua vita in natura sono ancora da studiare.</p><h3>45 razze domestiche</h3><p>Le razze seguono il <a href="https://cfa.org/breeds/" target="_blank" rel="noopener noreferrer">catalogo della Cat Fanciers' Association</a>. Altri registri riconoscono razze e varietà aggiuntive. Le varietà a pelo corto e lungo sono raggruppate quando il registro le tratta insieme.</p><p class="fine-print">Riferimenti di base consultati il 20 settembre 2026; tilcayo aggiunto e verificato il 22 settembre 2026. Testi brevi, rielaborati per la lettura dei bambini. Le informazioni sulle origini indicano la provenienza o il luogo di sviluppo della razza, non l'origine di ogni singolo gatto.</p><h3>Come leggere le date</h3><p>Ogni scheda indica una data documentata e l'evento a cui si riferisce. Per le specie riportiamo la descrizione scientifica del nome, secondo il <a href="https://www.mammaldiversity.org/" target="_blank" rel="noopener noreferrer">Mammal Diversity Database (v2.5)</a>; per il tilcayo, lo studio del 2026. Non è necessariamente l'anno in cui la specie è stata distinta nella classificazione attuale. Per le razze usiamo le storie della CFA: origine, prime testimonianze o riconoscimento ufficiale. Una razza antica può non avere una data esatta di origine. Il riconoscimento CFA riguarda quel registro, non tutti i registri del mondo. La fonte specifica è collegata in ogni scheda.</p><h3>Un grazie ai fotografi ♡</h3><p>Le fotografie provengono da Wikimedia Commons. Qui trovi autore, originale e licenza di ogni immagine. Le immagini sono state ridimensionate e convertite in WebP. Le foto sono mostrate intere su una copia sfocata che riempie il riquadro. Ogni fotografia conserva la propria licenza.</p><p class="fine-print">L'illustrazione dei tre gattini è stata creata appositamente con AI: è una mascotte, non un ritratto scientifico. Nessuna pubblicità, nessun account e nessun tracciamento.</p><ol class="source-list">${items}</ol>`);
  }
  $('#explore-filters').addEventListener('click',event=>{const button=event.target.closest('[data-filter]');if(!button)return;state.filter=button.dataset.filter;render();});
  $('#album-filters').addEventListener('click',event=>{const button=event.target.closest('[data-album-tab]');if(!button)return;state.albumTab=button.dataset.albumTab;render();});
  $('#search').addEventListener('input',event=>{state.query=event.target.value;render();});
  $('#catalog').addEventListener('click',event=>{const favorite=event.target.closest('[data-favorite]');if(favorite){toggleFavorite(favorite.dataset.favorite);return;}const button=event.target.closest('[data-cat]');if(button)openCat(button.dataset.cat);});
  $('#cat-details').addEventListener('click',event=>{
    const favorite=event.target.closest('[data-favorite]');if(favorite){toggleFavorite(favorite.dataset.favorite);return;}
    const reveal=event.target.closest('#reveal-fact');if(reveal){const expanded=reveal.getAttribute('aria-expanded')!=='true';reveal.setAttribute('aria-expanded',String(expanded));reveal.innerHTML=expanded?'Nascondi la risposta <span aria-hidden="true">−</span>':'Svela la curiosità <span aria-hidden="true">↗</span>';$('#discovery-answer').hidden=!expanded;}
  });
  function exploreAll(){state.view='explore';state.filter='all';state.query='';$('#search').value='';render();}
  $('#reset').addEventListener('click',()=>{exploreAll();$('#search').focus();});
  $('#album-button').addEventListener('click',()=>{state.view=state.view==='album'?'explore':'album';state.query='';$('#search').value='';render();$('#collection').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});});
  $('#random-cat').addEventListener('click',()=>{const unseen=state.visible.filter(c=>!album.seen.has(c.id));const pool=unseen.length?unseen:state.visible;if(pool.length)openCat(pool[Math.floor(Math.random()*pool.length)].id);});
  $('#about-button').addEventListener('click',()=>openInfo(about));
  $('#sources-button').addEventListener('click',sources);
  $('#previous-cat').addEventListener('click',()=>stepCat(-1));$('#next-cat').addEventListener('click',()=>stepCat(1));
  document.querySelectorAll('dialog').forEach(dialog=>{
    dialog.querySelector('.close-dialog').addEventListener('click',()=>dialog.close());
    dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
    dialog.addEventListener('close',()=>{if(!catDialog.open&&!infoDialog.open)document.body.style.overflow='';if(dialog===catDialog){updateURL(location.pathname+location.search);if(!infoDialog.open){const opener=state.opener?.isConnected?state.opener:document.querySelector(`[data-cat="${state.openerId}"]`)||$('#album-button');opener.focus({preventScroll:true});}}});
  });
  catDialog.addEventListener('keydown',event=>{if(event.target.closest('input,textarea,select,summary'))return;if(event.key==='ArrowRight'){event.preventDefault();stepCat(1);}if(event.key==='ArrowLeft'){event.preventDefault();stepCat(-1);}});
  let gesture=null;
  $('#cat-details').addEventListener('pointerdown',event=>{if(event.pointerType!=='touch'||!event.target.closest('.detail-photo'))return;gesture={x:event.clientX,y:event.clientY,id:event.pointerId};});
  $('#cat-details').addEventListener('pointerup',event=>{if(!gesture||gesture.id!==event.pointerId)return;const dx=event.clientX-gesture.x,dy=event.clientY-gesture.y;gesture=null;if(Math.abs(dx)>60&&Math.abs(dy)<45&&Math.abs(dx)>Math.abs(dy)*1.6)stepCat(dx<0?1:-1);});
  $('#cat-details').addEventListener('pointercancel',()=>{gesture=null;});
  document.addEventListener('error',event=>{const img=event.target;if(img.tagName==='IMG'&&!img.closest('.intro-art')){if(img.classList.contains('detail-backdrop')||img.classList.contains('preview-backdrop')){img.remove();return;}const box=document.createElement('div');box.className=img.className+' text-portrait';box.innerHTML=`<span aria-hidden="true">🐾</span><p>La foto non è disponibile.<br>La sua storia ti aspetta!</p>`;img.replaceWith(box);}},true);
  render();
  const initial=location.hash.slice(1);if(cats.some(c=>c.id===initial))openCat(initial,false);
  window.addEventListener('hashchange',()=>{const id=location.hash.slice(1);if(cats.some(c=>c.id===id))openCat(id,false);else if(catDialog.open)catDialog.close();});
})();
