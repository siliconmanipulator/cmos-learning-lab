/* Independent four-terminal MOS structures. No inverter geometry or cropping. */
window.cmosStandaloneGeometry=function(type,state){
  const p=type==='pmos',boxes=[],stage=state.step;
  const cut=state.cut&&state.view!=='layout';
  const gateY=.045+state.spread*.4,liY=.7+state.spread,metalY=1.15+state.spread*1.7;
  function box(id,net,x0,x1,y0,y1,z0,z1){
    if(!state.body&&['substrate','well'].includes(id))return;
    if(!state.gate&&['poly','oxide','pchannel','nchannel'].includes(id))return;
    if(!state.contacts&&id==='contact')return;
    if(!state.metal&&id==='metal')return;
    boxes.push({id,net,x0,x1,y0,y1,z0,z1});
  }
  const xs=[-3.4,-3.1,-2.8,-2.3,-2.05,-.3,.3,2.05,3.1,3.4];
  const ys=[-1.4,-.95,-.2,0],zs=[-1.6,-1.3,-.55,0,.55,1.3,1.6];
  for(let i=0;i<xs.length-1;i++)for(let j=0;j<ys.length-1;j++)for(let k=0;k<zs.length-1;k++){
    const x=(xs[i]+xs[i+1])/2,y=(ys[j]+ys[j+1])/2,z=(zs[k]+zs[k+1])/2;
    if(cut&&z>0)continue;
    let id='substrate',net=p?'SUB':'B';
    if(p&&stage>=1&&Math.abs(x)<3.1&&Math.abs(z)<1.3&&y>-.95){id='well';net='B';}
    if(y>-.2&&Math.abs(z)<.55){
      if(stage>=2&&x>-2.05&&x<-.3){id=p?'ps':'ns';net='S';}
      if(stage>=3&&x>.3&&x<2.05){id=p?'pd':'nd';net='D';}
      if(stage>=5&&x>-2.8&&x<-2.3){id=p?'ntap':'ptap';net='B';}
    }
    box(id,net,xs[i],xs[i+1],ys[j],ys[j+1],zs[k],zs[k+1]);
  }
  if(stage>=4){
    box('oxide','',-.32,.32,gateY-.045,gateY,-.55,.55);
    box('poly','G',-.3,.3,gateY,gateY+.18,-1.2,.65);
    if(p?state.input===0:state.input===1)box(p?'pchannel':'nchannel','CHANNEL',-.3,.3,0,.015,-.55,cut?0:.55);
  }
  const terminals=[['B',-2.55,-.2,0],['S',-1.3,-.2,0],['D',1.3,-.2,0],['G',0,-1,gateY+.18]];
  if(stage>=6)for(const [net,x,z,base]of terminals){
    box('contact',net,x-.09,x+.09,base,liY,z-.09,z+.09);
    box('contact',net,x-.19,x+.19,liY,liY+.12,z-.19,z+.19);
    box('contact',net,x-.085,x+.085,liY+.12,metalY,z-.085,z+.085);
  }
  if(stage>=7){
    // All routes are on M1. Four disjoint nets; B is not shorted to S.
    box('metal','B',-3.7,-2.39,metalY,metalY+.16,-.36,-.04);
    box('metal','S',-1.46,-1.14,metalY,metalY+.16,-1.55,-.04);
    box('metal','S',-2.05,-1.14,metalY,metalY+.16,-1.55,-1.23);
    box('metal','D',1.14,3.7,metalY,metalY+.16,-.36,-.04);
    box('metal','G',-.16,.16,metalY,metalY+.16,-2.05,-.84);
  }
  return {boxes,gateY,metalY,terminals};
};
