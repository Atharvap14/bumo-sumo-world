// One authored timeline drives chapters, scenery, travel and the two wardrobes.
export const STORY_ORDER=['home','auto','office','coconut','momos','nails','falooda','waiwai','pool','comedy','cinema'];
export const STORY={
 home:{phase:'first-day',time:'FIRST DAY · 07:00',bumo:'sleep',sumo:'sleep',travelBumo:'office',travelSumo:'office',cue:'Our first morning',note:'Five more minutes. Then we get ready for her first day.'},
 auto:{phase:'first-day',time:'FIRST DAY · ON THE WAY',bumo:'office',sumo:'office',travelBumo:'office',travelSumo:'office',cue:'Our first day · by auto',note:'Dressed for office. Our first journey was in an auto.'},
 office:{phase:'first-day',time:'FIRST DAY · AT THE OFFICE',bumo:'office',sumo:'office',travelBumo:'office',travelSumo:'office',cue:'Her first day at work',note:'The same striped blouse, grey trousers and backpack from the auto ride.'},
 coconut:{phase:'routine',time:'LATER MORNINGS · NARIYAL PAANI',bumo:'commute',sumo:'commute',travelBumo:'commute',travelSumo:'commute',helmet:true,cue:'Later mornings · the scooty days',note:'The yellow scooty, your green helmet, and the left before Ganpati Road.'},
 momos:{phase:'routine',time:'AFTER WORK · MOMOS',bumo:'commute',sumo:'commute',travelBumo:'commute',travelSumo:'commute',helmet:true,cue:'After work · our usual stop',note:'Still in our everyday clothes. First, momos.'},
 nails:{phase:'evening-out',time:'ANOTHER EVENING · NAIL EXTENSIONS',bumo:'dinner',sumo:'dinner',travelBumo:'dinner',travelSumo:'dinner',cue:'Another evening · dressed up',note:'Nail extensions, a little wandering, and nowhere to hurry.'},
 falooda:{phase:'evening-out',time:'THAT EVENING · FALOODA',bumo:'dinner',sumo:'dinner',travelBumo:'dinner',travelSumo:'dinner',cue:'One more stop · falooda',note:'The same evening outfits. Something sweet on the way.'},
 waiwai:{phase:'evening-out',time:'THAT EVENING · WAI WAI',bumo:'dinner',sumo:'dinner',travelBumo:'dinner',travelSumo:'dinner',cue:'A very BUMO dinner',note:'The mint doorway, pink flowers and your black dress.'},
 pool:{phase:'pool-day',time:'ANOTHER AFTERNOON · OUR POOL',bumo:'swim',sumo:'swim',travelBumo:'commute',travelSumo:'commute',cue:'Another afternoon · our little dolphin',note:'A separate memory at the pool near home. We change for our swim when we arrive.'},
 comedy:{phase:'comedy-night',time:'ANOTHER NIGHT · STAND-UP',bumo:'dinner',sumo:'dinner',travelBumo:'dinner',travelSumo:'dinner',cue:'Another night · laughing together',note:'Out of our swimming clothes, dressed for the stand-up show.'},
 cinema:{phase:'movie-night',time:'MOVIE NIGHT · YOUR SPIDER-MAN',bumo:'spider',sumo:'dinner',travelBumo:'spider',travelSumo:'dinner',cue:'Movie night · your Spider-Man hoodie',note:'Your black-and-red hoodie. A different night, another favourite memory.'}
};
export function orderedStops(stops){return STORY_ORDER.map(id=>{const stop=stops.find(s=>s.id===id);if(!stop)throw new Error('Missing story chapter '+id);return {...stop,time:STORY[id].time,story:STORY[id]};});}
export function nextStoryStop(stops,current){const i=stops.findIndex(s=>s.id===current.id);return {...stops[(i+1)%stops.length],x:current.x+18,z:0};}
export function travelPlan(from,to){const profile=STORY[to.id];return {vehicle:['auto','office'].includes(to.id)?'auto':'bike',bumo:profile.travelBumo,sumo:profile.travelSumo,cue:profile.cue,phaseChange:STORY[from.id].phase!==profile.phase};}

export function memoryArt(id){const safe=/^[a-z0-9-]+$/.test(id)?id:'home';return `assets/memory-art/${safe}-${['momos','falooda','comedy'].includes(safe)?'v2':'v1'}.png`;}
