import type { Product } from './domain.ts';
const groups=[['atta','ata','aata','flour','आटा'],['milk','doodh','dudh','दूध'],['rice','chawal','chaawal','चावल'],['dal','daal','lentil','lentils','दाल'],['potato','potatoes','aloo','alu','आलू'],['tomato','tomatoes','tamatar','टमाटर'],['tea','chai','चाय'],['oil','tel','तेल'],['banana','bananas','kela','केला'],['paneer','panir','पनीर'],['biscuit','biscuits','cookies','cookie'],['bread','ब्रेड']];
export const normalizeSearch=(value:string)=>value.normalize('NFKC').toLocaleLowerCase().replace(/[^\p{L}\p{M}\p{N}\s]/gu,' ').replace(/\s+/g,' ').trim();
const canonical=new Map(groups.flatMap(group=>group.map(word=>[word,group[0]] as [string,string])));
const tokens=(s:string)=>normalizeSearch(s).split(' ').filter(Boolean).map(w=>canonical.get(w)||w);
export function matchesProduct(p:Product,query:string,storeName='') {
  const q=normalizeSearch(query);if(!q)return true;
  if(normalizeSearch(storeName).includes(q))return true;
  const words=tokens([p.name,...(p.aliases||[])].join(' '));
  return tokens(q).every(term=>words.some(word=>word===term||(!canonical.has(term)&&term.length>=3&&word.startsWith(term))));
}
