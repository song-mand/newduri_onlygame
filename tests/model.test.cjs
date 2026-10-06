const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const vm = require('node:vm');
const context = vm.createContext({});
for (const file of ['data.js','model.js']) vm.runInContext(readFileSync(resolve(__dirname,'..',file),'utf8'),context);
const m=context.DuriModel, data=context.DuriData;

test('level thresholds, decreases, no duplicates, retained rewards, max and min',()=>{
  assert.equal([0,2,3,6,7,99].map(m.levelFor).join(','),'1,1,2,2,3,3');
  const city=m.freshCity();
  assert.ok(Object.values(city.counts).every(value=>value===0));
  assert.equal(m.changeCount(city,'food',3).join(','),'food-2');
  assert.equal(m.changeCount(city,'food',4).join(','),'food-3');
  m.changeCount(city,'food',-99);
  assert.equal(city.counts.food,0);
  assert.equal(city.earned.length,2);
  assert.equal(m.changeCount(city,'food',7).length,0);
  for(const id of m.CATEGORY_IDS)m.changeCount(city,id,999);
  assert.equal(city.earned.length,11);
  assert.ok(city.earned.includes('rainbow'));
  assert.ok(Object.values(city.counts).every(value=>value===99));
  assert.equal(m.changeCount(city,'invalid',1).length,0);
  assert.equal(m.changeCount(city,'food',NaN).length,0);
});

test('each city has isolated state; resetting one cannot erase another',()=>{
  const a=m.freshCity(),b=m.freshCity();
  m.changeCount(a,'food',7);
  assert.equal(b.counts.food,0);
  assert.equal(b.earned.length,0);
  const reset=m.freshCity();
  assert.equal(reset.counts.food,0);
  assert.equal(a.counts.food,7);
});

test('stored counts and rewards are validated',()=>{
  const city=m.normalizeCity({counts:{food:-1,play:1.9,nature:'oops',cafe:Infinity,landmark:1000},earned:['bogus','food-2','food-2']});
  assert.equal(city.counts.food,0);assert.equal(city.counts.play,1);
  assert.equal(city.counts.nature,0);assert.equal(city.counts.cafe,0);assert.equal(city.counts.landmark,99);
  assert.equal(city.earned.filter(id=>id==='food-2').length,1);
  assert.ok(!city.earned.includes('bogus'));
  assert.ok(city.earned.includes('landmark-3'));
  assert.equal(m.normalizeCity(null).earned.length,0);
});

test('85 cities each expose 10 explicit mock places, 2 per category',async()=>{
  const repo=data.createMockPlaceRepository(),cities=repo.listRegions().flatMap(r=>repo.listCities(r.id)),ids=new Set();
  assert.equal(cities.length,85);
  for(const city of cities){
    const places=await repo.listPlaces(city.id);
    assert.equal(places.length,10);
    for(const category of data.categories)assert.equal(places.filter(p=>p.categoryId===category.id).length,2);
    for(const place of places){
      assert.equal(place.cityId,city.id);assert.equal(place.isMock,true);
      assert.ok(!ids.has(place.id));ids.add(place.id);
    }
  }
  assert.equal(ids.size,850);
  await assert.rejects(repo.listPlaces('unknown'));
});

test('all 1089 road-node pairs route using adjacent road edges only',()=>{
  const nodes=[];
  for(let x=0;x<=6;x++)for(let y=0;y<=6;y++)if(m.isRoad(x,y))nodes.push({x,y});
  assert.equal(nodes.length,33);
  for(const start of nodes)for(const end of nodes){
    const path=m.route(start,end);
    let previous=start;
    for(const next of path){
      assert.ok(m.isRoad(next.x,next.y));
      assert.equal(Math.abs(next.x-previous.x)+Math.abs(next.y-previous.y),1);
      previous=next;
    }
    assert.equal(previous.x,end.x);assert.equal(previous.y,end.y);
  }
  assert.equal(m.route({x:1,y:1},{x:3,y:3}).length,0);
});

test('projection matches requested mathematical angles 30, 150, 210, 330',()=>{
  const origin=m.project(0,0);
  for(const [angle,vector] of Object.entries(m.DIRECTIONS)){
    const point=m.project(vector.x,vector.y);
    const actual=(Math.atan2(-(point.y-origin.y),point.x-origin.x)*180/Math.PI+360)%360;
    assert.ok(Math.abs(actual-Number(angle))<1e-8);
  }
});

test('standalone scripts parse without bundling',()=>{
  for(const file of ['data.js','model.js','art.js','app.js'])new vm.Script(readFileSync(resolve(__dirname,'..',file),'utf8'),{filename:file});
});

