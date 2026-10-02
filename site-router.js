(()=>{
const supported=new Set(['index.html','life.html','pittsburgh.html','lpbf.html']);
let loading=false;
const pageName=url=>url.pathname.split('/').pop()||'index.html';
function focusPage(url){
 const target=url.hash?document.getElementById(decodeURIComponent(url.hash.slice(1))):null;
 if(target){const details=target.closest('details');if(details)details.open=true;target.scrollIntoView();}
 else window.scrollTo(0,0);
 const heading=target||document.querySelector('#site-content h1');
 if(heading){heading.setAttribute('tabindex','-1');heading.focus({preventScroll:true});}
}
async function navigate(url,push){
 if(loading)return;
 loading=true;document.getElementById('site-content').setAttribute('aria-busy','true');
 try{
  const response=await fetch(url.href,{credentials:'same-origin'});
  if(!response.ok)throw new Error('Page unavailable');
  const next=new DOMParser().parseFromString(await response.text(),'text/html');
  const content=next.getElementById('site-content');if(!content)throw new Error('Unsupported page');
  const scripts=Array.from(content.querySelectorAll('script'));scripts.forEach(s=>s.remove());
  document.head.replaceChildren(...Array.from(next.head.childNodes,n=>document.importNode(n,true)));
  const current=document.getElementById('site-content');
  current.classList.add('page-leaving');
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches)await new Promise(resolve=>setTimeout(resolve,160));
  current.replaceChildren(...Array.from(content.childNodes,n=>document.importNode(n,true)));
  if(push)history.pushState(null,'',url.href);
  // Rebind only the new page's galleries. The shared audio element stays mounted.
  scripts.forEach(source=>{const script=document.createElement('script');for(const a of source.attributes)script.setAttribute(a.name,a.value);script.textContent=source.textContent;current.append(script);});
  focusPage(url);
  current.classList.remove('page-leaving');
  window.dispatchEvent(new Event('site-navigated'));
 }catch(error){
  if(push){document.getElementById('music-status').textContent='页面暂时未能打开，请再试一次。';}
  else location.reload();
 }finally{document.getElementById('site-content').classList.remove('page-leaving');loading=false;document.getElementById('site-content').removeAttribute('aria-busy');}
}
document.addEventListener('click',event=>{
 if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
 const link=event.target.closest('a[href]');if(!link||link.hasAttribute('download')||(link.target&&link.target!=='_self'))return;
 const url=new URL(link.href,location.href);
 if(url.origin!==location.origin||!supported.has(pageName(url)))return;
 if(url.pathname===location.pathname&&url.search===location.search)return;
 event.preventDefault();navigate(url,true);
});
window.addEventListener('popstate',()=>navigate(new URL(location.href),false));
})();