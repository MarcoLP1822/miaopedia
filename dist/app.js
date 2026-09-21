(() => {
  'use strict';
  const cats = window.CATS || [];
  const $ = (s) => document.querySelector(s);
  const escape = (value) => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const updateURL = url => { try { history.replaceState(null,'',url); } catch { /* Some file previews disallow history updates. */ } };
  const state = {filter:'all',query:'',visible:[],current:null,opener:null};
  const catDialog = $('#cat-dialog');
  const infoDialog = $('#info-dialog');
  const label = cat => cat.kind === 'wild' ? 'Felino selvatico' : cat.kind === 'domestic' ? 'Specie domestica' : 'Razza domestica';
  const imageMarkup = (cat, className, lazy = true, fit = cat.photo?.fit) => cat.photo ? `<img class="${className}" style="object-fit:${fit==='contain'?'contain':'cover'}" src="${escape(cat.photo.src.startsWith('data:') ? cat.photo.src : './'+cat.photo.src)}" alt="${escape(cat.name)}" ${lazy ? 'loading="lazy"' : ''} decoding="async" width="700" height="700">` : `<div class="${className} text-portrait"><span aria-hidden="true">🐾</span><p>${escape(cat.scientific)}</p></div>`;


  function detailPhoto(cat) {
    const backdrop = cat.photo ? `<img class="detail-backdrop" src="${escape(cat.photo.src.startsWith('data:') ? cat.photo.src : './'+cat.photo.src)}" alt="" aria-hidden="true" decoding="async">` : '';
    return `<div class="detail-photo">${backdrop}${imageMarkup(cat,'detail-image',false,'contain')}</div>`;
  }

  function render() {
    const query = normalize(state.query.trim());
    state.visible = cats.filter(cat => (state.filter === 'all' || (state.filter === 'home' ? cat.kind !== 'wild' : cat.kind === 'wild')) && normalize([cat.name,cat.wiki.replaceAll('_',' '),cat.scientific,cat.place,cat.trait].join(' ')).includes(query));
    $('#catalog').innerHTML = state.visible.map((cat,i) => `<article class="cat-card"><button class="card-open" data-cat="${cat.id}" aria-label="Scopri ${escape(cat.name)}"><div class="photo-wrap">${imageMarkup(cat,'',i>3)}<span class="card-stamp ${cat.kind==='wild'?'wild':''}">${cat.kind==='wild'?'SELVATICO':cat.kind==='domestic'?'SPECIE DOMESTICA':'DI CASA'}</span></div><div class="card-body"><div class="card-title-row"><h3>${escape(cat.name)}</h3><span class="card-arrow" aria-hidden="true">↗</span></div><p class="card-latin">${escape(cat.scientific)}${cat.kind==='breed'?' · razza':''}</p><p class="card-fact">${escape(cat.fact)}</p><div class="card-bottom"><span class="card-trait">${escape(cat.trait)}</span><span class="card-number">N° ${String(cats.indexOf(cat)+1).padStart(2,'0')}</span></div></div></button></article>`).join('');
    const count = state.visible.length;
    $('#result-count').textContent = `${count} ${count===1?'scheda da esplorare':'schede da esplorare'}`;
    $('#empty').hidden = count > 0;
    $('#collection-hint').hidden = count === 0;
    $('#collection-hint').textContent = state.filter === 'wild' ? '40 specie nella classificazione di riferimento CatSG. Tocca una scheda per conoscerle.' : state.filter === 'home' ? 'Una specie, tante razze. Anche i gatti senza pedigree sono speciali!' : 'Tocca una scheda e scopri la sua storia.';
    document.querySelectorAll('.filter').forEach(button => {
      const active=button.dataset.filter===state.filter;
      button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));
    });
  }
  function credit(cat) {
    if(!cat.photo) return '';
    const p=cat.photo;
    return `<details class="photo-credit"><summary>Fotografia e fonte</summary><p>${escape(p.title)} — ${escape(p.author)}.<br><a href="${escape(p.source)}" target="_blank" rel="noopener noreferrer">Fotografia originale</a> · ${p.licenseUrl?`<a href="${escape(p.licenseUrl)}" target="_blank" rel="noopener noreferrer">${escape(p.license)}</a>`:escape(p.license)}.<br>Immagine ridimensionata e convertita in WebP. Nella scheda la foto è intera, con una copia sfocata sullo sfondo. <a href="${escape(cat.source)}" target="_blank" rel="noopener noreferrer">Scheda di riferimento</a>.</p></details>`;
  }
  function openCat(id,updateHash=true) {
    const cat=cats.find(c=>c.id===id);if(!cat)return;
    if(!catDialog.open)state.opener=document.activeElement;
    state.current=id;
    const wild=cat.kind==='wild';
    $('#cat-details').innerHTML=`<div class="detail-top">${detailPhoto(cat)}<div class="detail-copy"><span class="detail-type">${label(cat)}</span><h2 id="cat-title">${escape(cat.name)}</h2><p class="detail-scientific">${escape(cat.scientific)}</p><div class="fact-box"><strong>✦ Lo sapevi?</strong><p>${escape(cat.fact)}</p></div><dl class="detail-specs"><div><dt>${wild?'DOVE VIVE':cat.kind==='domestic'?'DOVE LO TROVI':'ORIGINE / SVILUPPO'}</dt><dd>${escape(cat.place)}</dd></div><div><dt>${wild?'IL SUO AMBIENTE':'IL SUO MANTELLO'}</dt><dd>${escape(cat.trait)}</dd></div></dl></div></div><p class="detail-footnote">${wild?'I felini selvatici si ammirano nel loro ambiente, a distanza e rispettando la loro libertà.':'Ogni gatto ha il suo carattere. Avvicinati con calma e lascia che sia lui a scegliere quando farsi accarezzare.'}</p>${credit(cat)}`;
    const list=state.visible.some(c=>c.id===id)?state.visible:cats;
    const index=list.findIndex(c=>c.id===id);
    $('#dialog-position').textContent=`${index+1} di ${list.length}`;
    $('#previous-cat').disabled=index===0;$('#next-cat').disabled=index===list.length-1;
    if(infoDialog.open)infoDialog.close();
    if(!catDialog.open){catDialog.showModal();document.body.style.overflow='hidden';}
    catDialog.scrollTop=0;$('#cat-details').scrollTop=0;
    if(updateHash)updateURL('#'+id);
  }
  function stepCat(delta){
    const list=state.visible.some(c=>c.id===state.current)?state.visible:cats;
    const index=list.findIndex(c=>c.id===state.current);
    if(list[index+delta])openCat(list[index+delta].id);
  }
  function openInfo(content){
    if(catDialog.open)catDialog.close();
    $('#info-content').innerHTML=content;
    infoDialog.showModal();document.body.style.overflow='hidden';infoDialog.scrollTop=0;
  }
  const about=`<h2 id="info-title">Una famiglia, tante differenze <span aria-hidden="true">🐾</span></h2><div class="info-cards"><div class="info-card"><span aria-hidden="true">🐈</span><h3>Che cos'è una specie?</h3><p>Il leone, la tigre e il gatto domestico sono specie diverse. Sono tutti parenti: appartengono alla famiglia dei felidi.</p></div><div class="info-card"><span aria-hidden="true">🎀</span><h3>E una razza?</h3><p>Persiano, Siamese e Maine Coon sono razze del gatto domestico. Cambiano nell'aspetto, ma appartengono alla stessa specie: <em>Felis catus</em>.</p></div></div><h3>E il gatto che incontri ogni giorno?</h3><p>Molti gatti non hanno una razza riconosciuta. Sono gatti domestici, proprio come quelli con pedigree. E sono altrettanto speciali!</p><h3>Che cosa trovi qui</h3><p>Le 40 specie selvatiche dell'elenco di riferimento del Cat Specialist Group, il gatto domestico e le 45 razze del catalogo CFA.</p><p class="fine-print">Le classificazioni possono cambiare con nuove ricerche. Nella sezione «Foto, fonti e catalogo» trovi i riferimenti e i limiti dell'elenco.</p>`;
  function sources(){
    const items=cats.map(c=>`<li><strong>${escape(c.name)}</strong><a href="${escape(c.source||'https://en.wikipedia.org/wiki/'+c.wiki)}" target="_blank" rel="noopener noreferrer">Scheda enciclopedica</a>${c.photo?` · Foto: ${escape(c.photo.author)} · <a href="${escape(c.photo.source)}" target="_blank" rel="noopener noreferrer">originale e attribuzione</a> · ${c.photo.licenseUrl?`<a href="${escape(c.photo.licenseUrl)}" target="_blank" rel="noopener noreferrer">${escape(c.photo.license)}</a>`:escape(c.photo.license)}`:''}</li>`).join('');
    openInfo(`<h2 id="info-title">Foto, fonti e catalogo</h2><h3>41 specie, secondo un riferimento preciso</h3><p>Il catalogo comprende tutte le <a href="https://www.catsg.org/cats/livingspecies" target="_blank" rel="noopener noreferrer">40 specie selvatiche elencate dal Cat Specialist Group IUCN</a>, più il gatto domestico. Segue la <a href="https://www.catsg.org/classification" target="_blank" rel="noopener noreferrer">classificazione CatSG del 2017</a>, attualmente in revisione. Non è un elenco di tutte le nuove proposte tassonomiche: ricerche recenti possono distinguere ulteriori specie.</p><h3>45 razze domestiche</h3><p>Le razze seguono il <a href="https://cfa.org/breeds/" target="_blank" rel="noopener noreferrer">catalogo della Cat Fanciers' Association</a>. Altri registri riconoscono razze e varietà aggiuntive. Le varietà a pelo corto e lungo sono raggruppate quando il registro le tratta insieme.</p><p class="fine-print">Riferimenti consultati il 20 settembre 2026. Testi brevi, rielaborati per la lettura dei bambini. Le informazioni sulle origini indicano la provenienza o il luogo di sviluppo della razza, non l'origine di ogni singolo gatto.</p><h3>Un grazie ai fotografi ♡</h3><p>Le fotografie provengono da Wikimedia Commons. Qui trovi autore, originale e licenza di ogni immagine. Le immagini sono state ridimensionate, convertite in WebP e possono essere ritagliate nella visualizzazione. Ogni fotografia conserva la propria licenza.</p><p class="fine-print">L'illustrazione dei tre gattini è stata creata appositamente con AI: è una mascotte, non un ritratto scientifico. Nessuna pubblicità, nessun account e nessun tracciamento.</p><ol class="source-list">${items}</ol>`);
  }
  $('.filters').addEventListener('click',event=>{const button=event.target.closest('[data-filter]');if(!button)return;state.filter=button.dataset.filter;render();});
  $('#search').addEventListener('input',event=>{state.query=event.target.value;render();});
  $('#catalog').addEventListener('click',event=>{const button=event.target.closest('[data-cat]');if(button)openCat(button.dataset.cat);});
  $('#reset').addEventListener('click',()=>{state.filter='all';state.query='';$('#search').value='';render();$('#search').focus();});
  $('#about-button').addEventListener('click',()=>openInfo(about));
  $('#sources-button').addEventListener('click',sources);
  $('#previous-cat').addEventListener('click',()=>stepCat(-1));$('#next-cat').addEventListener('click',()=>stepCat(1));
  document.querySelectorAll('dialog').forEach(dialog=>{
    dialog.querySelector('.close-dialog').addEventListener('click',()=>dialog.close());
    dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
    dialog.addEventListener('close',()=>{if(!catDialog.open&&!infoDialog.open)document.body.style.overflow='';if(dialog===catDialog){updateURL(location.pathname+location.search);if(state.opener?.isConnected)state.opener.focus();}});
  });
  document.addEventListener('error',event=>{const img=event.target;if(img.tagName==='IMG'&&!img.closest('.intro-art')){if(img.classList.contains('detail-backdrop')){img.remove();return;}const box=document.createElement('div');box.className=img.className+' text-portrait';box.innerHTML=`<span aria-hidden="true">🐾</span><p>La foto non è disponibile.<br>La sua storia ti aspetta!</p>`;img.replaceWith(box);}},true);
  render();
  const initial=location.hash.slice(1);if(cats.some(c=>c.id===initial))openCat(initial,false);
  window.addEventListener('hashchange',()=>{const id=location.hash.slice(1);if(cats.some(c=>c.id===id))openCat(id,false);else if(catDialog.open)catDialog.close();});
})();
