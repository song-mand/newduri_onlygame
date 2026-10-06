/* Native SVG artwork, editable without an asset pipeline.
 * Duri is a simplified vector interpretation of the supplied white/gray otter
 * with dark ears and blue scarf; not a pixel-perfect copy of the source image.
 * avatarMarkup can be replaced with a four-direction sprite-sheet renderer. */
(function(root){
  const {project}=DuriModel;
  const palette=['#efb3bb','#f4cba6','#f4e4a8','#bed7b1','#abd0df','#b6bee1','#d4bee4'];
  function polygon(points,fill,extra=''){return '<polygon points="'+points+'" fill="'+fill+'" '+extra+'/>';}
  function tile(x,y,fill,size=.5) {
    const points=[[x-size,y-size],[x+size,y-size],[x+size,y+size],[x-size,y+size]].map(([a,b])=>{const p=project(a,b);return p.x+','+p.y;}).join(' ');
    return polygon(points,fill);
  }
  function tree(x,y,color='#b6d2ae',scale=1){
    const p=project(x,y);
    return '<g transform="translate('+p.x+' '+p.y+') scale('+scale+')"><ellipse cy="2" rx="22" ry="10" fill="#70946c" opacity=".12"/><path d="M0 0V-38" stroke="#a09176" stroke-width="7" stroke-linecap="round"/><path d="M0-19L-13-33M0-26L11-43" stroke="#a09176" stroke-width="4"/><path d="M-25-39C-39-65-17-86 0-80C20-91 39-63 27-47C36-24 9-16 0-29C-18-14-36-27-25-39Z" fill="'+color+'"/><ellipse cx="-9" cy="-57" rx="8" ry="12" fill="#fff" opacity=".2"/></g>';
  }
  function building(category,level,selected=false){
    const h=32+level*13, c=category.color;
    let details='';
    if(category.id==='food') details='<path d="M-48 '+(-h-21)+'L-5 '+(-h-49)+'L48 '+(-h-25)+'L0 '+(-h+1)+'Z" fill="'+c+'" stroke="#fff5f0" stroke-width="3"/><path d="M-42-38L0-14L0-29L-42-53Z" fill="#fff9eb"/><path d="M-34-49V-34M-22-42V-27M-10-35V-20" stroke="'+c+'" stroke-width="8"/><path d="M22 '+(-h-36)+'v-19l12 6v19" fill="#d7a09a"/>';
    if(category.id==='cafe') details='<path d="M-47 '+(-h-24)+'L0 '+(-h+3)+'L48 '+(-h-24)+'L0 '+(-h-51)+'Z" fill="'+c+'" stroke="#ecf8fc" stroke-width="3"/><path d="M-42-40L0-16V-29L-42-53Z" fill="#e9f4f4"/><path d="M-29-46V-33M-15-38V-25" stroke="'+c+'" stroke-width="8"/><g transform="translate(0 '+(-h-40)+')"><path d="M-12-10H9V4Q-1 14-12 4Z" fill="#fffaf0"/><path d="M9-6Q26-6 12 5" fill="none" stroke="#fffaf0" stroke-width="4"/><path d="M-5-16Q-11-22-4-27" fill="none" stroke="#fff" stroke-width="2" opacity=".7"/></g>';
    if(category.id==='play') details='<path d="M-47 '+(-h-23)+'L0 '+(-h-66)+'L47 '+(-h-23)+'L0 '+(-h-2)+'Z" fill="'+c+'"/><path d="M0 '+(-h-66)+'L-15 '+(-h-12)+'L0 '+(-h-2)+'L14 '+(-h-12)+'Z" fill="#fff3d5"/><path d="M0 '+(-h-64)+'V'+(-h-85)+'l24 7-24 6" fill="#edacb5" stroke="#b79078" stroke-width="2"/>';
    if(category.id==='nature') details='<path d="M-45 '+(-h-23)+'L0 '+(-h-58)+'L45 '+(-h-23)+'L0 '+(-h-1)+'Z" fill="#d9ead2" stroke="'+c+'" stroke-width="3"/><path d="M0 '+(-h-58)+'V'+(-h-1)+'M-24 '+(-h-40)+'L24 '+(-h-13)+'M24 '+(-h-40)+'L-24 '+(-h-13)+'" stroke="#fff" stroke-width="3"/><path d="M-34-24V-48M-29-32Q-48-32-43-47Q-27-45-29-32M-30-37Q-17-54-11-44Q-11-31-30-37" fill="#8bb780" stroke="#81a176" stroke-width="2"/>';
    if(category.id==='landmark') details='<path d="M-25 '+(-h-12)+'v-48l25-15 25 15v48" fill="#e9ddf2"/><path d="M-31 '+(-h-59)+'L0 '+(-h-89)+'L31 '+(-h-59)+'L0 '+(-h-43)+'Z" fill="'+c+'"/><ellipse cx="0" cy="'+(-h-32)+'" rx="11" ry="13" fill="#fffbef" stroke="#bfa3cb" stroke-width="2"/><path d="M0 '+(-h-41)+'v10l6 4" stroke="#8e7a9c" fill="none" stroke-width="2"/>';
    const extra=level>=2?'<g transform="translate(47 -12)"><path d="M0 0v-29M18-10v-29M0-20l18-10" stroke="#c7b89c" stroke-width="3"/><ellipse cx="9" cy="-38" rx="22" ry="11" fill="'+c+'"/><path d="M-10-8l38-21" stroke="#f5eee1" stroke-width="5"/></g>':'';
    const flourish=level===3?'<g fill="#efcb74"><path d="M-51-91l4 8 9 1-7 6 2 9-8-5-8 5 2-9-7-6 9-1Z"/><path d="M49-109l3 6 7 1-5 5 1 7-6-4-6 4 1-7-5-5 7-1Z"/></g><path d="M-55-9Q0 19 55-12" stroke="'+c+'" stroke-width="4" fill="none"/><g fill="#f4e2ad"><circle cx="-47" cy="-6" r="4"/><circle cx="-24" cy="3" r="4"/><circle cx="0" cy="6" r="4"/><circle cx="24" cy="2" r="4"/><circle cx="46" cy="-6" r="4"/></g>':'';
    return '<g class="building-art '+(selected?'selected':'')+'"><ellipse cy="-2" rx="68" ry="30" fill="'+c+'" opacity=".2"/>'+polygon('-44,-24 0,0 0,-'+h+' -44,-'+(h+24),'#fff9ee')+polygon('0,0 44,-24 44,-'+(h+24)+' 0,-'+h,'#e7e1d5')+polygon('-44,-'+(h+24)+' 0,-'+h+' 44,-'+(h+24)+' 0,-'+(h+48),'#f6ebda')+'<path d="M10-9V-33l15-9v25" fill="#a0b8b6" stroke="#faf5e7" stroke-width="3"/><path d="M29-20v-21l9-5v21" fill="#b6cdd0" stroke="#faf5e7" stroke-width="2"/>'+details+extra+flourish+'<g transform="translate(-6 28)"><rect x="-45" y="-11" width="90" height="23" rx="11" fill="#fffdf7" stroke="'+c+'"/><text text-anchor="middle" y="5" font-size="12" font-weight="700" fill="#615e57">'+category.name+' · Lv.'+level+'</text></g></g>';
  }
  function avatarMarkup(kind,angle,frame,walking,player){
    const back=angle===30||angle===150, flip=angle===150||angle===210?-1:1;
    const step=walking?[0,2,4,2,0,-2,-4,-2][frame%8]:0;
    const bob=walking?(frame%4<2?0:-2):0;
    const body=kind==='otter'?'#d6dde1':kind==='cat'?'#e9c39d':'#c3a48a';
    const face=kind==='otter'?'#fffdfb':kind==='cat'?'#f8e4c9':'#e8d2b8';
    const ear=kind==='otter'?'#706772':kind==='cat'?'#cb957d':'#9c806c';
    const scarf=player?'#659dcd':kind==='cat'?'#d497a4':'#9aaa80';
    const ears=kind==='cat'?'<path d="M-21-53L-23-77L-7-65M9-65L25-76L23-51" fill="'+ear+'"/>':'<ellipse cx="-21" cy="-58" rx="9" ry="12" fill="'+ear+'" transform="rotate(23 -21 -58)"/><ellipse cx="22" cy="-58" rx="9" ry="12" fill="'+ear+'" transform="rotate(-23 22 -58)"/>';
    const facial=back?'<path d="M14-40q8-3 10-9" fill="none" stroke="'+ear+'" opacity=".2" stroke-width="2"/>':'<g transform="translate(5 0)"><ellipse cx="-9" cy="-56" rx="2.4" ry="3.1" fill="#51494b"/><ellipse cx="11" cy="-56" rx="2.4" ry="3.1" fill="#51494b"/><ellipse cx="-13" cy="-48" rx="5" ry="3" fill="#f1bac0" opacity=".65"/><ellipse cx="15" cy="-48" rx="5" ry="3" fill="#f1bac0" opacity=".65"/><path d="M-3-49q4-6 8 0q-3 5-8 0" fill="#51494b"/><path d="M1-45q-6 7-11 0m11 0q6 7 11 0" fill="none" stroke="#655759" stroke-width="1.5" stroke-linecap="round"/><path d="M-16-49l-7-2m7 6-7 1m40-7 7-2m-7 6 7 1" stroke="#85757a" stroke-width="1" opacity=".65"/></g>';
    return '<ellipse cy="2" rx="22" ry="8" fill="#607870" opacity=".15"/><g transform="translate(0 '+bob+') scale('+flip+' 1)"><path d="M12-17Q38-15 32 0Q17 3 8-8" fill="'+ear+'" opacity=".75"/><ellipse cx="-9" cy="'+(-3+step/2)+'" rx="9" ry="7" fill="'+body+'"/><ellipse cx="10" cy="'+(-3-step/2)+'" rx="9" ry="7" fill="'+body+'"/><ellipse cy="-23" rx="20" ry="25" fill="'+body+'"/><ellipse cx="-21" cy="'+(-23-step)+'" rx="6" ry="12" fill="'+ear+'" opacity=".65"/><ellipse cx="20" cy="'+(-23+step)+'" rx="6" ry="12" fill="'+ear+'" opacity=".65"/><path d="M-18-37L1-20L19-37" fill="'+scarf+'" stroke="#f4f8fb" stroke-width="2"/>'+ears+'<path d="M-25-51Q-28-73-5-73L-11-80L0-75Q27-77 28-52Q29-30 1-32Q-26-31-25-51Z" fill="'+(back?body:face)+'"/>'+facial+'</g>'+(player?'<path d="M0-99l5 6-5 6-5-6Z" fill="#629ecd"/><text y="-107" text-anchor="middle" fill="#5b839d" font-size="12" font-weight="700">두리</text>':'');
  }
  function ground(){
    let content='<defs><linearGradient id="grass" x2="1" y2="1"><stop stop-color="#e4ead0"/><stop offset="1" stop-color="#c9ddc0"/></linearGradient><linearGradient id="cliff" x2="0" y2="1"><stop stop-color="#b1c5a4"/><stop offset="1" stop-color="#9cb996"/></linearGradient></defs><ellipse cx="500" cy="600" rx="342" ry="89" fill="#94b7a1" opacity=".13"/>';
    const a=project(-.9,-.9),b=project(6.9,-.9),c=project(6.9,6.9),d=project(-.9,6.9);
    content+=polygon([b,c,d].map(p=>p.x+','+p.y).concat([d,c,b].map(p=>p.x+','+(p.y+27))).join(' '),'url(#cliff)');
    content+=polygon([a,b,c,d].map(p=>p.x+','+p.y).join(' '),'url(#grass)','stroke="#e8eddb" stroke-width="5" stroke-linejoin="round"');
    for(let x=0;x<=6;x++)for(let y=0;y<=6;y++){
      if(DuriModel.isRoad(x,y)){
        content+=tile(x,y,'#f9efd9',.5);
        const p=project(x,y);
        content+='<path d="M'+(p.x-8)+' '+p.y+'l8 4 8-4" fill="none" stroke="#e4d9c3" stroke-width="1" opacity=".7"/>';
      } else if((x+y)%2===0) content+=tile(x,y,'#d3e2c4',.49);
    }
    [[-.6,0],[-.6,1.5],[-.6,4],[0,6.6],[1.5,6.6],[4,6.6],[6.6,0],[6.6,2],[6.6,5],[2,-.6],[4,-.6],[6,-.6]].forEach(([x,y],i)=>{content+=tree(x,y,palette[(i+3)%7],.55+(i%3)*.12);});
    for(let i=0;i<35;i++){
      const x=((i*17)%65)/10-.2, y=((i*29+7)%65)/10-.2;
      if(Math.abs(x-Math.round(x/3)*3)<.55||Math.abs(y-Math.round(y/3)*3)<.55)continue;
      const p=project(x,y);
      content+='<g fill="'+palette[i%7]+'"><circle cx="'+p.x+'" cy="'+p.y+'" r="3"/><circle cx="'+(p.x+6)+'" cy="'+(p.y+3)+'" r="2"/></g>';
    }
    return content;
  }
  function rainbow(x,y,scale=1){
    return '<g transform="translate('+x+' '+y+') scale('+scale+')">'+palette.map((color,i)=>'<path d="M'+(-58+i*7)+' 0A'+(58-i*7)+' '+(58-i*7)+' 0 0 1 '+(58-i*7)+' 0" stroke="'+color+'" stroke-width="7" fill="none"/>').join('')+'<g fill="#fffdf4"><ellipse cx="-48" cy="0" rx="22" ry="10"/><ellipse cx="48" cy="0" rx="22" ry="10"/></g></g>';
  }
  root.DuriArt={palette,tile,tree,building,avatarMarkup,ground,rainbow};
})(globalThis);

