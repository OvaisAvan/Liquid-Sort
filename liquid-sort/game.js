(()=>{'use strict';
const $=id=>document.getElementById(id),E=LiquidSort,colours=['#ef98a5','#8edcc7','#f6cd79','#ada3ec'],names=['Rose','Mint','Honey','Lilac'],symbols=['●','◆','✦','▲'];
let board,selected=null,history=[],busy=false,sound=true,audio,pourAudio;
function tone(freq=440,duration=.1){if(!sound)return;try{audio??=new(window.AudioContext||window.webkitAudioContext)();audio.resume();const o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.setValueAtTime(freq,audio.currentTime);o.frequency.exponentialRampToValueAtTime(freq*.7,audio.currentTime+duration);g.gain.setValueAtTime(.16,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);o.connect(g).connect(audio.destination);o.start();o.stop(audio.currentTime+duration);}catch{}}
let activePour=null;
function stopPour(){if(activePour){activePour.pause();activePour.currentTime=0;activePour=null;}}
function pourSound(){
 stopPour();if(!sound||document.hidden)return;
 try{
 if(!pourAudio){pourAudio=new Audio('reference-pour.mp3');pourAudio.preload='auto';}
 pourAudio.currentTime=2;pourAudio.play().catch(()=>{});activePour=pourAudio;
 }catch{}
}
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopPour();});
function render(){
 $('board').replaceChildren();board.forEach((jar,i)=>{const b=document.createElement('button');b.className='jar'+(selected===i?' selected':'')+(jar.length===4&&jar.every(c=>c===jar[0])?' complete':'');b.dataset.index=i;b.setAttribute('aria-pressed',String(selected===i));b.setAttribute('aria-label',`Jar ${i+1}: ${jar.length?jar.slice().reverse().map(c=>names[c]).join(', ')+', top to bottom':'empty'}`);b.innerHTML='<span class="glass"><span class="liquids"></span></span><span class="jar-label">'+(jar.length===4&&jar.every(c=>c===jar[0])?'✓ ': '')+String(i+1).padStart(2,'0')+'</span>';jar.forEach(c=>{const layer=document.createElement('span');layer.className='layer';layer.style.setProperty('--liquid',colours[c]);layer.textContent=symbols[c];b.querySelector('.liquids').append(layer);});b.onclick=()=>pick(i);$('board').append(b);});$('moves').textContent=String(history.length).padStart(2,'0');$('undo').disabled=!history.length||busy;
}
function reset(){if(busy)return;board=E.levels[Number($('level').value)].map(j=>j.slice());history=[];selected=null;$('win').close();$('status').textContent='Select a jar, then choose where to pour.';render();}
function below(poly,y){const out=[];for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],inside=a.y>=y,next=b.y>=y;if(inside)out.push(a);if(inside!==next){const f=(y-a.y)/(b.y-a.y);out.push({x:a.x+(b.x-a.x)*f,y});}}return out;}
function area(poly){return Math.abs(poly.reduce((sum,a,i)=>{const b=poly[(i+1)%poly.length];return sum+a.x*b.y-b.x*a.y;},0)/2);}
function surface(poly,volume){let lo=Math.min(...poly.map(p=>p.y)),hi=Math.max(...poly.map(p=>p.y));for(let i=0;i<24;i++){const mid=(lo+hi)/2;if(area(below(poly,mid))>volume)lo=mid;else hi=mid;}return(lo+hi)/2;}
async function animate(from,to,result){
 if(matchMedia('(prefers-reduced-motion: reduce)').matches){pourSound();return;}
 const a=$('board').children[from],b=$('board').children[to];
 const canvas=document.createElement('canvas');canvas.className='liquid-animation';canvas.setAttribute('aria-hidden','true');document.body.append(canvas);const ctx=canvas.getContext('2d');
 a.style.visibility='hidden';b.style.visibility='hidden';
 const source=board[from],dest=board[to],direction=a.getBoundingClientRect().x<=b.getBoundingClientRect().x?1:-1;
 const ease=t=>t*t*(3-2*t),duration=1100+result.count*180;let previousSize='';
 function geometry(x,y,w,angle){const c=Math.cos(angle),s=Math.sin(angle);const point=(px,py)=>({x:x+(px-w/2)*c-(py-90)*s,y:y+(px-w/2)*s+(py-90)*c});return {point,poly:[[12,16],[w-12,16],[w-12,165],[12,165]].map(([px,py])=>point(px,py))};}
 function tilt(w,units){let lo=0,hi=1.53;for(let i=0;i<22;i++){const angle=(lo+hi)/2,g=geometry(0,0,w,angle),lip=g.point(direction>0?w-12:12,16);if(area(below(g.poly,lip.y))>(w-24)*35*units)lo=angle;else hi=angle;}return (lo+hi)/2*direction;}
 function jar(x,y,w,angle,layers){const g=geometry(x,y,w,angle);ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.translate(-w/2,-90);ctx.beginPath();ctx.roundRect(10,12,w-20,156,[4,4,20,20]);ctx.clip();ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);let cumulative=0;
 for(let i=0;i<layers.length;i++){const item=layers[i];if(item.amount<=0)continue;const bottom=surface(g.poly,cumulative*(w-24)*35);cumulative+=item.amount;const top=surface(g.poly,cumulative*(w-24)*35);ctx.fillStyle=colours[item.colour];ctx.fillRect(x-220,top,440,bottom-top+1);ctx.fillStyle='#ffffff25';ctx.fillRect(x-220,top,440,1.5);}
 ctx.restore();ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.translate(-w/2,-90);const glass=ctx.createLinearGradient(8,0,w-8,0);glass.addColorStop(0,'#ffffff18');glass.addColorStop(.5,'#ffffff00');glass.addColorStop(1,'#ffffff14');ctx.fillStyle=glass;ctx.strokeStyle='#c9e6e68c';ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(7,10,w-14,160,[5,5,22,22]);ctx.fill();ctx.stroke();ctx.strokeStyle='#ffffff55';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(17,23);ctx.lineTo(17,144);ctx.stroke();ctx.restore();return g;}
 let started,soundPlayed=false;
 try{await new Promise(resolve=>{function frame(now){started??=now;const elapsed=now-started,r=a.getBoundingClientRect(),t=b.getBoundingClientRect(),w=r.width;const key=innerWidth+':'+innerHeight+':'+devicePixelRatio;if(key!==previousSize){canvas.width=innerWidth*devicePixelRatio;canvas.height=innerHeight*devicePixelRatio;previousSize=key;}ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);ctx.clearRect(0,0,innerWidth,innerHeight);
 const progress=Math.max(0,Math.min(1,(elapsed-420)/duration)),amount=result.count*progress,units=source.length-amount;
 if(progress>0&&progress<.1&&!soundPlayed){soundPlayed=true;pourSound();}if(progress>=1)stopPour();
 const angle=tilt(w,Math.max(.02,units));const anchor={x:t.x+t.width/2,y:t.y-26};let blend=elapsed<420?ease(elapsed/420):elapsed>420+duration?1-ease(Math.min(1,(elapsed-420-duration)/420)):1;
 const actualAngle=angle*blend,rotated=geometry(0,0,w,actualAngle).point(direction>0?w-12:12,16);
 const home={x:r.x+w/2,y:r.y+90},pour={x:anchor.x-rotated.x,y:anchor.y-rotated.y};const x=home.x+(pour.x-home.x)*blend,y=home.y+(pour.y-home.y)*blend;
 const layers=source.map((colour,i)=>({colour,amount:Math.max(0,Math.min(1,source.length-amount-i))}));
 const receiving=dest.map(colour=>({colour,amount:1}));if(amount>0)receiving.push({colour:result.colour,amount});const targetG=jar(t.x+t.width/2,t.y+90,t.width,0,receiving);const sourceG=jar(x,y,w,actualAngle,layers);
 if(progress>0&&progress<1){const lip=sourceG.point(direction>0?w-12:12,16),endY=surface(targetG.poly,(dest.length+amount)*(t.width-24)*35);ctx.strokeStyle=colours[result.colour];ctx.lineWidth=5+Math.sin(progress*Math.PI)*2;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(lip.x,lip.y);ctx.bezierCurveTo(lip.x,lip.y+18,anchor.x,endY-20,anchor.x,endY);ctx.stroke();ctx.strokeStyle='#ffffff65';ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(anchor.x,endY,8+Math.sin(now/65)*2,2.5,0,0,Math.PI*2);ctx.stroke();}
 if(elapsed<840+duration)requestAnimationFrame(frame);else resolve();}requestAnimationFrame(frame);});
 }finally{stopPour();canvas.remove();a.style.visibility='';b.style.visibility='';}
}

