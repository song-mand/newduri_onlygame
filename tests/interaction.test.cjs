const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const harness = readFileSync(resolve(__dirname,'mock-dom.js'),'utf8');
const source = ['data.js','model.js','art.js','app.js'].map(file=>readFileSync(resolve(__dirname,'..',file),'utf8')).join('\n');
// Event/state checks with a minimal DOM double; not a browser layout test.
function run(setup,checks){return new Function(setup+'\n'+source+'\n'+checks)();}

test('restored map, village, laboratory and collection flow',()=>{
  const saved=run(harness,`
    const ensure=(ok,label)=>{if(!ok)throw Error(label);};
    const click=(selector,props)=>document.emit('click',{target:{closest:requested=>requested===selector?{dataset:props}:null}});
    ensure(window.DuriPrototype.getSnapshot().view==='map','initial map');
    click('[data-city]',{city:'gyeonggi-27'});
    ensure(window.DuriPrototype.getSnapshot().view==='map','select city before entering');
    for(let i=0;i<3;i++)click('[data-delta]',{category:'food',delta:'1'});
    ensure(window.DuriPrototype.getSnapshot().data.earned.includes('food-2'),'laboratory reward');
    get('#enter-village').emit('click');
    ensure(window.DuriPrototype.getSnapshot().view==='village','village button');
    const before=window.DuriPrototype.getSnapshot();
    document.emit('keydown',{key:'d'});
    for(let time=0;time<=650;time+=10)raf(time);
    document.emit('keyup',{key:'d'});
    for(let time=660;time<=1400;time+=10)raf(time);
    const after=window.DuriPrototype.getSnapshot();
    ensure(after.actors[0].x>before.actors[0].x,'player movement');
    ensure(after.actors.some((actor,i)=>i>0&&(actor.x!==before.actors[i].x||actor.y!==before.actors[i].y)),'NPC movement');
    get('#fps-select').value='30';get('#fps-select').emit('change');
    get('#grow-all').emit('click');
    ensure(window.DuriPrototype.getSnapshot().data.earned.length===11,'all rewards');
    click('[data-delta]',{category:'food',delta:'-1'});
    ensure(window.DuriPrototype.getSnapshot().data.earned.length===11,'retained rewards');
    click('[data-view]',{view:'collection'});
    ensure(window.DuriPrototype.getSnapshot().view==='collection'&&get('#reward-grid').innerHTML.includes('rainbow-reward'),'collection screen');
    click('[data-city]',{city:'busan-0'});
    ensure(window.DuriPrototype.getSnapshot().data.counts.food===0,'city isolation');
    click('[data-delta]',{category:'cafe',delta:'1'});
    click('[data-city]',{city:'gyeonggi-27'});
    ensure(window.DuriPrototype.getSnapshot().data.earned.length===11,'revisit record');
    get('#reset-city').emit('click');ensure(get('#reset-dialog').open,'reset dialog');
    get('#confirm-reset').emit('click');
    ensure(window.DuriPrototype.getSnapshot().data.earned.length===0,'reset current city');
    click('[data-city]',{city:'busan-0'});
    ensure(window.DuriPrototype.getSnapshot().data.counts.cafe===1,'other city preserved');
    return stored;
  `);
  const restored=run(harness.replace('let stored=null;','let stored='+JSON.stringify(saved)+';'),'return window.DuriPrototype.getSnapshot();');
  assert.equal(restored.cityId,'busan-0');assert.equal(restored.data.counts.cafe,1);assert.equal(restored.fps,30);
});
test('blocked storage keeps the prototype usable and displays its warning',()=>{
  const blocked=harness.replace(
    'const localStorage={getItem:()=>stored,setItem:(key,value)=>{stored=value;}};',
    "const localStorage={getItem:()=>{throw Error('denied')},setItem:()=>{throw Error('denied')}};"
  );
  const result=run(blocked,"return {snapshot:window.DuriPrototype.getSnapshot(),warning:!get('#storage-warning').classes.has('hidden')};");
  assert.equal(result.snapshot.view,'map');assert.equal(result.warning,true);
});

