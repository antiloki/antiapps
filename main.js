(function(){
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
if(reduce||!window.gsap||!window.ScrollTrigger)return;
gsap.registerPlugin(ScrollTrigger);
const touch=matchMedia('(pointer: coarse)').matches, mobile=innerWidth<860;
if(window.Lenis&&!touch){const l=new Lenis({lerp:.1});l.on('scroll',ScrollTrigger.update);gsap.ticker.add(t=>l.raf(t*1000));gsap.ticker.lagSmoothing(0);}
ScrollTrigger.config({ignoreMobileResize:true});
gsap.to('.progress',{scaleX:1,ease:'none',scrollTrigger:{start:0,end:'max',scrub:true}});
// v1 hero
const tl=gsap.timeline();
tl.from('.mosaic img',{yPercent:()=>gsap.utils.random(-60,60),opacity:0,scale:1.3,duration:1.4,stagger:.08,ease:'power3.out'})
  .from('.kicker',{y:20,opacity:0,duration:.6},'-=1')
  .from('h1 .w',{yPercent:110,opacity:0,rotate:4,duration:.9,stagger:.09,ease:'power4.out'},'-=.8')
  .from('.sub,.hero .btn',{y:20,opacity:0,duration:.7,stagger:.1},'-=.5');
gsap.to('.mosaic',{yPercent:25,scale:1.15,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:true}});
gsap.to('.hero-txt',{yPercent:-30,opacity:0,ease:'none',scrollTrigger:{trigger:'.hero',start:'center center',end:'bottom top',scrub:true}});
if(mobile) gsap.from('.manifesto .big span',{opacity:0,y:30,stagger:.25,duration:.8,scrollTrigger:{trigger:'.manifesto',start:'top 70%',once:true}});
else gsap.from('.manifesto .big span',{opacity:.08,y:40,stagger:.4,ease:'none',scrollTrigger:{trigger:'.manifesto',start:'top top',end:'+=120%',pin:true,scrub:true}});
gsap.utils.toArray('.app').forEach((s,i)=>{
  const ic=s.querySelector('.icon'),wrap=s.querySelector('.iconwrap'),c=s.querySelectorAll('.copy > *');
  gsap.fromTo(s.querySelector('.bg'),{yPercent:-8},{yPercent:8,ease:'none',scrollTrigger:{trigger:s,start:'top bottom',end:'bottom top',scrub:true}});
  gsap.timeline({scrollTrigger:{trigger:s,start:'top 75%',once:true}})
   .fromTo(ic,{y:80,rotate:i%2?6:-6,scale:.8,opacity:0},{y:0,rotate:0,scale:1,opacity:1,duration:1.1,ease:'power3.out',clearProps:'transform'})
   .from(c,{y:30,opacity:0,stagger:.08,duration:.7,ease:'power2.out',clearProps:'transform'},'<.25');
  if(!mobile) gsap.fromTo(wrap,{y:0},{y:-50,ease:'none',scrollTrigger:{trigger:s,start:'center center',end:'bottom top',scrub:true}});
});
gsap.from('.tile',{y:60,opacity:0,scale:.8,stagger:.08,duration:.8,ease:'back.out(1.6)',scrollTrigger:{trigger:'.grid',start:'top 85%',once:true}});
gsap.utils.toArray('.reveal').forEach(e=>gsap.from(e,{y:50,opacity:0,duration:1,ease:'power3.out',scrollTrigger:{trigger:e,start:'top 85%',once:true}}));
})();
