import sys
s=open(sys.argv[1]).read()
R=[
# 1. One video element for the life of the page, moved into each new band.
('''function homeFilm(){
  if(!filmOn())return null;
  const b=e("div",{class:"film"});
  const v=e("video",{class:"fv",loop:"",muted:"",playsinline:"","webkit-playsinline":"",
    preload:"auto",poster:"media/evolve-poster.jpg",
    "aria-hidden":"true",tabindex:"-1"});''',
'''/* V187. One video element for the life of the page. Home repaints as each
   snapshot lands, and a fresh <video> on every paint meant a new player every
   time: the reel started over, and the page's load event waited on each new
   player, which on a slow Mac never ended. The element is built once and
   moved into each new band. Once the file has failed it is not tried again
   until the page is opened afresh. */
let FILM_V=null,FILM_DEAD=false;
function homeFilm(){
  if(!filmOn())return null;
  const b=e("div",{class:"film"});
  if(FILM_DEAD){
    b.classList.add("nofilm");
    b.appendChild(e("div",{class:"scrim"}));
    return b;
  }
  if(FILM_V){
    b.appendChild(FILM_V);
    if(FILM_V._go)FILM_V._go();
    b.appendChild(e("div",{class:"scrim"}));
    return b;
  }
  const v=e("video",{class:"fv",loop:"",muted:"",playsinline:"","webkit-playsinline":"",
    preload:"auto",poster:"media/evolve-poster.jpg",
    "aria-hidden":"true",tabindex:"-1"});
  FILM_V=v;'''),
# 2. The play call stays reachable for the next band.
('''    const go=()=>{const q=v.play();if(q&&q.catch)q.catch(()=>{});};''',
'''    const go=()=>{const q=v.play();if(q&&q.catch)q.catch(()=>{});};
    v._go=go;   /* V187 */'''),
# 3. A failed file is remembered for the life of the page.
('''    b.classList.add("nofilm");
    try{v.remove();}catch(x){}''',
'''    b.classList.add("nofilm");
    FILM_DEAD=true;FILM_V=null;   /* V187 */
    try{v.remove();}catch(x){}'''),
# 4. Build stamp.
('const BUILD="V186 2026-11-06T06:30Z";','const BUILD="V187 2026-11-06T09:00Z";'),
]
# every anchor is checked before anything is replaced
for a,b in R:
    assert s.count(a)==1,(s.count(a),a[:80])
for a,b in R:
    s=s.replace(a,b)
open(sys.argv[2],'w').write(s); print("ok",len(R))