async function pick(i){if(busy||E.won(board))return;if(selected===null){if(!board[i].length){$('status').textContent='Choose a jar with liquid first.';return;}selected=i;tone(720);render();return;}if(selected===i){selected=null;render();return;}const from=selected,result=E.pour(board,from,i);if(!result){tone(145,.22);$('status').textContent=board[i].length===4?'That jar is full. Try another jar.':'Only matching top colours can mix. Try an empty jar.';const target=$('board').children[i];target.classList.remove('shake');void target.offsetWidth;target.classList.add('shake');selected=null;render();return;}
 busy=true;$('level').disabled=true;$('restart').disabled=true;$('undo').disabled=true;try{await animate(from,i,result);}finally{history.push(board.map(j=>j.slice()));board=result.board;selected=null;busy=false;$('level').disabled=false;$('restart').disabled=false;render();}
 if(E.won(board)){tone(880,.4);$('result').textContent=`All colours sorted in ${history.length} pours. Beautiful work.`;$('next').textContent=Number($('level').value)===E.levels.length-1?'Start from the beginning ↗':'Next experiment ↗';$('win').showModal();}else $('status').textContent=E.legalMoves(board).length?'Lovely pour. Find your next match.':'No pours available. Undo a move or restart.';
}
$('restart').onclick=reset;$('level').onchange=reset;$('undo').onclick=()=>{if(busy||!history.length)return;board=history.pop();selected=null;render();$('status').textContent='One step back. A fresh perspective.';tone(360);};$('sound').onclick=()=>{sound=!sound;if(!sound)stopPour();$('sound').textContent=sound?'Sound on':'Sound off';$('sound').setAttribute('aria-pressed',String(sound));if(sound)tone();};$('next').onclick=()=>{$('level').value=(Number($('level').value)+1)%E.levels.length;reset();};$('replay').onclick=reset;reset();
})();
