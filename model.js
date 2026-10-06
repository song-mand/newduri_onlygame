/* Framework-independent game rules. All counts are simulated share events.
 * Distinct saved-place counts may replace these events in a real app.
 * A city has 10 mock places, but test share events can exceed 10. */
(function (root) {
  const CATEGORY_IDS = ['food','play','nature','cafe','landmark'];
  const MAX_COUNT = 99;
  const STORAGE_KEY = 'newduri-village:v1';
  const levelFor = count => count >= 7 ? 3 : count >= 3 ? 2 : 1;
  const freshCity = () => ({counts:Object.fromEntries(CATEGORY_IDS.map(id=>[id,0])),earned:[]});
  function normalizeCity(raw) {
    const city = freshCity();
    CATEGORY_IDS.forEach(id=>{
      const value = Number(raw?.counts?.[id]);
      city.counts[id] = Number.isFinite(value) ? Math.max(0,Math.min(MAX_COUNT,Math.floor(value))) : 0;
    });
    const valid = [...CATEGORY_IDS.map(id=>id+'-2'),...CATEGORY_IDS.map(id=>id+'-3'),'rainbow'];
    city.earned = Array.isArray(raw?.earned) ? [...new Set(raw.earned.filter(id=>valid.includes(id)))] : [];
    collect(city);
    return city;
  }
  function collect(city) {
    const unlocked = [];
    const unlock = id => {if(!city.earned.includes(id)){city.earned.push(id);unlocked.push(id);}};
    CATEGORY_IDS.forEach(id=>{
      if(levelFor(city.counts[id])>=2) unlock(id+'-2');
      if(levelFor(city.counts[id])===3) unlock(id+'-3');
    });
    if(CATEGORY_IDS.every(id=>levelFor(city.counts[id])===3)) unlock('rainbow');
    return unlocked;
  }
  function changeCount(city,category,delta) {
    if(!CATEGORY_IDS.includes(category)||!Number.isFinite(delta)) return [];
    city.counts[category] = Math.max(0,Math.min(MAX_COUNT,city.counts[category]+Math.trunc(delta)));
    return collect(city);
  }
  // Isometric road lattice. Only axis-aligned edges are traversable.
  const isRoad = (x,y) => x>=0&&x<=6&&y>=0&&y<=6&&(x%3===0||y%3===0);
  const neighbors = node => [[1,0],[-1,0],[0,1],[0,-1]]
    .map(([x,y])=>({x:node.x+x,y:node.y+y})).filter(n=>isRoad(n.x,n.y));
  function route(start,end) {
    if(!isRoad(start.x,start.y)||!isRoad(end.x,end.y)) return [];
    const key = n=>n.x+','+n.y, queue=[start], visited=new Set([key(start)]), previous=new Map();
    while(queue.length) {
      const current=queue.shift();
      if(key(current)===key(end)) {
        const path=[]; let step=current;
        while(key(step)!==key(start)){path.unshift(step);step=previous.get(key(step));}
        return path;
      }
      for(const next of neighbors(current)) if(!visited.has(key(next))){
        visited.add(key(next));previous.set(key(next),current);queue.push(next);
      }
    }
    return [];
  }
  // SVG y points downward. These vectors correspond to mathematical angles:
  const DIRECTIONS = {30:{x:0,y:-1},150:{x:-1,y:0},210:{x:0,y:1},330:{x:1,y:0}};
  const project = (x,y) => ({x:500+(x-y)*59,y:153+(x+y)*59/Math.sqrt(3)});
  root.DuriModel = {CATEGORY_IDS,MAX_COUNT,STORAGE_KEY,levelFor,freshCity,normalizeCity,collect,changeCount,isRoad,neighbors,route,DIRECTIONS,project};
})(globalThis);

