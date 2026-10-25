// antiDrive motion: IntersectionObserver + CSS. No scroll-jacking.
(function(){
  var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  var d=document,root=d.documentElement;
  // nav state
  var top=d.querySelector('.top');
  function onScroll(){if(top)top.classList.toggle('scrolled',scrollY>12)}
  addEventListener('scroll',onScroll,{passive:true});onScroll();
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
  [].slice.call(d.querySelectorAll('.rv,.eyebrow,.fine,.src,.get .icon,.get .sub')).forEach(function(e,i){if(!e.closest('.hero'))e.classList.add('bi')});
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{rootMargin:'0px 0px -8% 0px',threshold:.08});
  [].slice.call(d.querySelectorAll('.bi,.split,.hero')).forEach(function(e){io.observe(e)});
  // the last rows on a page can never cross the -8% line, so reveal whatever is left once the bottom is reached
  function flush(){if(innerHeight+scrollY<root.scrollHeight-4)return;[].slice.call(d.querySelectorAll('.bi:not(.in),.split:not(.in)')).forEach(function(e){e.classList.add('in');io.unobserve(e)})}
  addEventListener('scroll',flush,{passive:true});addEventListener('load',flush);
  // hero parallax (desktop only, cheap transform)
  var plate=d.querySelector('.hero .plate');
  if(plate&&matchMedia('(min-width: 861px)').matches){var tk=false;addEventListener('scroll',function(){if(tk)return;tk=true;requestAnimationFrame(function(){var y=Math.min(scrollY,900);plate.style.translate='0 '+(y*.18)+'px';plate.style.scale=String(1+y*.00012);tk=false})},{passive:true})}
})();
