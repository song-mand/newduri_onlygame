
class MockElement{
  constructor(name=''){this.name=name;this.children=[];this.dataset={};this.style={};this.attrs={};this.events={};this.classes=new Set();this.hidden=false;this.value='';this.textContent='';this.innerHTML='';this.id=name.startsWith('#')?name.slice(1):'';this.tagName='DIV';
    this.classList={toggle:(key,on)=>{if(on===undefined)on=!this.classes.has(key);on?this.classes.add(key):this.classes.delete(key);},add:key=>this.classes.add(key),remove:key=>this.classes.delete(key)};
  }
  setAttribute(key,value){this.attrs[key]=value;}
  addEventListener(name,handler){(this.events[name] ||= []).push(handler);}
  emit(name,event={}){for(const handler of this.events[name]||[])handler({target:this,preventDefault(){},...event});}
  replaceChildren(...elements){this.children=[];this.append(...elements);}
  append(...elements){for(const el of elements){if(el.parentElement)el.parentElement.children=el.parentElement.children.filter(x=>x!==el);el.parentElement=this;this.children.push(el);}}
  insertBefore(el,other){if(el.parentElement)el.parentElement.children=el.parentElement.children.filter(x=>x!==el);el.parentElement=this;const index=this.children.indexOf(other);if(index<0)this.children.push(el);else this.children.splice(index,0,el);}
  focus(){document.activeElement=this;}
  scrollIntoView(){}
  showModal(){this.open=true;}
  close(){this.open=false;}
  matches(){return false;}
  closest(){return null;}
}
const elements=new Map();
const get=key=>{if(!elements.has(key))elements.set(key,new MockElement(key));return elements.get(key);};
const lists={
 '.nav-button':['map','village','collection'].map(view=>{const el=new MockElement();el.dataset.view=view;return el;}),
 '.dpad button':[150,30,210,330].map(direction=>{const el=new MockElement();el.dataset.direction=direction;return el;}),
 '.close-dialog,.close-help':[new MockElement(),new MockElement()]
};
const document=new MockElement('document');
document.querySelector=selector=>selector==='dialog[open]'?[...elements.values()].find(el=>el.open)||null:get(selector);
document.querySelectorAll=selector=>selector==='.building-art'?[]:lists[selector]||[];
document.createElement=tag=>new MockElement(tag);
document.createElementNS=(ns,tag)=>new MockElement(tag);
document.getElementById=id=>get('#'+id);
document.activeElement=new MockElement('body');
document.hidden=false;
let stored=null;
const localStorage={getItem:()=>stored,setItem:(key,value)=>{stored=value;}};
const window=new MockElement('window');
const location={hash:''},history={replaceState:(a,b,hash)=>{location.hash=hash;}};
let raf;
const requestAnimationFrame=callback=>{raf=callback;};
const setTimeout=()=>1,clearTimeout=()=>{};

