/* Optional village gameplay extension. All unlock rules, venues and event previews
 * are prototype rules. Place share/visit buttons simulate events, never verify a real visit.
 * No network, OS season inference or device location is used. Dates use Asia/Seoul. */
(function(root){
  const M=DuriModel,A=DuriArt,D=DuriData,KEY='newduri-features:v1';
  const seasons={spring:'봄',summer:'여름',autumn:'가을',winter:'겨울'};
  const events={none:'없음',arbor:'식목일',festival:'마을 축제'};
  const characters=[
    {id:'cat',name:'코코',species:'고양이',base:'cat',description:'기본 해금',rule:{type:'default'}},
    {id:'beaver',name:'보보',species:'비버',base:'beaver',description:'서울 마을 공유 합계 5회',rule:{type:'region',regionId:'seoul',target:5}},
    {id:'rabbit',name:'루루',species:'토끼',base:'otter',description:'전체 도시 자연 공유 합계 7회',rule:{type:'category',categoryId:'nature',target:7}},
    {id:'fox',name:'모모',species:'여우',base:'cat',description:'전체 도시 식당 공유 합계 10회',rule:{type:'category',categoryId:'food',target:10}},
    {id:'otter',name:'별두리',species:'수달',base:'otter',description:'서울 달빛 전망대 공유 또는 방문',rule:{type:'place',placeId:'seoul-0-landmark-0',actions:['shared','visited']}},
    {id:'penguin',name:'포포',species:'펭귄',base:'otter',description:'부산 구름 커피 방문',rule:{type:'place',placeId:'busan-0-cafe-0',actions:['visited']}}
  ];
  const cityList=D.regions.flatMap(region=>region.cities);
  const validCities=new Set(cityList.map(city=>city.id));
  const validPlaces=new Set(cityList.flatMap(city=>D.categories.flatMap(category=>[0,1].map(index=>city.id+'-'+category.id+'-'+index))));
  function fresh(){return {version:1,unlocked:['cat'],deployed:{},shared:[],visited:[],season:'auto',event:'auto'};}
  function normalize(raw){
    const state=fresh();
    if(raw?.version!==1)return state;
    const allowed=characters.map(character=>character.id);
    state.unlocked=[...new Set(['cat',...(Array.isArray(raw.unlocked)?raw.unlocked:[]).filter(id=>allowed.includes(id))])];
    for(const action of ['shared','visited'])state[action]=Array.isArray(raw[action])?[...new Set(raw[action].filter(id=>validPlaces.has(id)))]:[];
    if(raw.deployed&&typeof raw.deployed==='object'){
      for(const [cityId,ids] of Object.entries(raw.deployed))if(validCities.has(cityId)&&Array.isArray(ids)){
        state.deployed[cityId]=[...new Set(ids.filter(id=>state.unlocked.includes(id)))];
      }
    }
    if(['auto',...Object.keys(seasons)].includes(raw.season))state.season=raw.season;
    if(['auto',...Object.keys(events)].includes(raw.event))state.event=raw.event;
    return state;
  }
  function progressFor(character,allCities,ledger){
    const rule=character.rule;
    if(rule.type==='default')return {value:1,target:1};
    if(rule.type==='region'){
      const ids=D.regions.find(region=>region.id===rule.regionId).cities.map(city=>city.id);
      return {value:ids.reduce((sum,id)=>sum+D.categories.reduce((n,category)=>n+(allCities[id]?.counts?.[category.id]||0),0),0),target:rule.target};
    }
    if(rule.type==='category')return {value:Object.values(allCities).reduce((sum,city)=>sum+(city.counts?.[rule.categoryId]||0),0),target:rule.target};
    return {value:rule.actions.some(action=>ledger[action].includes(rule.placeId))?1:0,target:1};
  }
  function collect(state,allCities){
    const unlocked=[];
    for(const character of characters){
      const progress=progressFor(character,allCities,state);
      if(progress.value>=progress.target&&!state.unlocked.includes(character.id)){state.unlocked.push(character.id);unlocked.push(character.id);}
    }
    return unlocked;
  }
  function koreaDate(date=new Date()){
    const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date);
    return Object.fromEntries(parts.filter(part=>part.type!=='literal').map(part=>[part.type,Number(part.value)]));
  }
  function appearance(counts,settings,date=new Date()){
    const {month,day}=koreaDate(date);
    const season=settings.season==='auto'?(month>=3&&month<=5?'spring':month>=6&&month<=8?'summer':month>=9&&month<=11?'autumn':'winter'):settings.season;
    const event=settings.event==='auto'?(month===4&&day===5?'arbor':'none'):settings.event;
    const levels=D.categories.map(category=>({id:category.id,level:M.levelFor(counts[category.id]||0)}));
    const highest=Math.max(...levels.map(item=>item.level)),leaders=levels.filter(item=>item.level===highest);
    const dominant=highest>=2&&leaders.length===1?leaders[0].id:null;
    return {season,event,dominant,forest:event==='arbor'||dominant==='nature',dining:dominant==='food'};
  }
  const colors={
    spring:{grass:'#e4ecd1',shade:'#ccdcbf',tree:'#cddcaa',background:'#edf3e6',accent:'#edc6d3'},
    summer:{grass:'#d0e5be',shade:'#afd09e',tree:'#94bd8d',background:'#e7f1e7',accent:'#b6dbea'},
    autumn:{grass:'#eee2bc',shade:'#dccc9e',tree:'#d5b28b',background:'#f5efdf',accent:'#dfb493'},
    winter:{grass:'#f3f7f5',shade:'#dbe6e4',tree:'#d4e3de',background:'#edf2f6',accent:'#c8d8e8'}
  };
  function drawCharacter(character,angle,frame,walking,activity){
    let art=A.avatarMarkup(character.base,angle,frame,walking,false);
    if(character.id==='rabbit'){
      art=art.replaceAll('#d6dde1','#f1e7df').replaceAll('#706772','#d5b8b4');
      art='<g fill="#f1e7df" stroke="#d5b8b4" stroke-width="1"><ellipse cx="-11" cy="-83" rx="6" ry="20" transform="rotate(-9 -11 -83)"/><ellipse cx="11" cy="-83" rx="6" ry="20" transform="rotate(9 11 -83)"/></g>'+art;
    }
    if(character.id==='fox')art=art.replaceAll('#e9c39d','#dfa36d').replaceAll('#f8e4c9','#fff0d9').replaceAll('#cb957d','#b97955');
    if(character.id==='otter'){
      art=art.replaceAll('#659dcd','#a393d3').replaceAll('#9aaa80','#a393d3');
      art+='<path d="M0-81l3 6 7 1-5 5 1 7-6-4-6 4 1-7-5-5 7-1Z" fill="#e5c465"/>';
    }
    if(character.id==='penguin'){
      art=art.replaceAll('#d6dde1','#738da0').replaceAll('#706772','#5e7585');
      if(angle===210||angle===330)art+='<path d="M1-52l8 5-8 5-4-5Z" fill="#e5b65d"/><ellipse cy="-24" rx="12" ry="10" fill="#f7f6ed"/>';
    }
    if(activity==='eating'){
      const bite=frame%16<8;
      art+='<g transform="translate(5 -17)"><ellipse cy="1" rx="20" ry="6" fill="#fff9e8" stroke="#c5b99e"/><path d="M-12-2q0-10 7-10q9 0 10 10Z" fill="#d9a264"/><circle cx="11" cy="-3" r="5" fill="#91b16b"/><path d="M-21-6L'+(bite?'-5 -28':'-5 -9')+'" stroke="#c6b5a8" stroke-width="7" stroke-linecap="round"/>'+(bite?'<circle cx="0" cy="-29" r="3" fill="#d9a264"/>':'')+'</g>';
    }
    return art;
  }
  function create(context){
    let state=fresh(),storageAvailable=true,selectedPlaces=[],lastSceneKey='';
    try{state=normalize(JSON.parse(localStorage.getItem(KEY)||'null'));}catch{storageAvailable=false;}
    const $=selector=>document.querySelector(selector);
    const currentId=()=>context.getCityId();
    const persist=()=>{try{localStorage.setItem(KEY,JSON.stringify(state));storageAvailable=true;}catch{storageAvailable=false;}};
    const residents=cityId=>{
      if(!Object.prototype.hasOwnProperty.call(state.deployed,cityId))state.deployed[cityId]=['cat'];
      return state.deployed[cityId];
    };
    const scene=()=>appearance(context.getCityState().counts,state);
    function sync(announce=true){
      const gained=collect(state,context.getAllCities());
      if(gained.length){
        persist();
        context.onUnlocksChanged?.();
        if(announce){
          $('#character-unlock-text').textContent=gained.map(id=>characters.find(character=>character.id===id).name).join(', ')+' 해금';
          $('#character-unlock-notice').classList.remove('hidden');
        }
      }
      if(context.getView()==='collection')renderCollection();
      return gained;
    }
    function renderPanel(){
      const current=scene(),dominant=D.categories.find(category=>category.id===current.dominant);
      $('#season-select').value=state.season;$('#event-select').value=state.event;
      $('#environment-summary').textContent=seasons[current.season]+' · '+(events[current.event])+' · '+(dominant?dominant.name+' 우세':'우세 카테고리 없음');
      $('#scene-status').textContent=seasons[current.season]+(current.event!=='none'?' · '+events[current.event]:'')+(dominant?' · '+dominant.name:'');
      const palette=colors[current.season];
      $('#village-view').style.background=current.forest?'#e5efde':current.dining?'#f4ece0':palette.background;
      const key=JSON.stringify(current);
      if(lastSceneKey&&key!==lastSceneKey)context.onResidentsChanged();
      lastSceneKey=key;
    }
    function renderCollection(){
      const select=$('#collection-city-select');
      const cityName=cityList.find(city=>city.id===currentId()).name;
      select.innerHTML=D.regions.map(region=>'<optgroup label="'+region.name+'">'+region.cities.map(city=>'<option value="'+city.id+'">'+city.name+'</option>').join('')+'</optgroup>').join('');
      select.value=currentId();
      const deployed=residents(currentId());
      $('#character-grid').innerHTML=characters.map(character=>{
        const unlocked=state.unlocked.includes(character.id),placed=deployed.includes(character.id),progress=progressFor(character,context.getAllCities(),state);
        return '<button class="character-card '+(unlocked?'':'locked')+' '+(placed?'deployed':'')+'" data-character="'+character.id+'" aria-pressed="'+placed+'" aria-label="'+character.name+', '+(unlocked?(placed?cityName+' 마을에서 해제':cityName+' 마을에 배치'):'미해금. '+character.description)+'" '+(unlocked?'':'disabled')+'>'+
          '<svg viewBox="-48 -108 96 125" aria-hidden="true">'+drawCharacter(character,330,0,false,null)+'</svg>'+
          '<strong>'+character.name+' <small>'+character.species+'</small></strong><span class="character-rule">'+character.description+'</span>'+
          '<span class="character-progress">'+(unlocked?'해금 완료':Math.min(progress.value,progress.target)+' / '+progress.target)+'</span>'+
          '<span class="character-action">'+(unlocked?(placed?'✓ 배치 중 · 클릭하여 해제':'클릭하여 배치'):'잠김')+'</span></button>';
      }).join('');
    }
    function getResidents(){
      const current=scene(),positions=[[0,2],[6,4],[3,6],[0,5],[6,1],[3,0]];
      return residents(currentId()).map((id,index)=>{
        const character=characters.find(character=>character.id===id),eating=current.dining&&index<2;
        const [x,y]=eating?(index===0?[0,3]:[6,3]):positions[index%positions.length];
        return {id:'resident-'+id,residentId:id,kind:character.base,x,y,angle:eating?330:150,path:[],edge:null,wait:.3+index*.4,activity:eating?'eating':null};
      });
    }
    function renderGround(){
      const current=scene(),palette=colors[current.season];
      let art=A.ground().replaceAll('#e4ead0',current.forest?'#d2e5bd':palette.grass)
        .replaceAll('#c9ddc0',current.forest?'#afd09e':palette.shade)
        .replaceAll('#d3e2c4',palette.shade);
      if(current.season==='autumn'){
        for(const color of ['#bed7b1','#abd0df','#b6bee1','#d4bee4'])art=art.replaceAll(color,palette.tree);
      }else if(current.season==='winter'){
        for(const color of A.palette)art=art.replaceAll(color,palette.tree);
      }
      return art;
    }
    function renderEnvironment(){
      const current=scene(),palette=colors[current.season];
      let content='';
      if(current.forest){
        for(let i=0;i<14;i++){
          const side=i%2,x=side?6.65:-.65,y=-.4+Math.floor(i/2);
          content+=A.tree(x,y,i%3===0?'#91b981':'#b4d29d',.48+(i%3)*.09);
        }
      }
      if(current.season==='spring'||current.season==='autumn'||current.season==='winter'){
        for(let i=0;i<28;i++){
          const x=.6+((i*13)%56)/10,y=.6+((i*19)%56)/10,p=M.project(x,y);
          const color=current.season==='winter'?'#fff':current.season==='spring'?'#edbdcc':'#c78c5d';
          content+='<ellipse cx="'+p.x+'" cy="'+p.y+'" rx="'+(current.season==='winter'?5:3)+'" ry="2" fill="'+color+'" opacity=".8"/>';
        }
      }
      if(current.dining||current.dominant==='cafe'){
        for(const [x,y]of [[0,3],[6,3]]){
          const p=M.project(x,y);
          content+='<g transform="translate('+p.x+' '+p.y+')"><path d="M-24 0V-19M24 0V-19" stroke="#9b886b" stroke-width="4"/><path d="M-29-10H29M-29-18H29" stroke="#c7b38e" stroke-width="7" stroke-linecap="round"/><ellipse cy="9" rx="32" ry="11" fill="#e2cda9"/><path d="M-21 13v17M21 13v17" stroke="#a99068" stroke-width="3"/><ellipse cx="-12" cy="8" rx="10" ry="4" fill="#fffbef"/><path d="M-19 7q7-11 14 0Z" fill="#cc975a"/><rect x="10" y="-1" width="9" height="10" rx="2" fill="#fffaf1"/></g>';
        }
      }
      if(current.event==='festival'||current.dominant==='play'){
        const p=M.project(3,0);
        content+='<g transform="translate('+p.x+' '+(p.y-25)+')"><path d="M-88 0q88 45 176 0" fill="none" stroke="#bca88f" stroke-width="2"/>'+A.palette.map((color,i)=>'<path d="M'+(-78+i*24)+' '+(8+Math.sin(i/6*Math.PI)*13)+'l18 1-9 17Z" fill="'+color+'"/>').join('')+'</g>';
        for(const [x,y]of [[0,0],[6,6]]){
          const p=M.project(x,y);content+='<g transform="translate('+p.x+' '+p.y+')"><path d="M0 0v-50" stroke="#a49c85"/><ellipse cy="-55" rx="13" ry="18" fill="'+palette.accent+'"/></g>';
        }
      }
      if(current.dominant==='landmark'){
        for(const [x,y]of [[0,0],[0,6],[6,0],[6,6]]){
          const p=M.project(x,y);content+='<g transform="translate('+p.x+' '+p.y+')"><path d="M0 0v-55" stroke="#a79a7e" stroke-width="4"/><circle cy="-58" r="13" fill="#f7e4a1" opacity=".45"/><circle cy="-58" r="6" fill="#fff4cd"/></g>';
        }
      }
      return content;
    }
    function renderPlaceActions(item,place){
      selectedPlaces=selectedPlaces.filter(entry=>entry.id!==place.id);selectedPlaces.push(place);
      const controls=document.createElement('div');controls.className='place-actions';
      for(const [action,label]of [['shared','공유'],['visited','방문']]){
        const button=document.createElement('button');button.type='button';
        button.dataset.placeId=place.id;button.dataset.placeAction=action;
        button.textContent=label+(state[action].includes(place.id)?' 완료':'');
        button.disabled=state[action].includes(place.id);
        button.setAttribute('aria-label',place.name+' '+label+' 테스트');
        controls.append(button);
      }
      item.append(controls);
    }
    document.addEventListener('click',event=>{
      const card=event.target.closest('[data-character]');
      if(card){
        const id=card.dataset.character;if(!state.unlocked.includes(id))return;
        const deployed=residents(currentId());
        state.deployed[currentId()]=deployed.includes(id)?deployed.filter(value=>value!==id):[...deployed,id];
        persist();renderCollection();context.onResidentsChanged();
      }
      const actionButton=event.target.closest('[data-place-action]');
      if(actionButton){
        const {placeId,placeAction}=actionButton.dataset;
        const place=selectedPlaces.find(place=>place.id===placeId);
        if(!place||!['shared','visited'].includes(placeAction)||state[placeAction].includes(placeId))return;
        state[placeAction].push(placeId);persist();
        if(placeAction==='shared')context.onShare(place.categoryId);
        sync();context.onPlacesChanged();
      }
    });
    $('#collection-city-select').addEventListener('change',event=>context.onCitySelected(event.target.value));
    $('#season-select').addEventListener('change',event=>{
      if(!['auto',...Object.keys(seasons)].includes(event.target.value))return;
      state.season=event.target.value;persist();renderPanel();context.onResidentsChanged();
    });
    $('#event-select').addEventListener('change',event=>{
      if(!['auto',...Object.keys(events)].includes(event.target.value))return;
      state.event=event.target.value;persist();renderPanel();context.onResidentsChanged();
    });
    $('#open-unlocked-characters').addEventListener('click',()=>{context.onOpenCollection();$('#character-unlock-notice').classList.add('hidden');});
    $('#dismiss-character-unlock').addEventListener('click',()=>$('#character-unlock-notice').classList.add('hidden'));
    return {sync,renderPanel,renderCollection,getResidents,renderGround,renderEnvironment,renderPlaceActions,
      renderResident:(actor,frame)=>drawCharacter(characters.find(character=>character.id===actor.residentId),actor.angle,frame,!!actor.edge,actor.activity),
      snapshot:()=>JSON.parse(JSON.stringify({state,scene:scene(),storageAvailable}))
    };
  }
  root.DuriFeatures={characters,normalize,collect,progressFor,appearance,koreaDate,create};
})(globalThis);

