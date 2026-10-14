(function(){
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
if(reduce||!window.gsap||!window.ScrollTrigger)return;
gsap.registerPlugin(ScrollTrigger);
const touch=matchMedia('(pointer: coarse)').matches, mobile=innerWidth<860;
if(window.Lenis&&!touch){const l=new Lenis({lerp:.1});l.on('scroll',ScrollTrigger.update);gsap.ticker.add(t=>l.raf(t*1000));gsap.ticker.lagSmoothing(0);}
ScrollTrigger.config({ignoreMobileResize:true});
gsap.to('.progress',{scaleX:1,ease:'none',scrollTrigger:{start:0,end:'max',scrub:true}});
// cinematic intro
gsap.set('.hero-txt,.mosaic',{opacity:0});
const slides=gsap.utils.toArray('.intro .slide'),tl=gsap.timeline({defaults:{ease:'sine.inOut'}});
slides.forEach((s,i)=>{const img=s.querySelector('img'),at=i*1.1;
  tl.fromTo(img,{scale:1.25,xPercent:i%2?-4:4,yPercent:i%2?3:-3},{scale:1.05,xPercent:0,yPercent:0,duration:2.4,ease:'none'},at)
    .to(s,{opacity:1,duration:.8},at).to(s,{opacity:i==slides.length-1?1:0,duration:.8},at+1.6);
});
tl.to('.glow',{opacity:1,duration:1.2,yoyo:true,repeat:3},0)
  .to('.flicker',{keyframes:{opacity:[0,.35,0,.2,0,.5,0]},duration:1.2,ease:'none'},1.8)
  .to('.flicker',{keyframes:{opacity:[0,.3,0]},duration:.4,ease:'none'},3.9);
const end=slides.length*1.1+.6;
tl.to('.intro',{opacity:0,duration:1.4,ease:'power2.in'},end)
  .to('.mosaic',{opacity:.28,duration:1.2},end+.4)
  .set('.hero-txt',{opacity:1},end+.9)
  .from('.kicker',{y:20,opacity:0,duration:.6},end+.9)
  .from('h1 .w',{yPercent:110,opacity:0,rotate:4,duration:.9,stagger:.09,ease:'power4.out'},end+1)
  .from('.sub,.hero .btn',{y:20,opacity:0,duration:.7,stagger:.1},'-=.4')
  .add(()=>{document.querySelector('.hero').classList.add('done');document.querySelector('.intro').style.display='none'});
// mosaic idle breathing
gsap.utils.toArray('.mosaic img').forEach((m,i)=>gsap.to(m,{scale:1.12,yPercent:i%2?6:-6,duration:7+i,repeat:-1,yoyo:true,ease:'sine.inOut'}));
gsap.to('.mosaic',{yPercent:20,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:true}});
// manifesto: no pin on mobile
if(mobile) gsap.from('.manifesto .big span',{opacity:0,y:30,stagger:.25,duration:.8,scrollTrigger:{trigger:'.manifesto',start:'top 70%',once:true}});
else gsap.from('.manifesto .big span',{opacity:.08,y:40,stagger:.4,ease:'none',scrollTrigger:{trigger:'.manifesto',start:'top top',end:'+=120%',pin:true,scrub:true}});
// apps: one-shot reveals (no reverse), parallax on separate wrapper elements
gsap.utils.toArray('.app').forEach((s,i)=>{
  const ic=s.querySelector('.icon'),wrap=s.querySelector('.iconwrap'),c=s.querySelectorAll('.copy > *');
  gsap.fromTo(s.querySelector('.bg'),{yPercent:-8},{yPercent:8,ease:'none',scrollTrigger:{trigger:s,start:'top bottom',end:'bottom top',scrub:true}});
  gsap.timeline({scrollTrigger:{trigger:s,start:'top 75%',once:true}})
   .fromTo(ic,{y:80,rotate:i%2?6:-6,scale:.8,opacity:0},{y:0,rotate:0,scale:1,opacity:1,duration:1.1,ease:'power3.out',clearProps:'transform'})
   .from(c,{y:30,opacity:0,stagger:.1,duration:.7,ease:'power2.out',clearProps:'transform'},'<.25');
  if(!mobile) gsap.to(wrap,{y:-50,ease:'none',scrollTrigger:{trigger:s,start:'center center',end:'bottom top',scrub:true}});
  gsap.to(ic,{rotate:i%2?1.2:-1.2,y:-6,duration:4,repeat:-1,yoyo:true,ease:'sine.inOut',delay:1.2,scrollTrigger:{trigger:s,start:'top 75%',once:true}});
});
gsap.from('.tile',{y:60,opacity:0,scale:.8,stagger:.08,duration:.8,ease:'back.out(1.6)',scrollTrigger:{trigger:'.grid',start:'top 85%',once:true}});
gsap.utils.toArray('.reveal').forEach(e=>gsap.from(e,{y:50,opacity:0,duration:1,ease:'power3.out',scrollTrigger:{trigger:e,start:'top 85%',once:true}}));
})();
