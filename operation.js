/* Educational long-channel MOS model; values are not SKY130 process predictions. */
(() => {
  const states={nmos:{vg:1.2,vd:.3,vb:0,vt:.45},pmos:{vg:.6,vd:1.5,vb:1.8,vt:.45}};
  let mode='nmos',sweep=null;
  const root=document.querySelector('[data-operation]');
  const q=s=>root.querySelector(s);
  const f=v=>Number(v).toFixed(2);
  function model(type,v){
    const p=type==='pmos',vs=p?1.8:0,sign=p?-1:1;
    const g=sign*(v.vg-vs),d=sign*(v.vd-vs),reverse=sign*(vs-v.vb);
    const valid=d>=-1e-9&&reverse>=-1e-9;
    const threshold=v.vt+.4*(Math.sqrt(.6+Math.max(0,reverse))-Math.sqrt(.6));
    const over=g-threshold,k=p?100:200;
    const region=!valid?'Outside model':over<=0?'Cutoff':d<over-1e-9?'Linear / triode':'Saturation';
    const id=!valid?NaN:over<=0?0:k*(d<over?over*d-d*d/2:over*over/2);
    return {p,vs,g,d,reverse,threshold,over,k,region,id,valid};
  }
  window.cmosMosModel=model;
  root.innerHTML=`<div class="viz-row"><h3 data-op-title></h3><span>Operation · side view</span></div>
    <p>All terminal voltages are relative to ground. Source is fixed: NMOS 0 V, PMOS 1.8 V. Vt0 is a model parameter, not a terminal voltage.</p>
    <div class="op-controls">${[['vg','Vg · gate',0,1.8],['vd','Vd · drain',0,1.8],['vb','Vb · body',-1,2.8],['vt','|Vt0| · zero-bias threshold',.1,1]].map(([key,title,min,max])=>`<label>${title}<input data-op="${key}" type="range" min="${min}" max="${max}" step=".01"><input aria-label="${title} in volts" data-number="${key}" type="number" min="${min}" max="${max}" step=".01"> V</label>`).join('')}</div>
    <div class="viz-row"><button class="btn" data-preset="cutoff">Cutoff</button><button class="btn" data-preset="linear">Linear</button><button class="btn" data-preset="boundary">Pinch-off boundary</button><button class="btn" data-preset="sat">Saturation</button><button class="btn" data-preset="body">Body effect</button></div>
    <div class="viz-row"><label>Sweep <select class="form-select" data-sweep-axis><option value="vd">Vd</option><option value="vg">Vg</option><option value="vb">Vb</option><option value="vt">|Vt0|</option></select></label><button class="btn" data-sweep>Play sweep</button><button class="btn" data-op-reset>Reset</button></div>
    <strong data-region aria-live="polite"></strong><p data-bias></p>
    <svg data-channel viewBox="0 0 660 260" role="img" aria-label="MOS channel side view"></svg>
    <p data-channel-note></p>
    <svg data-curve viewBox="0 0 660 260" role="img" aria-label="Drain current versus selected sweep voltage"></svg>
    <details><summary>Model and equations · show/hide</summary><p>NMOS: G=VGS, D=VDS. PMOS: G=VSG, D=VSD. Overdrive O=G−|Vt|. O≤0: cutoff. 0≤D&lt;O: linear. D≥O: saturation; pinch-off starts at the drain when D=O.</p><p>|Vt|=|Vt0|+γ(√(2φ+Vreverse)−√(2φ)); γ=0.4 √V, 2φ=0.6 V. NMOS Vreverse=VS−VB; PMOS Vreverse=VB−VS. Increasing reverse body bias increases |Vt|.</p><p>|ID|=k(OD−D²/2) in the linear region; kO²/2 in saturation. k=200 µA/V² NMOS, 100 µA/V² PMOS; geometry fixed. This model excludes subthreshold leakage, channel-length modulation, junction current and short-channel effects. Channel depth is not to scale. Forward body bias and reversed source/drain bias are not supported.</p><p><a target="_blank" rel="noopener" href="https://ocw.mit.edu/courses/6-012-microelectronic-devices-and-circuits-spring-2009/4dd0f37dcb3a9617b66b82a33894ef73_MIT6_012S09_lec09.pdf">MIT OCW · MOSFET I–V characteristics</a></p></details>`;
  function stopSweep(){clearInterval(sweep);sweep=null;q('[data-sweep]').textContent='Play sweep';}
  function limits(key){if(key==='vb')return mode==='pmos'?[1.8,2.8]:[-1,0];if(key==='vt')return [.1,1];return [0,1.8];}
  function curve(){
    const key=q('[data-sweep-axis]').value,[lo,hi]=limits(key),v=states[mode],m=model(mode,v);
    const samples=Array.from({length:121},(_,i)=>{const x=lo+(hi-lo)*i/120;return {x,y:model(mode,{...v,[key]:x}).id};});
    const maxY=Math.max(10,...samples.filter(v=>Number.isFinite(v.y)).map(v=>v.y))*1.1;
    const px=x=>65+(x-lo)/(hi-lo)*550,py=y=>215-y/maxY*175;
    const path=samples.filter(v=>Number.isFinite(v.y)).map((v,i)=>(i?'L':'M')+px(v.x)+','+py(v.y)).join(' ');
    const dot=Number.isFinite(m.id)?`<circle cx="${px(v[key])}" cy="${py(m.id)}" r="6" fill="#ef9928"/>`:'';
    q('[data-curve]').innerHTML=`<g fill="none" stroke="currentColor"><path d="M65 30V215H620"/>${[0,.5,1].map(t=>`<path opacity=".15" d="M65 ${py(t*maxY)}H620"/>`).join('')}</g><path d="${path}" fill="none" stroke="#378bbf" stroke-width="3"/>${dot}<g fill="currentColor" font-size="14"><text x="65" y="20">|ID| (µA) · ${mode.toUpperCase()}</text><text x="420" y="248">${key==='vt'?'|Vt0|':key.toUpperCase()} (V)</text><text x="20" y="220">0</text><text x="15" y="45">${maxY.toFixed(0)}</text><text x="60" y="240">${f(lo)}</text><text x="585" y="240">${f(hi)}</text><text x="300" y="20">Orange dot = current bias</text></g>`;
  }
  function render(){
    const v=states[mode],m=model(mode,v),p=m.p;
    q('[data-op-title]').textContent=mode.toUpperCase()+' voltage lab';
    for(const key of ['vg','vd','vb','vt']){const [lo,hi]=limits(key);for(const sel of ['[data-op="'+key+'"]','[data-number="'+key+'"]']){q(sel).min=lo;q(sel).max=hi;q(sel).value=v[key];}}
    q('[data-region]').textContent=m.region+' · |ID| = '+(m.valid?f(m.id)+' µA':'not modeled');
    q('[data-bias]').textContent=`VS=${f(m.vs)} V · ${p?'VSG':'VGS'}=${f(m.g)} V · ${p?'VSD':'VDS'}=${f(m.d)} V · ${p?'VTP':'VTN'}=${p?'−':''}${f(m.threshold)} V · overdrive=${f(m.over)} V`;
    const active=p?'#843d42':'#285c46',body=p?'#87a294':'#b18a88',on=m.over>0&&m.valid;
    const sat=on&&m.d>=m.over-1e-9,depth=Math.min(42,Math.max(6,m.over*35));
    // Charge-control cartoon: channel charge tapers toward the drain; saturation ends at zero charge.
    const bottom=Array.from({length:31},(_,i)=>{const t=i/30;const residual=Math.sqrt(Math.max(0,1-(sat?1:1-(1-m.d/m.over)**2)*t));return [180+t*300,130+depth*residual];});
    const polygon=on?`<polygon points="180,130 480,130 ${bottom.reverse().map(v=>v.join(',')).join(' ')}" fill="${active}" opacity=".85"/>`:'';
    q('[data-channel]').innerHTML=`<rect x="45" y="130" width="570" height="100" rx="2" fill="#b18a88"/>${p?`<rect x="60" y="130" width="540" height="80" fill="${body}" stroke="#285c46"/>`:''}<rect x="85" y="130" width="95" height="46" fill="${active}"/><rect x="480" y="130" width="95" height="46" fill="${active}"/><rect x="180" y="112" width="300" height="14" fill="#b2bbc4"/><rect x="180" y="80" width="300" height="29" fill="#ba8d46"/>${polygon}<g fill="currentColor" font-size="15" text-anchor="middle"><text x="132" y="48">S · ${f(m.vs)} V</text><text x="330" y="48">G · ${f(v.vg)} V</text><text x="528" y="48">D · ${f(v.vd)} V</text><text x="330" y="253">B · ${p?'n-well':'p-body'} · ${f(v.vb)} V</text><text x="570" y="111">Oxide</text></g><g fill="#172d28" text-anchor="middle" font-size="14"><text x="132" y="156" fill="white">${p?'p+':'n+'}</text><text x="528" y="156" fill="white">${p?'p+':'n+'}</text><text x="330" y="202">${!m.valid?'Bias outside model':on?(sat?'Pinch-off at drain → current still flows':'Continuous inversion channel'):'No inversion channel · cutoff'}</text></g><g stroke="currentColor"><path d="M132 56V128M330 56V80M528 56V128"/></g>${sat?'<circle cx="480" cy="130" r="8" fill="none" stroke="#f49c19" stroke-width="3"/>':''}`;
    q('[data-channel-note]').textContent=!m.valid?'This bias is outside the assumptions of this model.':!on?'Gate drive is below threshold. The ideal model gives ID=0; real devices have small subthreshold leakage.':sat?'Inversion charge approaches zero at the drain: this is pinch-off. Current does not stop; the drain field collects the carriers. ID saturates in this ideal model.':m.d<.001?'A channel exists, but source and drain have equal voltages: net drain current is zero.':'Channel charge decreases toward the drain, but the channel remains continuous. Increasing drain-source voltage increases current.';
    curve();
  }
  function changeBias(e){const key=e.target.dataset.op||e.target.dataset.number;if(!key)return;stopSweep();const raw=Number(e.target.value);if(!Number.isFinite(raw))return;const [lo,hi]=limits(key);states[mode][key]=Math.max(lo,Math.min(hi,raw));render();}
  root.addEventListener('input',e=>{if(e.target.dataset.op)changeBias(e);});
  root.addEventListener('change',e=>{if(e.target.dataset.number)changeBias(e);});
  q('[data-sweep-axis]').addEventListener('change',()=>{stopSweep();render();});
  q('[data-sweep]').addEventListener('click',()=>{if(sweep){stopSweep();return;}const key=q('[data-sweep-axis]').value,[lo,hi]=limits(key);states[mode][key]=lo;let frame=0;render();q('[data-sweep]').textContent='Pause sweep';sweep=setInterval(()=>{frame++;states[mode][key]=Math.min(hi,lo+(hi-lo)*frame/100);render();if(frame>=100)stopSweep();},80);});
  root.querySelectorAll('[data-preset]').forEach(b=>b.addEventListener('click',()=>{stopSweep();const p=mode==='pmos',v=states[mode];Object.assign(v,{vg:p?.6:1.2,vd:p?1.5:.3,vb:p?1.8:0,vt:.45});const preset=b.dataset.preset;if(preset==='cutoff')v.vg=p?1.6:.2;if(preset==='boundary')v.vd=p?1.05:.75;if(preset==='sat')v.vd=p?.3:1.5;if(preset==='body')v.vb=p?2.8:-1;render();}));
  q('[data-op-reset]').addEventListener('click',()=>root.querySelector('[data-preset="linear"]').click());
  window.cmosOperation=(next,visible)=>{if(next!==mode||!visible)stopSweep();if(['nmos','pmos'].includes(next))mode=next;if(visible)render();};
})();
