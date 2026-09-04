(function(){"use strict";var STORE_KEY="arc_coins";var START_COINS=1000;var GROWTH_RATE=0.17;var GROWTH_CURVE=0.006;var HOUSE_EDGE=0.97;var MAX_CRASH=250;var HISTORY_SIZE=10;var COOLDOWN_MS=1400;var BET_STEP=5;var BET_MAX=1000000;var canvas=document.getElementById("arc-canvas");var screenBox=document.getElementById("arc-screen");var multEl=document.getElementById("arc-mult");var flashEl=document.getElementById("arc-flash");var histEl=document.getElementById("arc-history");var balanceEl=document.getElementById("arc-balance");var resetBtn=document.getElementById("arc-reset");var betInput=document.getElementById("arc-bet");var betDownBtn=document.getElementById("arc-bet-down");var betUpBtn=document.getElementById("arc-bet-up");var actionBtn=document.getElementById("arc-action");var msgEl=document.getElementById("arc-msg");var soundBtn=document.getElementById("arc-sound");var presetBtns=[].slice.call(document.querySelectorAll(".arc-preset-a10b09fe"));if(!canvas||!canvas.getContext||!actionBtn||!betInput){return;}
var ctx=canvas.getContext("2d");var viewW=320;var viewH=260;var INK="#05030f";var GRID="#241a52";var YELLOW="#ffe14d";var PINK="#ff2d78";var GREEN="#3dff8c";var WHITE="#f4f1ff";var ROCKET_ROWS=["..W..",".WPW.",".PPP.","YPPPY","Y.P.Y"];var state={balance:START_COINS,phase:"idle",bet:10,crashAt:0,mult:1,cashed:false,cashMult:0,startStamp:0,rafId:0,tick:0,history:[],soundOn:false};var audioCtx=null;function loadCoins(){try{var raw=window.localStorage.getItem(STORE_KEY);if(raw!==null){var n=parseFloat(raw);if(isFinite(n)&&n>=0){return Math.round(n);}}}catch(err){}
return START_COINS;}
function saveCoins(){try{window.localStorage.setItem(STORE_KEY,String(state.balance));}catch(err){}}
function updateBalance(){if(balanceEl){balanceEl.textContent=String(Math.round(state.balance));}
saveCoins();}
function setMsg(text){if(msgEl){msgEl.textContent=text;}}
function readBet(){var v=Math.floor(Number(betInput.value));return isFinite(v)?v:0;}
function writeBet(v){betInput.value=String(v);}
function beep(freq,dur){if(!state.soundOn){return;}
try{var Ctor=window.AudioContext||window.webkitAudioContext;if(!Ctor){return;}
if(!audioCtx){audioCtx=new Ctor();}
if(audioCtx.state==="suspended"){audioCtx.resume();}
var osc=audioCtx.createOscillator();var gain=audioCtx.createGain();osc.type="square";osc.frequency.value=freq;gain.gain.setValueAtTime(0.045,audioCtx.currentTime);gain.gain.exponentialRampToValueAtTime(0.0001,audioCtx.currentTime+dur);osc.connect(gain);gain.connect(audioCtx.destination);osc.start();osc.stop(audioCtx.currentTime+dur);}catch(err){}}
function rollCrashPoint(){var u=Math.random();var m=HOUSE_EDGE/(1-u);if(m<=1){return 1;}
return Math.min(m,MAX_CRASH);}
function multAt(t){return Math.exp(GROWTH_RATE*t+GROWTH_CURVE*t*t);}
function fitCanvas(){var dpr=Math.max(1,Math.min(3,window.devicePixelRatio||1));var w=canvas.clientWidth;var h=canvas.clientHeight;if(!w||!h){return;}
viewW=w;viewH=h;canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);ctx.imageSmoothingEnabled=false;if(state.phase!=="flying"){drawIdle();}}
function drawGrid(){ctx.fillStyle=INK;ctx.fillRect(0,0,viewW,viewH);ctx.fillStyle=GRID;var cell=28;var x;var y;for(x=cell;x<viewW;x+=cell){ctx.fillRect(Math.round(x),0,2,viewH);}
for(y=cell;y<viewH;y+=cell){ctx.fillRect(0,Math.round(y),viewW,2);}}
function drawRocket(cx,cy,flying){var cell=4;var cols=5;var rows=ROCKET_ROWS.length;var ox=Math.round(cx-(cols*cell)/2);var oy=Math.round(cy-rows*cell);var r;var c;var ch;for(r=0;r<rows;r+=1){for(c=0;c<cols;c+=1){ch=ROCKET_ROWS[r].charAt(c);if(ch==="."){continue;}
if(ch==="W"){ctx.fillStyle=WHITE;}else if(ch==="Y"){ctx.fillStyle=YELLOW;}else{ctx.fillStyle=PINK;}
ctx.fillRect(ox+c*cell,oy+r*cell,cell,cell);}}
if(flying){ctx.fillStyle=state.tick%2?YELLOW:GREEN;ctx.fillRect(ox+2*cell,oy+rows*cell,cell,cell);if(state.tick%3===0){ctx.fillRect(ox+2*cell,oy+(rows+1)*cell,cell,cell);}}}
function drawBurst(cx,cy){var i;var dx;var dy;for(i=0;i<14;i+=1){dx=Math.round((Math.random()-0.5)*56);dy=Math.round((Math.random()-0.5)*56);ctx.fillStyle=i%2?PINK:YELLOW;ctx.fillRect(cx+dx,cy+dy,5,5);}}
function plotPoint(tt,t,mW){var padL=12;var padR=28;var padT=52;var padB=18;var plotW=Math.max(10,viewW-padL-padR);var plotH=Math.max(10,viewH-padT-padB);var tW=Math.max(6,t);var m=Math.min(multAt(tt),state.mult);var x=padL+(tt/tW)*plotW;var y=padT+plotH-
(Math.log(m)/Math.log(mW))*plotH;return{x:x,y:y};}
function renderFlight(t,exploded){drawGrid();var mW=Math.max(2,state.mult*1.18);var steps=Math.max(10,Math.floor(viewW/6));var tip={x:12,y:viewH-18};var i;var p;ctx.fillStyle=YELLOW;for(i=0;i<=steps;i+=1){p=plotPoint((i/steps)*t,t,mW);ctx.fillRect(Math.round(p.x)-2,Math.round(p.y)-2,5,5);tip=p;}
if(exploded){drawBurst(Math.round(tip.x),Math.round(tip.y));}else{drawRocket(tip.x,tip.y,true);}}
function drawIdle(){drawGrid();drawRocket(26,viewH-16,false);}
function updateReadout(busted){if(!multEl){return;}
multEl.textContent=state.mult.toFixed(2)+"x";var cls="arc-readout";if(state.phase==="flying"){cls+=" arc-readout-live";}
if(busted&&!state.cashed){cls+=" arc-readout-bust";}
multEl.className=cls;}
function showFlash(text,kind){if(!flashEl){return;}
flashEl.textContent=text;flashEl.className="arc-flash-a10b09fe"+
(kind==="win"?"arc-flash-win":"arc-flash-bust");}
function hideFlash(){if(flashEl){flashEl.className="arc-flash-a10b09fe";flashEl.textContent="";}}
function shakeScreen(){if(!screenBox){return;}
screenBox.classList.add("arc-shake-a10b09fe");window.setTimeout(function(){screenBox.classList.remove("arc-shake-a10b09fe");},500);}
function pushHistory(value){state.history.unshift(value);if(state.history.length>HISTORY_SIZE){state.history.pop();}
if(!histEl){return;}
histEl.textContent="";var i;var li;for(i=0;i<state.history.length;i+=1){li=document.createElement("li");li.className="arc-hist-a10b09fe"+
(state.history[i]>=2?"arc-hist-win":"arc-hist-bust");li.textContent=state.history[i].toFixed(2)+"x";histEl.appendChild(li);}}
function setControlsLocked(locked){var i;betInput.disabled=locked;if(betDownBtn){betDownBtn.disabled=locked;}
if(betUpBtn){betUpBtn.disabled=locked;}
if(resetBtn){resetBtn.disabled=locked;}
for(i=0;i<presetBtns.length;i+=1){presetBtns[i].disabled=locked;}}
function frame(now){if(state.phase!=="flying"){return;}
state.tick+=1;var t=(now-state.startStamp)/1000;var m=multAt(t);if(m>=state.crashAt){state.mult=state.crashAt;renderFlight(t,true);updateReadout(true);finishRound();return;}
state.mult=m;renderFlight(t,false);updateReadout(false);state.rafId=window.requestAnimationFrame(frame);}
function launch(){if(state.phase!=="idle"){return;}
var bet=readBet();if(bet<=0){setMsg("ENTER A BET ABOVE ZERO");return;}
if(bet>BET_MAX){bet=BET_MAX;}
if(bet>state.balance){setMsg("NOT ENOUGH COINS");return;}
writeBet(bet);state.bet=bet;state.balance-=bet;updateBalance();state.crashAt=rollCrashPoint();state.cashed=false;state.cashMult=0;state.mult=1;state.tick=0;state.phase="flying";state.startStamp=window.performance.now();setControlsLocked(true);actionBtn.textContent="CASH OUT";actionBtn.classList.add("arc-launch-live-a10b09fe");hideFlash();setMsg("CLIMBING... CASH OUT ANY TIME");beep(220,0.09);state.rafId=window.requestAnimationFrame(frame);}
function cashOut(){if(state.phase!=="flying"||state.cashed){return;}
state.cashed=true;state.cashMult=state.mult;var win=Math.round(state.bet*state.cashMult);state.balance+=win;updateBalance();actionBtn.disabled=true;showFlash("CASHED +"+win,"win");setMsg("LOCKED "+state.cashMult.toFixed(2)+"X. STILL FLYING");beep(660,0.12);}
function finishRound(){state.phase="cooldown";window.cancelAnimationFrame(state.rafId);pushHistory(state.crashAt);if(state.cashed){showFlash("POPPED @ "+state.crashAt.toFixed(2)+"x","win");setMsg("PAID AT "+state.cashMult.toFixed(2)+"X. NICE EXIT");}else{showFlash("CRASHED @ "+state.crashAt.toFixed(2)+"x","bust");shakeScreen();setMsg("BUST. THE ROCKET GOT AWAY");beep(110,0.3);}
window.setTimeout(function(){state.phase="idle";state.mult=1;setControlsLocked(false);actionBtn.disabled=false;actionBtn.textContent="LAUNCH";actionBtn.classList.remove("arc-launch-live-a10b09fe");hideFlash();updateReadout(false);drawIdle();if(state.balance<=0){setMsg("OUT OF COINS. PRESS RESET");}else{setMsg("PRESS LAUNCH TO LIFT OFF");}},COOLDOWN_MS);}
actionBtn.addEventListener("click",function(){if(state.phase==="idle"){launch();}else if(state.phase==="flying"){cashOut();}});if(betDownBtn){betDownBtn.addEventListener("click",function(){var v=Math.max(1,readBet()-BET_STEP);writeBet(v);});}
if(betUpBtn){betUpBtn.addEventListener("click",function(){var v=Math.min(BET_MAX,Math.max(1,readBet()+BET_STEP));writeBet(v);});}
presetBtns.forEach(function(btn){btn.addEventListener("click",function(){var v=Math.floor(Number(btn.getAttribute("data-bet")));if(isFinite(v)&&v>0){writeBet(v);}});});if(resetBtn){resetBtn.addEventListener("click",function(){if(state.phase==="flying"){return;}
state.balance=START_COINS;updateBalance();setMsg("COINS RESET TO "+START_COINS);beep(330,0.08);});}
if(soundBtn){soundBtn.addEventListener("click",function(){state.soundOn=!state.soundOn;soundBtn.textContent=state.soundOn?"SOUND: ON":"SOUND: OFF";soundBtn.setAttribute("aria-pressed",state.soundOn?"true":"false");beep(440,0.07);});}
window.addEventListener("resize",fitCanvas);state.balance=loadCoins();updateBalance();fitCanvas();drawIdle();updateReadout(false);}());