const LETTERS=[
 {id:'promise',number:'01',title:'A camera. Two places. A promise.',label:'The places we’ll go',hint:'Banff. Vietnam. And everything you’ll notice.',body:`BUMO,

I haven’t forgotten. Banff. Vietnam. The camera you want, and all the things you’ll notice through it that I would have walked right past.

I want the mountain air with you. The lantern-lit evenings. The wrong turns, the snacks, and the photos where you tell me to take just one more.

I’m going to take us to Banff and Vietnam. I can’t put a date on that promise yet, but I haven’t let go of it. Until then, I want to keep finding little adventures with you.

We still have so much of the world to see.
Your SUMO`},
 {id:'love',number:'02',title:'My favourite part was you.',label:'The everyday kind of love',hint:'A little letter, from your SUMO.',body:`My BUMO,

When I think of Bangalore, I think of you at seven in the morning, negotiating five more minutes under that yellow blanket. I think of your tiny green helmet, our coconut stop, and knowing I’d get to see you again when I came to pick you up.

I loved that we could turn a normal evening into momos, nail extensions, falooda, and somehow one more stop. I even love the ridiculous photos I take from above. Especially those.

This year, I’ve watched you try new things, find your confidence, and become more comfortable being yourself. I know some of that took work that nobody else could see. I see it, and I’m so proud of you.

I adore the sleepy you, the silly you, the dressed-up you, and the you who shows up and takes her work seriously. You don’t have to be impressive or have everything figured out for me to love you.

I want the big adventures with you. But I also want to keep picking you up, listening to your day, and finding something good to eat on the way home. Those days meant so much to me.

Happy 25th, my love. I’m very glad I get to know you this closely.

I love you.
Your SUMO`}
];
const STYLE=`
#ending.letters-dialog{width:min(820px,calc(100vw - 34px));max-width:820px;max-height:88dvh;padding:30px 34px 25px;background:#fff0ce;color:#172439;overflow:auto;overscroll-behavior:contain;scrollbar-gutter:stable;border:4px solid #172439;border-radius:3px;box-shadow:7px 7px 0 #f57962,11px 11px 0 #172439;}
#ending.letters-dialog *,#ending.letters-dialog *:before,#ending.letters-dialog *:after{box-sizing:border-box;}
#ending.letters-dialog [hidden]{display:none!important;}
#ending.letters-dialog .letters-kicker{font:900 10px/1.4 'Courier New',monospace;letter-spacing:1.7px;color:#a4434b;margin:0 40px 9px 0;}
#ending.letters-dialog #letters-heading{font:900 clamp(32px,5vw,48px)/1.08 Impact,Haettenschweiler,'Arial Narrow Bold',sans-serif;letter-spacing:.1px;transform:none;margin:0 25px 10px 0;color:#172439;}
#ending.letters-dialog .letters-intro{font:500 14px/1.6 Arial,sans-serif;color:#4c5868;margin:0 0 24px;}
#ending.letters-dialog .letter-envelopes{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin:7px 0 27px;}
#ending.letters-dialog .letter-envelope{position:relative;min-width:0;display:flex;flex-direction:column;align-items:stretch;padding:0 0 17px;border:3px solid #172439;border-radius:2px;background:#fff8e5;color:#172439;text-align:left;box-shadow:4px 4px 0 #d7bb91;cursor:pointer;transition:transform .15s,box-shadow .15s;overflow:hidden;}
#ending.letters-dialog .letter-envelope:hover{transform:translateY(-3px);box-shadow:4px 7px 0 #f57962;}
#ending.letters-dialog .letter-envelope:focus-visible,#ending.letters-dialog button:focus-visible{outline:3px solid #178a8b;outline-offset:4px;}
#ending.letters-dialog .envelope-picture{position:relative;display:block;height:146px;overflow:hidden;border-bottom:3px solid #172439;background:#e8cc94;}
#ending.letters-dialog .envelope-picture:before{content:'';position:absolute;inset:0;background:#f9dda8;clip-path:polygon(0 0,100% 0,50% 62%);filter:drop-shadow(0 2px 0 #9b846b);}
#ending.letters-dialog .envelope-picture:after{content:'';position:absolute;inset:0;background:#efce98;clip-path:polygon(0 100%,0 26%,50% 77%,100% 26%,100% 100%);}
#ending.letters-dialog .letter-envelope[data-letter='love'] .envelope-picture{background:#d39da0;}
#ending.letters-dialog .letter-envelope[data-letter='love'] .envelope-picture:before{background:#f2b7b6;}
#ending.letters-dialog .letter-envelope[data-letter='love'] .envelope-picture:after{background:#dfa7ac;}
#ending.letters-dialog .envelope-seal{position:absolute;z-index:1;left:50%;top:57%;transform:translate(-50%,-50%) rotate(-9deg);display:grid;place-items:center;width:42px;height:42px;border:3px solid #172439;border-radius:50%;background:#77dfd4;color:#172439;box-shadow:2px 2px 0 #172439;font:900 20px/1 Arial,sans-serif;}
#ending.letters-dialog .letter-envelope[data-letter='love'] .envelope-seal{background:#f57962;color:#fff0ce;}
#ending.letters-dialog .envelope-stamp{position:absolute;right:12px;top:11px;padding:5px 6px;border:2px dashed #172439;color:#172439;font:900 9px/1.3 'Courier New',monospace;letter-spacing:.3px;transform:rotate(6deg);z-index:2;}
#ending.letters-dialog .envelope-number{display:block;padding:15px 16px 6px;font:900 9px/1 'Courier New',monospace;letter-spacing:1px;color:#90514d;}
#ending.letters-dialog .letter-envelope strong{display:block;padding:0 16px;font:900 22px/1.12 Impact,Haettenschweiler,sans-serif;letter-spacing:.25px;}
#ending.letters-dialog .envelope-hint{display:block;padding:8px 16px 14px;font:500 11px/1.5 Arial,sans-serif;color:#4e5c6b;}
#ending.letters-dialog .envelope-open{display:block;margin:auto 16px 0;color:#172439;font:900 10px/1.3 'Courier New',monospace;letter-spacing:.7px;}
#ending.letters-dialog .letter-back{margin:9px 0 23px;background:#172439;color:#fff0ce;border:2px solid #172439;border-radius:2px;padding:9px 13px;min-height:40px;font:900 11px/1.2 Arial,sans-serif;cursor:pointer;box-shadow:3px 3px 0 #77dfd4;}
#ending.letters-dialog .letter-back:hover{background:#315368;}
#ending.letters-dialog #letter-title{font:900 clamp(28px,4vw,37px)/1.1 Impact,Haettenschweiler,sans-serif;margin:0 0 23px;letter-spacing:.1px;color:#172439;transform:none;}
#ending.letters-dialog .letter-art{display:block;width:100%;height:auto;max-height:360px;object-fit:contain;background:#f5dfb4;border:3px solid #172439;margin:0 0 25px;box-shadow:4px 4px 0 #d4be96;}
#ending.letters-dialog .letter-paper{padding:25px 28px 17px;border:1px solid #dbc6a3;border-left:4px solid #d49786;background:#fffaed;box-shadow:3px 4px 0 #dfcbaa;overflow-wrap:break-word;}
#ending.letters-dialog .letter-paper p{white-space:pre-line;font:500 15px/1.85 Arial,Helvetica,sans-serif;color:#334154;margin:0 0 20px;}
#ending.letters-dialog .letter-paper p:first-child{font-weight:800;color:#172439;}
#ending.letters-dialog .letter-paper p:last-child{font-weight:800;color:#a4434b;}
#ending.letters-dialog .letter-reader{padding-bottom:26px;}
#ending.letters-dialog .letters-footer{display:flex;align-items:center;justify-content:space-between;gap:15px;padding-top:17px;border-top:2px solid #d9c6a5;}
#ending.letters-dialog .letters-footer>span{font:800 9px/1.5 'Courier New',monospace;letter-spacing:.8px;color:#687080;}
#ending.letters-dialog #keep-exploring{flex-shrink:0;}
@media(max-width:600px){#ending.letters-dialog{padding:25px 20px 21px;width:calc(100vw - 28px);border-width:3px;max-height:88dvh;box-shadow:5px 5px 0 #f57962,8px 8px 0 #172439;}#ending.letters-dialog #letters-heading{font-size:35px;max-width:250px;}#ending.letters-dialog .letters-intro{font-size:13px;margin-bottom:21px;}#ending.letters-dialog .letter-envelopes{gap:13px;}#ending.letters-dialog .envelope-picture{height:105px;}#ending.letters-dialog .envelope-seal{width:34px;height:34px;font-size:16px;}#ending.letters-dialog .envelope-stamp{font-size:7px;padding:3px;right:7px;top:8px;}#ending.letters-dialog .envelope-number{padding:12px 10px 6px;font-size:8px;}#ending.letters-dialog .letter-envelope strong{font-size:20px;padding:0 10px;}#ending.letters-dialog .envelope-hint{padding:7px 10px 12px;font-size:10px;}#ending.letters-dialog .envelope-open{margin-left:10px;font-size:8px;}#ending.letters-dialog .letter-paper{padding:20px 18px 11px;}#ending.letters-dialog .letter-paper p{font-size:14px;line-height:1.8;margin-bottom:19px;}#ending.letters-dialog .letters-footer{align-items:flex-start;flex-direction:column;gap:12px;}#ending.letters-dialog #keep-exploring{width:100%;}#ending.letters-dialog .letter-art{max-height:230px;}#ending.letters-dialog .letter-back{margin-bottom:20px;}}
@media(max-width:360px){#ending.letters-dialog .letter-envelopes{grid-template-columns:1fr;}#ending.letters-dialog .envelope-picture{height:118px;}#ending.letters-dialog .letter-envelope strong{font-size:23px;}}
@media(prefers-reduced-motion:reduce){#ending.letters-dialog .letter-envelope{transition:none;}}
`;

