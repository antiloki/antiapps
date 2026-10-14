(function(){
if(matchMedia('(prefers-reduced-motion: reduce)').matches||!window.gsap)return;
gsap.registerPlugin(ScrollTrigger);ScrollTrigger.config({ignoreMobileResize:true});
gsap.from('.hero .eyebrow,.hero h1,.hero .lede,.hero .btns,.hero .note',{y:30,opacity:0,duration:.9,stagger:.1,ease:'power3.out',clearProps:'transform'});
gsap.fromTo('.hero .art',{scale:1.12},{scale:1,duration:1.8,ease:'power2.out'});
gsap.to('.hero .art',{yPercent:12,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:true}});
gsap.utils.toArray('.rv').forEach(e=>gsap.from(e,{y:40,opacity:0,duration:.8,ease:'power3.out',clearProps:'transform',scrollTrigger:{trigger:e,start:'top 88%',once:true}}));
gsap.utils.toArray('.steps,.status').forEach(g=>gsap.from(g.children,{y:40,opacity:0,stagger:.1,duration:.7,ease:'power2.out',clearProps:'transform',scrollTrigger:{trigger:g,start:'top 85%',once:true}}));
gsap.from('.statement .w',{yPercent:100,opacity:0,stagger:.08,duration:.8,ease:'power4.out',scrollTrigger:{trigger:'.statement',start:'top 75%',once:true}});
})();
