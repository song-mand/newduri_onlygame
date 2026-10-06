/* Standalone, local-only web prototype. No production app services. */
(function(){
  'use strict';
  document.title='두리 — 지도와 수집함';
  const $=selector=>document.querySelector(selector);
  const $$=selector=>[...document.querySelectorAll(selector)];
  const M=DuriModel,A=DuriArt,{categories}=DuriData;
  const repository=DuriData.createMockPlaceRepository();
  const regions=repository.listRegions(),cities=regions.flatMap(r=>r.cities);
  const NS='http://www.w3.org/2000/svg';
  let features=null;
  let state={version:1,selectedCityId:cities[0].id,cities:{},fps:20};
  let storageAvailable=true;
  try{
    const raw=JSON.parse(localStorage.getItem(M.STORAGE_KEY)||'null');
    if(raw?.version===1){
      state.selectedCityId=cities.some(c=>c.id===raw.selectedCityId)?raw.selectedCityId:cities[0].id;
      state.fps=raw.fps===30?30:20;
      for(const city of cities)if(raw.cities?.[city.id])state.cities[city.id]=M.normalizeCity(raw.cities[city.id]);
    }
  }catch{storageAvailable=false;}
  let view='map',selectedCategory=null,toastTimer,placeRequest=0,lastFrame=0,tick=0,heldDirection=null;
  let actors=[],scenery=[],destination=null;
  const buildingPositions=[[1.35,1.35],[4.6,1.35],[1.35,4.6],[4.6,4.6],[4.55,-.45]];
  const getCity=()=>cities.find(c=>c.id===state.selectedCityId);
  const getRegion=()=>regions.find(r=>r.id===getCity().regionId);
  function cityState(){return state.cities[state.selectedCityId] ||= M.freshCity();}
  function save(){
    try{localStorage.setItem(M.STORAGE_KEY,JSON.stringify(state));storageAvailable=true;}catch{storageAvailable=false;}
    $('#storage-warning').classList.toggle('hidden',storageAvailable);
    features?.sync();
  }
  function toast(message){
    clearTimeout(toastTimer);$('#toast').innerHTML=message;$('#toast').classList.remove('hidden');
    toastTimer=setTimeout(()=>$('#toast').classList.add('hidden'),4500);
  }
  function syncHash(){if(location.hash!=='#'+view) history.replaceState(null,'','#'+view);}
  function setView(next){
    if(!['map','village','collection'].includes(next))next='map';
    view=next;heldDirection=null;
    document.body.dataset.view=view;
    $('.inspector').classList.toggle('hidden',view!=='village');
    ['map','village','collection'].forEach(id=>$('#'+id+'-view').classList.toggle('hidden',id!==view));
    $$('.nav-button').forEach(button=>{button.classList.toggle('active',button.dataset.view===view);button.setAttribute('aria-current',button.dataset.view===view?'page':'false');});
    const titles={map:['','지도',''],village:['',getCity().name+' 마을',''],collection:['','수집함','']};
    $('#eyebrow').textContent=titles[view][0];$('#page-title').textContent=titles[view][1];$('#page-description').textContent=titles[view][2];
    $('#enter-village').innerHTML='마을 화면으로 이동 <span>↗</span>';
    if(view==='village'){features?.renderPanel();if(!actors.length)resetActors();renderVillage();}
    if(view==='collection')renderCollection();
    syncHash();
  }
  function selectCity(id){
    if(!cities.some(c=>c.id===id))return;
    state.selectedCityId=id;selectedCategory=null;cityState();save();resetActors();
    renderRegionPicker();renderMap();renderInspector();loadPlaces();setView(view);
  }
  function renderRegionPicker(){
    $('#region-select').innerHTML=regions.map(region=>'<option value="'+region.id+'">'+region.name+'</option>').join('');
    $('#region-select').value=getRegion().id;
    $('#city-list').innerHTML=getRegion().cities.map(city=>'<button data-city="'+city.id+'" class="'+(city.id===state.selectedCityId?'active':'')+'" aria-pressed="'+(city.id===state.selectedCityId)+'">'+city.name+'</button>').join('');
  }
  function renderMap(){
    const totalGrown=Object.values(state.cities).filter(city=>categories.some(c=>M.levelFor(city.counts[c.id])>1)).length;
    let markup='<defs><linearGradient id="map-land" x2=".6" y2="1"><stop stop-color="#e1e7ce"/><stop offset="1" stop-color="#d4dec4"/></linearGradient><pattern id="map-dots" width="19" height="19" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r=".8" fill="#b6c5aa" opacity=".3"/></pattern></defs><ellipse cx="325" cy="519" rx="171" ry="31" fill="#b5c6a5" opacity=".13"/><path d="M335 47L373 77L389 117L418 153L431 193L453 224L465 269L467 309L494 349L498 392L478 437L446 463L422 465L404 490L378 480L352 502L326 485L302 512L278 503L258 524L239 508L219 526L206 504L181 512L172 483L150 479L159 456L139 437L161 413L153 389L171 370L165 345L175 323L153 299L163 275L153 252L173 229L170 204L190 185L192 161L211 149L208 126L237 127L251 107L283 108L298 78Z" fill="url(#map-land)" stroke="#f8faec" stroke-width="4" stroke-linejoin="round"/><path d="M335 47L373 77L389 117L418 153L431 193L453 224L465 269L467 309L494 349L498 392L478 437L446 463L422 465L404 490L378 480L352 502L326 485L302 512L278 503L258 524L239 508L219 526L206 504L181 512L172 483L150 479L159 456L139 437L161 413L153 389L171 370L165 345L175 323L153 299L163 275L153 252L173 229L170 204L190 185L192 161L211 149L208 126L237 127L251 107L283 108L298 78Z" fill="url(#map-dots)"/><g stroke="#f4f6e9" stroke-width="2" fill="none"><path d="M282 107l28 77-11 48-106 17M310 184l107 4M299 232l55 29 99-37M170 326l79 19 54-26 51-58M249 345l-11 60 104 13 32-48 94-61M158 414l80-9M342 418l2 76M374 370l80 60"/></g><path d="M110 598q22-24 64-14q21 11-13 25q-43 10-51-11Z" fill="#d5dfc4" stroke="#f7f9ed" stroke-width="3"/><g fill="#cbd9c1" opacity=".6"><ellipse cx="138" cy="527" rx="7" ry="4"/><ellipse cx="178" cy="543" rx="10" ry="5"/><ellipse cx="397" cy="514" rx="9" ry="5"/></g><text x="492" y="240" fill="#b2c5b3" font-size="10" letter-spacing="4" transform="rotate(15 492 240)">동해</text><text x="100" y="345" fill="#b2c5b3" font-size="10" letter-spacing="4">서해</text>';
    for(const region of regions){
      const selected=getRegion().id===region.id;
      const grown=region.cities.some(city=>{const data=state.cities[city.id];return data&&categories.some(c=>data.counts[c.id]>=3);});
      markup+='<g class="map-pin" data-region="'+region.id+'" role="button" tabindex="0" aria-label="'+region.name+' 지역 선택" aria-pressed="'+selected+'" transform="translate('+region.x+' '+region.y+')"><circle r="21" fill="transparent"/>'+(selected?'<circle r="23" fill="#668264" opacity=".1"/><circle r="18" fill="#668264" opacity=".12"/>':'')+'<circle class="marker" r="'+(selected?12:8)+'" fill="'+(selected?'#668264':grown?'#a8be8b':'#fffdf3')+'" stroke="'+(selected?'#fffdf3':'#b9c8a4')+'" stroke-width="2"/><text y="'+(selected?5:3)+'" text-anchor="middle" font-size="'+(selected?12:8)+'" fill="'+(selected?'#fff':'#a6b98f')+'">'+(selected?'⌂':grown?'✦':'·')+'</text><rect x="-22" y="17" width="44" height="21" rx="10" fill="'+(selected?'#fdfdf5':'#f3f6e9')+'" opacity=".92"/><text y="31" text-anchor="middle" fill="'+(selected?'#54704e':'#839374')+'" font-size="10" font-weight="'+(selected?700:400)+'">'+region.name+'</text></g>';
    }
    markup+='<g transform="translate(435 558)">'+A.rainbow(0,0,.55)+'<text y="32" text-anchor="middle" fill="#93a383" font-size="10">자라나는 마을 '+totalGrown+'곳</text></g>';
    $('#korea-map').innerHTML=markup;
  }
  function renderInspector(){
    const city=getCity(),data=cityState();
    $('#selected-city-title').textContent=city.name+' 마을';
    $('#selected-region-name').textContent=getRegion().name;
    $('#village-address').textContent=getRegion().name+' / '+city.name+' 마을';
    $('#total-shares').textContent=Object.values(data.counts).reduce((a,b)=>a+b,0);
    $('#grown-buildings').innerHTML=categories.filter(c=>M.levelFor(data.counts[c.id])>1).length+'<small>/5</small>';
    $('#city-rewards').innerHTML=data.earned.length+'<small>/11</small>';
    $('#collection-count').textContent=Object.values(state.cities).reduce((sum,city)=>sum+city.earned.length,0)+(features?.snapshot().state.unlocked.length||0);
    $('#category-controls').innerHTML=categories.map(category=>{
      const count=data.counts[category.id],level=M.levelFor(count),next=level===1?3:7;
      const progress=level===3?100:Math.min(100,count/next*100);
      return '<article class="category-card '+(selectedCategory===category.id?'selected':'')+'" style="--accent:'+category.color+';--dark:'+category.dark+'"><div class="category-top"><span class="category-icon" aria-hidden="true">'+category.icon+'</span><div class="category-info"><h4>'+category.name+'<small>Lv.'+level+'</small></h4><p>'+category.title[level-1]+'</p></div><div class="stepper"><button id="minus-'+category.id+'" data-category="'+category.id+'" data-delta="-1" aria-label="'+category.name+' 공유 수 감소" '+(count===0?'disabled':'')+'>−</button><output aria-label="'+category.name+' 공유 수">'+count+'</output><button id="plus-'+category.id+'" data-category="'+category.id+'" data-delta="1" aria-label="'+category.name+' 공유 수 증가" '+(count>=M.MAX_COUNT?'disabled':'')+'>+</button></div></div><div class="progress-track" role="progressbar" aria-label="'+category.name+' 성장" aria-valuenow="'+count+'" aria-valuemin="0" aria-valuemax="99" aria-valuetext="'+count+'회 공유, '+level+'단계"><span style="width:'+progress+'%"></span></div><div class="progress-caption"><span>'+(level===3?'최고 단계에 도착했어요':'다음 성장까지 '+(next-count)+'회')+'</span><b>'+(level===3?'✦ MAX':count+' / '+next)+'</b></div></article>';
    }).join('');
    $('#storage-warning').classList.toggle('hidden',storageAvailable);
    features?.renderPanel();
  }
  async function loadPlaces(){
    const request=++placeRequest;
    $('#place-list').innerHTML='<li>장소를 불러오는 중…</li>';
    try{
      const places=await repository.listPlaces(state.selectedCityId);
      if(request!==placeRequest)return;
      $('#place-list').replaceChildren(...places.map(place=>{
        const item=document.createElement('li'),label=document.createElement('span');
        item.textContent=place.name;label.textContent=categories.find(c=>c.id===place.categoryId)?.name||'기타';
        item.append(label);features?.renderPlaceActions(item,place);return item;
      }));
    }catch{if(request===placeRequest)$('#place-list').innerHTML='<li>장소를 불러오지 못했어요. 도시를 다시 선택해주세요.</li>';}
  }
  function rewardMessage(unlocked){
    if(!unlocked.length)return;
    if(unlocked.includes('rainbow'))toast('<strong>모든 건물 3단계 달성</strong> · 무지개 아치 획득');
    else{
      const id=unlocked[0],category=categories.find(c=>id.startsWith(c.id+'-'));
      toast('<strong>'+category.name+' 성장</strong> · '+category.reward+(id.endsWith('-3')?' 트로피':' 배지')+' 획득');
    }
  }
  function change(category,delta){
    const focused=document.activeElement?.id;
    selectedCategory=category;
    const previousLevel=M.levelFor(cityState().counts[category]);
    const unlocked=M.changeCount(cityState(),category,delta);
    save();renderInspector();renderMap();
    if(view==='village'){
      if(previousLevel!==M.levelFor(cityState().counts[category])||unlocked.length)renderVillage();
      else $$('.building-art').forEach(el=>el.classList.toggle('selected',el.parentElement.dataset.building===category));
    }
    if(view==='collection')renderCollection();
    if(focused)document.getElementById(focused)?.focus({preventScroll:true});
    rewardMessage(unlocked);
  }
  function renderCollection(){
    const data=cityState();
    $('#collection-city').textContent=getCity().name+' 마을 · '+data.earned.length+' / 11';
    $('#reward-grid').innerHTML=categories.flatMap(category=>[2,3].map(level=>{
      const earned=data.earned.includes(category.id+'-'+level);
      return '<article class="reward '+(earned?'':'locked')+'" style="--reward-bg:'+category.color+'40;--reward-ink:'+category.dark+'">'+(earned?'<span class="owned">✓</span>':'')+'<div class="reward-icon">'+(level===3?'♜':category.icon)+'</div><h3>'+category.reward+' '+(level===3?'트로피':'배지')+'</h3><p>'+category.name+' '+(level===3?7:3)+'회 공유 · '+(earned?'획득 완료':'잠김')+'</p></article>';
    })).join('')+'<article class="reward rainbow-reward '+(data.earned.includes('rainbow')?'':'locked')+'"><div class="reward-icon">🌈</div><div><h3>무지개 아치</h3><p>모든 건물 3단계 · '+(data.earned.includes('rainbow')?'획득 완료':'미달성')+'</p></div></article>';
    features?.renderCollection();
  }
  function resetActors(){
    heldDirection=null;destination=null;
    actors=[
      {id:'duri',kind:'otter',x:3,y:3,angle:330,player:true,path:[],edge:null,wait:0},
      ...(features?.getResidents()||[])
    ];
  }
  function renderVillage(){
    $('#ground-layer').innerHTML=features?features.renderGround():A.ground();
    let decorations='';
    if(cityState().earned.includes('rainbow')){
      const p=M.project(3,0);decorations+=A.rainbow(p.x,p.y-8,.8);
    }else{
      const p=M.project(3,0);
      decorations+='<g transform="translate('+p.x+' '+p.y+')"><path d="M-28 0v-42M28 0v-42" stroke="#baa98b" stroke-width="4"/><rect x="-40" y="-51" width="80" height="22" rx="7" fill="#fff8df" stroke="#d7c9a9"/><text text-anchor="middle" y="-36" font-size="10" fill="#8d9170">DURI VILLAGE</text></g>';
    }
    $('#decoration-layer').innerHTML=decorations+(features?.renderEnvironment()||'');
    $('#depth-layer').replaceChildren();scenery=[];
    categories.forEach((category,index)=>{
      const [x,y]=buildingPositions[index],p=M.project(x,y),element=document.createElementNS(NS,'g');
      element.setAttribute('transform','translate('+p.x+' '+p.y+')');
      element.setAttribute('class','building-hit');element.setAttribute('role','button');element.setAttribute('tabindex','0');
      element.setAttribute('aria-label',category.name+' 건물 '+M.levelFor(cityState().counts[category.id])+'단계, 공유 수 조절');
      element.dataset.building=category.id;
      element.innerHTML=A.building(category,M.levelFor(cityState().counts[category.id]),category.id===selectedCategory);
      scenery.push({element,depth:x+y});
      $('#depth-layer').append(element);
    });
    actors.forEach(actor=>{actor.element=document.createElementNS(NS,'g');actor.element.setAttribute('class','actor');actor.element.dataset.actor=actor.id;actor.element.style.pointerEvents='none';$('#depth-layer').append(actor.element);});
    paintActors();
  }
  function pickDirection(from,to){
    return to.x>from.x?330:to.x<from.x?150:to.y>from.y?210:30;
  }
  function startEdge(actor,next){
    if(!M.neighbors({x:actor.x,y:actor.y}).some(n=>n.x===next.x&&n.y===next.y))return false;
    actor.angle=pickDirection(actor,next);
    actor.edge={from:{x:actor.x,y:actor.y},to:next,progress:0};
    return true;
  }
  function advance(actor,dt){
    if(actor.activity==='eating')return;
    if(actor.edge){
      actor.edge.progress=Math.min(1,actor.edge.progress+dt*(actor.player?1.8:.8));
      const {from,to,progress}=actor.edge;
      actor.x=from.x+(to.x-from.x)*progress;actor.y=from.y+(to.y-from.y)*progress;
      if(progress===1){actor.x=to.x;actor.y=to.y;actor.edge=null;}
      return;
    }
    if(actor.player&&heldDirection){
      actor.path=[];destination=null;
      const vector=M.DIRECTIONS[heldDirection];actor.angle=Number(heldDirection);
      startEdge(actor,{x:actor.x+vector.x,y:actor.y+vector.y});
    } else if(actor.path.length){
      startEdge(actor,actor.path.shift());
    } else if(!actor.player){
      actor.wait-=dt;
      if(actor.wait<=0){
        const choices=M.neighbors(actor),next=choices[Math.floor(Math.random()*choices.length)];
        if(next)startEdge(actor,next);
        actor.wait=.2+Math.random()*1.4;
      }
    }else destination=null;
  }
  function paintActors(){
    if(view!=='village')return;
    for(const actor of actors){
      if(!actor.element)continue;
      const p=M.project(actor.x,actor.y);
      actor.element.setAttribute('transform','translate('+p.x+' '+p.y+') scale(.68)');
      actor.element.dataset.angle=actor.angle;
      actor.element.innerHTML=actor.residentId?features.renderResident(actor,tick):A.avatarMarkup(actor.kind,actor.angle,tick,!!actor.edge,actor.player);
    }
    const order=[...scenery,...actors.map(actor=>({element:actor.element,depth:actor.x+actor.y+.05}))]
      .sort((a,b)=>a.depth-b.depth);
    const layer=$('#depth-layer');
    order.forEach((item,index)=>{if(item.element&&layer.children[index]!==item.element)layer.insertBefore(item.element,layer.children[index]||null);});
    if(destination){
      const p=M.project(destination.x,destination.y);
      $('#destination-layer').innerHTML='<ellipse cx="'+p.x+'" cy="'+p.y+'" rx="13" ry="7" fill="none" stroke="#83a4ba" stroke-width="2" stroke-dasharray="3 3" pointer-events="none"/>';
    }else $('#destination-layer').innerHTML='';
  }
  let frameAccumulator=0;
  function frame(now){
    const elapsed=Math.min(Math.max(0,now-lastFrame),150);lastFrame=now;
    if(!document.hidden&&view==='village'){
      frameAccumulator+=elapsed;
      const frameDuration=1000/state.fps;
      let updated=false;
      while(frameAccumulator>=frameDuration){
        frameAccumulator-=frameDuration;tick++;
        actors.forEach(actor=>advance(actor,1/state.fps));updated=true;
      }
      if(updated)paintActors();
    }else frameAccumulator=0;
    requestAnimationFrame(frame);
  }
  function walkTo(event){
    if(event.target.closest('[data-building]'))return;
    const svg=$('#village-svg'),matrix=svg.getScreenCTM();
    if(!matrix)return;
    const point=new DOMPoint(event.clientX,event.clientY).matrixTransform(matrix.inverse());
    let nearest=null,distance=Infinity;
    for(let x=0;x<=6;x++)for(let y=0;y<=6;y++)if(M.isRoad(x,y)){
      const projected=M.project(x,y),d=Math.hypot(point.x-projected.x,point.y-projected.y);
      if(d<distance){nearest={x,y};distance=d;}
    }
    if(distance>37)return;
    const actor=actors[0],from=actor.edge?actor.edge.to:{x:actor.x,y:actor.y};
    actor.path=M.route(from,nearest);heldDirection=null;destination=nearest;
    $('#village-canvas').focus({preventScroll:true});
  }
  function beginMovement(direction){
    heldDirection=Number(direction);
    const actor=actors[0];actor.path=[];destination=null;
    if(!actor.edge){
      const vector=M.DIRECTIONS[heldDirection];actor.angle=heldDirection;
      startEdge(actor,{x:actor.x+vector.x,y:actor.y+vector.y});
    }
  }
  const keyDirections={ArrowUp:30,ArrowLeft:150,ArrowDown:210,ArrowRight:330,w:30,a:150,s:210,d:330,q:150,e:30,z:210,c:330};
  function inputBlocked(){return !!document.querySelector('dialog[open]')||['INPUT','SELECT','TEXTAREA'].includes(document.activeElement?.tagName);}
  document.addEventListener('keydown',event=>{
    const direction=keyDirections[event.key]||keyDirections[event.key.toLowerCase()];
    if(view!=='village'||!direction||inputBlocked())return;
    event.preventDefault();beginMovement(direction);
  });
  document.addEventListener('keyup',event=>{const direction=keyDirections[event.key]||keyDirections[event.key.toLowerCase()];if(direction===heldDirection)heldDirection=null;});
  window.addEventListener('blur',()=>{heldDirection=null;});
  document.addEventListener('visibilitychange',()=>{heldDirection=null;});
  document.addEventListener('pointerup',()=>{heldDirection=null;});
  document.addEventListener('pointercancel',()=>{heldDirection=null;});
  $$('.dpad button').forEach(button=>{
    button.addEventListener('pointerdown',event=>{event.preventDefault();button.setPointerCapture(event.pointerId);beginMovement(button.dataset.direction);});
    button.addEventListener('click',event=>{
      if(event.detail===0){const actor=actors[0],from=actor.edge?actor.edge.to:actor,vector=M.DIRECTIONS[button.dataset.direction];actor.path=M.route(from,{x:from.x+vector.x,y:from.y+vector.y});}
    });
    button.addEventListener('contextmenu',event=>event.preventDefault());
  });
  document.addEventListener('click',event=>{
    const viewButton=event.target.closest('[data-view]');
    if(viewButton)setView(viewButton.dataset.view);
    const cityButton=event.target.closest('[data-city]');
    if(cityButton){selectCity(cityButton.dataset.city);setView('village');}
    const regionButton=event.target.closest('[data-region]');
    if(regionButton){const region=regions.find(r=>r.id===regionButton.dataset.region);selectCity(getCity().regionId===region.id?getCity().id:region.cities[0].id);setView('village');}
    const changeButton=event.target.closest('[data-delta]');
    if(changeButton)change(changeButton.dataset.category,Number(changeButton.dataset.delta));
    const building=event.target.closest('[data-building]');
    if(building){selectedCategory=building.dataset.building;renderInspector();renderVillage();$('#plus-'+selectedCategory).focus({preventScroll:true});}
  });
  document.addEventListener('keydown',event=>{
    if((event.key==='Enter'||event.key===' ')&&event.target.matches('[data-region],[data-building]')){
      event.preventDefault();event.target.dispatchEvent(new MouseEvent('click',{bubbles:true}));
    }
  });
  $('#region-select').addEventListener('change',event=>selectCity(regions.find(r=>r.id===event.target.value).cities[0].id));
  $('#enter-village').addEventListener('click',()=>{setView('village');$('#village-view').scrollIntoView({behavior:'auto',block:'center'});$('#village-canvas').focus({preventScroll:true});});
  $('#village-svg').addEventListener('click',walkTo);
  $('#fps-select').value=state.fps;
  $('#fps-select').addEventListener('change',event=>{state.fps=Number(event.target.value)===30?30:20;save();});
  $('#grow-all').addEventListener('click',()=>{
    const unlocked=[];
    categories.forEach(category=>unlocked.push(...M.changeCount(cityState(),category.id,Math.max(0,7-cityState().counts[category.id]))));
    save();renderInspector();renderMap();setView(view);
    rewardMessage(unlocked);
    if(!unlocked.length)toast('모든 건물이 이미 3단계입니다.');
  });
  $('#reset-city').addEventListener('click',()=>$('#reset-dialog').showModal());
  $('#cancel-reset').addEventListener('click',()=>$('#reset-dialog').close());
  $('#confirm-reset').addEventListener('click',()=>{
    state.cities[state.selectedCityId]=M.freshCity();selectedCategory=null;save();resetActors();
    renderInspector();renderMap();setView(view);$('#reset-dialog').close();
    toast(getCity().name+' 마을 초기화 · 모든 건물 1단계');
  });
  $('#help-button').addEventListener('click',()=>{heldDirection=null;$('#help-dialog').showModal();});
  $$('.close-dialog,.close-help').forEach(button=>button.addEventListener('click',()=>$('#help-dialog').close()));
  window.addEventListener('hashchange',()=>setView(location.hash.slice(1)));
  $('.brand').addEventListener('click',()=>setView('map'));
  // Read-only diagnostic snapshot for integration and browser acceptance tests.
  features=DuriFeatures.create({
    getCityId:()=>state.selectedCityId,getCityState:cityState,getAllCities:()=>state.cities,getView:()=>view,
    onResidentsChanged:()=>{resetActors();if(view==='village')renderVillage();},
    onShare:category=>change(category,1),onPlacesChanged:loadPlaces,onCitySelected:selectCity,onUnlocksChanged:renderInspector,
    onOpenCollection:()=>setView('collection')
  });
  window.DuriPrototype={getSnapshot:()=>JSON.parse(JSON.stringify({view,cityId:state.selectedCityId,data:cityState(),fps:state.fps,features:features.snapshot(),actors:actors.map(({id,x,y,angle,edge,residentId,activity})=>({id,x,y,angle,residentId,activity,moving:!!edge}))}))};
  cityState();features.sync(false);renderRegionPicker();renderMap();renderInspector();features.renderPanel();loadPlaces();resetActors();setView(location.hash.slice(1));requestAnimationFrame(frame);
})();

