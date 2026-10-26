
export const BASE_URL = new URL('../', import.meta.url);
export async function loadJsonData(p){
  const tried=[];
  const urls=[new URL('../'+p.replace(/^\.\//,''), import.meta.url).toString(), new URL('../../'+p.replace(/^\.\//,''), import.meta.url).toString(), p, './'+p.replace(/^\.\//,'')];
  for(const x of urls){
    if(tried.includes(x)) continue;
    tried.push(x);
    try{ const r=await fetch(x,{cache:'no-store'}); if(r.ok) return await r.json(); }catch(e){}
  }
  throw new Error('Failed to load '+p+' via '+tried.join(', '));
}
