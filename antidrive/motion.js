// antiDrive motion: IntersectionObserver + CSS. No scroll-jacking.
(function(){
  var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  var d=document,root=d.documentElement;
  // nav state
  var top=d.querySelector('.top');
  function onScroll(){if(top)top.classList.toggle('scrolled',scrollY>12)}
  addEventListener('scroll',onScroll,{passive:true});onScroll();
  // feature tour: progressive disclosure, auto-advances while visible
  var tour=d.querySelector('.tour');
  if(tour){
    var steps=[].slice.call(tour.querySelectorAll('.tstep')),vids=[].slice.call(tour.querySelectorAll('video')),cur=0,visible=false,timer=null;
    function load(v){if(v.dataset.loaded)return;[].slice.call(v.querySelectorAll('source[data-src]')).forEach(function(s){s.src=s.dataset.src});v.load();v.dataset.loaded=1}
    // the clip that is showing stays fully opaque underneath until the next one has a frame and has faded in on top,
    // so the panel is never empty (no fading both out over the background, no blank before the first frame)
    var front=null,fadeT=null;
    function swap(i){var v=vids[i];if(!v)return;clearTimeout(fadeT);load(v);
      var prev=front&&front!==v?front:null;front=v;
      vids.forEach(function(o){if(o!==v&&o!==prev){o.classList.remove('on','was');o.pause()}});
      if(prev){prev.classList.remove('on');prev.classList.add('was')}
      try{v.currentTime=0}catch(e){}
      if(visible&&!reduce)v.play().catch(function(){});
      function reveal(){if(front!==v)return;v.classList.remove('was');v.classList.add('on');
        if(prev)fadeT=setTimeout(function(){if(front===v){prev.classList.remove('was');prev.pause()}},500)}
      if(!prev||v.readyState>=2)reveal();
      else{var done=false,go=function(){if(done)return;done=true;v.removeEventListener('loadeddata',go);reveal()};v.addEventListener('loadeddata',go);setTimeout(go,1500)}}
    function show(i,user){cur=i;steps.forEach(function(s,k){s.classList.toggle('on',k===i);s.setAttribute('aria-expanded',k===i)});
      swap(i);
      if(vids[i+1])load(vids[i+1]);
      clearTimeout(timer);if(visible&&!reduce)timer=setTimeout(function(){show((cur+1)%steps.length)},user?12000:6000);
      steps[i].style.setProperty('--dur',(user?12:6)+'s');
      var b=steps[i].querySelector('.bar');if(b){b.style.animation='none';b.offsetWidth;b.style.animation=''}}
    steps.forEach(function(s,i){s.addEventListener('click',function(){show(i,true)})});
    // reserve the tallest open state so switching groups never pushes the page around
    var list=tour.querySelector('.tour-steps');
    function reserve(){if(!list)return;list.style.minHeight='';var gap=parseFloat(getComputedStyle(list).rowGap)||0,base=0,extra=0;
      steps.forEach(function(s){var u=s.querySelector('ul'),uh=u?u.scrollHeight:0;base+=s.offsetHeight-(u?u.offsetHeight+parseFloat(getComputedStyle(u).marginTop||0):0);extra=Math.max(extra,uh+10)});
      list.style.minHeight=Math.ceil(base+extra+gap*(steps.length-1))+'px'}
    reserve();addEventListener('resize',reserve);if(d.fonts&&d.fonts.ready)d.fonts.ready.then(reserve);
    // auto-advance only while the demo itself is on screen
    var stage=tour.querySelector('.tour-stage')||tour;
    new IntersectionObserver(function(es){es.forEach(function(e){var was=visible;visible=e.isIntersecting;tour.classList.toggle('paused',!visible);
      if(visible&&!was)show(cur);else if(!visible){clearTimeout(timer);vids.forEach(function(v){v.pause()})}})},{threshold:.5}).observe(stage);
    show(0);
  }
  if(reduce)return;
  root.classList.add('m');
  // split headlines into masked words
  [].slice.call(d.querySelectorAll('h1,h2')).forEach(function(h){
    var i=0;(function walk(n){[].slice.call(n.childNodes).forEach(function(c){
      if(c.nodeType===3){var f=d.createDocumentFragment();c.textContent.split(/(\s+)/).forEach(function(w){if(!w)return;if(/^\s+$/.test(w)){f.appendChild(d.createTextNode(w));return}
        var o=d.createElement('span');o.className='wd';var s=d.createElement('span');s.textContent=w;s.style.setProperty('--i',i++);o.appendChild(s);f.appendChild(o)});n.replaceChild(f,c)}
      else if(c.nodeType===1&&!c.classList.contains('wd'))walk(c)})})(h);
    h.classList.add('split')});
  // stagger groups
  var groups='.steps,.status,.cmp,.btns,.doc .body section,.toc';
  [].slice.call(d.querySelectorAll(groups)).forEach(function(g){[].slice.call(g.children).forEach(function(c,i){if(c.tagName==='H2')return;c.classList.add('bi');c.style.setProperty('--i',Math.min(i,10))})});
  [].slice.call(d.querySelectorAll('.rv,.eyebrow,.fine,.src,.tour-stage,.tstep,.get .icon,.get .sub')).forEach(function(e,i){if(!e.closest('.hero'))e.classList.add('bi')});
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{rootMargin:'0px 0px -8% 0px',threshold:.08});
  [].slice.call(d.querySelectorAll('.bi,.split,.hero')).forEach(function(e){io.observe(e)});
  // the last rows on a page can never cross the -8% line, so reveal whatever is left once the bottom is reached
  function flush(){if(innerHeight+scrollY<root.scrollHeight-4)return;[].slice.call(d.querySelectorAll('.bi:not(.in),.split:not(.in)')).forEach(function(e){e.classList.add('in');io.unobserve(e)})}
  addEventListener('scroll',flush,{passive:true});addEventListener('load',flush);
  // hero parallax (desktop only, cheap transform)
  var plate=d.querySelector('.hero .plate');
  if(plate&&matchMedia('(min-width: 861px)').matches){var tk=false;addEventListener('scroll',function(){if(tk)return;tk=true;requestAnimationFrame(function(){var y=Math.min(scrollY,900);plate.style.translate='0 '+(y*.18)+'px';plate.style.scale=String(1+y*.00012);tk=false})},{passive:true})}
})();
