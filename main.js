(function(){
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
if(reduce||!window.gsap||!window.ScrollTrigger)return;
gsap.registerPlugin(ScrollTrigger);
if(window.Lenis){const l=new Lenis({lerp:.1});l.on('scroll',ScrollTrigger.update);gsap.ticker.add(t=>l.raf(t*1000));gsap.ticker.lagSmoothing(0);}
gsap.to('.progress',{scaleX:1,ease:'none',scrollTrigger:{start:0,end:'max',scrub:true}});
// hero intro
const tl=gsap.timeline();
tl.from('.mosaic img',{yPercent:()=>gsap.utils.random(-60,60),opacity:0,scale:1.3,duration:1.4,stagger:.08,ease:'power3.out'})
  .from('.kicker',{y:20,opacity:0,duration:.6},'-=1')
  .from('h1 .w',{yPercent:110,opacity:0,rotate:4,duration:.9,stagger:.09,ease:'power4.out'},'-=.8')
  .from('.sub,.hero .btn',{y:20,opacity:0,duration:.7,stagger:.1},'-=.5');
gsap.to('.mosaic',{yPercent:25,scale:1.15,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:true}});
gsap.to('.hero-txt',{yPercent:-30,opacity:0,ease:'none',scrollTrigger:{trigger:'.hero',start:'center center',end:'bottom top',scrub:true}});
// manifesto: pinned line-by-line
gsap.from('.manifesto .big span',{opacity:.08,y:40,stagger:.4,ease:'none',scrollTrigger:{trigger:'.manifesto',start:'top top',end:'+=120%',pin:true,scrub:true}});
// apps
gsap.utils.toArray('.app').forEach((s,i)=>{
  const bg=s.querySelector('.bg'),ic=s.querySelector('.icon'),c=s.querySelectorAll('.copy > *');
  gsap.fromTo(bg,{yPercent:-10,scale:1.15},{yPercent:10,scale:1,ease:'none',scrollTrigger:{trigger:s,start:'top bottom',end:'bottom top',scrub:true}});
  const t=gsap.timeline({scrollTrigger:{trigger:s,start:'top 70%',end:'top 10%',scrub:1}});
  t.fromTo(ic,{y:120,rotate:i%2?8:-8,scale:.7,opacity:0,clipPath:'inset(100% 0 0 0 round 28px)'},{y:0,rotate:0,scale:1,opacity:1,clipPath:'inset(0% 0 0 0 round 28px)',ease:'power2.out'})
   .from(c,{x:i%2?-60:60,opacity:0,stagger:.12,ease:'power2.out'},'<.15');
  gsap.to(ic,{y:-60,ease:'none',scrollTrigger:{trigger:s,start:'center center',end:'bottom top',scrub:true}});
});
gsap.from('.tile',{y:60,opacity:0,scale:.8,stagger:.08,duration:.8,ease:'back.out(1.6)',scrollTrigger:{trigger:'.grid',start:'top 85%'}});
gsap.utils.toArray('.reveal').forEach(e=>gsap.from(e,{y:50,opacity:0,duration:1,ease:'power3.out',scrollTrigger:{trigger:e,start:'top 85%'}}));
})();