export function createLetters(dialog){
 if(!dialog)throw new Error('A native ending dialog is required');
 if(!document.getElementById('bumo-letters-style')){const style=document.createElement('style');style.id='bumo-letters-style';style.textContent=STYLE;document.head.append(style);}
 dialog.classList.add('letters-dialog');dialog.setAttribute('aria-labelledby','letters-heading');
 dialog.innerHTML=`<button type="button" class="close" data-close aria-label="Close letters">×</button><p class="letters-kicker">TWO LETTERS. BOTH FOR YOU.</p><h2 id="letters-heading">For all our tomorrows</h2><div class="letters-selection"><p class="letters-intro">Pick an envelope. There’s something I wanted to tell you.</p><div class="letter-envelopes"></div></div><section class="letter-reader" aria-labelledby="letter-title" hidden><button type="button" class="letter-back">← Back to the letters</button><h3 id="letter-title" tabindex="-1"></h3><img class="letter-art" alt="A camera, mountains, and the places we dream of seeing together" hidden><div class="letter-paper"></div></section><footer class="letters-footer"><span>HAPPY 25TH, BUMO.<br>WITH LOVE, YOUR SUMO.</span><button type="button" id="keep-exploring" class="primary">Stay a little longer →</button></footer>`;
 const selection=dialog.querySelector('.letters-selection'),reader=dialog.querySelector('.letter-reader'),grid=dialog.querySelector('.letter-envelopes'),title=dialog.querySelector('#letter-title'),paper=dialog.querySelector('.letter-paper'),art=dialog.querySelector('.letter-art');let active=null;
 const buttons=new Map();
 for(const letter of LETTERS){const button=document.createElement('button');button.type='button';button.className='letter-envelope';button.dataset.letter=letter.id;button.setAttribute('aria-label',`Open letter ${letter.number}: ${letter.title}`);button.setAttribute('aria-controls','letter-title');button.innerHTML=`<span class="envelope-picture" aria-hidden="true"><span class="envelope-seal">${letter.id==='love'?'♥':'✦'}</span><span class="envelope-stamp">TO BUMO<br>WITH LOVE</span></span><span class="envelope-number">LETTER ${letter.number}</span><strong></strong><span class="envelope-hint"></span><span class="envelope-open">OPEN YOUR LETTER ↗</span>`;button.querySelector('strong').textContent=letter.label;button.querySelector('.envelope-hint').textContent=letter.hint;button.addEventListener('click',()=>openLetter(letter.id));grid.append(button);buttons.set(letter.id,button);}
 function openLetter(id){const letter=LETTERS.find(l=>l.id===id);if(!letter)return false;active=id;title.textContent=letter.title;paper.replaceChildren();for(const paragraph of letter.body.split('\n\n')){const p=document.createElement('p');p.textContent=paragraph;paper.append(p);}selection.hidden=true;reader.hidden=false;art.hidden=true;dialog.dataset.letter=id;
  // Artwork is optional: absent or unfinished generation never prevents reading.
  art.onload=()=>{if(active==='promise')art.hidden=false;};art.onerror=()=>{art.hidden=true;};
  if(id==='promise'){if(art.getAttribute('src')==='assets/game-art/future-camera-v1.png'&&art.complete&&art.naturalWidth)art.hidden=false;else art.src='assets/game-art/future-camera-v1.png';}
  dialog.scrollTop=0;title.focus({preventScroll:true});return true;
 }
 function back(){const previous=active;active=null;selection.hidden=false;reader.hidden=true;art.hidden=true;delete dialog.dataset.letter;dialog.scrollTop=0;buttons.get(previous)?.focus({preventScroll:true});}
 dialog.querySelector('.letter-back').addEventListener('click',back);
 dialog.querySelector('.close').addEventListener('click',()=>dialog.close());dialog.querySelector('#keep-exploring').addEventListener('click',()=>dialog.close());
 dialog.dataset.lettersReady='true';return {openLetter,back,letters:LETTERS.map(({id,title})=>({id,title}))};
}
