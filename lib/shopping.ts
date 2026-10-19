import type {Product,Store} from './types';
import {available,firstPrice} from './commerce';
import {matchesProduct} from './search';
export type ShoppingFilters={selected:string;category:string;query:string;offers:boolean;view:string;sort:string;favourites:string[];bought:string[]};
export function shoppingProducts(products:Product[],f:ShoppingFilters,stores:Store[]){
 return products.filter(p=>(!f.selected||p.store_id===f.selected)&&(f.category==='all'||p.category===f.category)&&matchesProduct(p,f.query,stores.find(s=>s.id===p.store_id)?.name||'')&&(!f.offers||firstPrice(p)<p.price)&&(f.view!=='favourites'||f.favourites.includes(p.id))&&(f.view!=='bought'||f.bought.includes(p.id))).sort((a,b)=>f.sort==='price-low'?firstPrice(a)-firstPrice(b):f.sort==='price-high'?firstPrice(b)-firstPrice(a):f.sort==='name'?a.name.localeCompare(b.name):Number(available(b)>0)-Number(available(a)>0));
}
