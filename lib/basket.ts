import type {Product} from './types';
import {available} from './commerce';
export type BasketLine={productId:string;quantity:number};
// Preserve unrelated existing lines and cap additions against current nearby stock.
export function mergeBasket(current:BasketLine[], additions:BasketLine[], products:Product[]):BasketLine[]{
 const result=new Map(current.map(c=>[c.productId,c.quantity]));
 for(const line of additions){
  const product=products.find(p=>p.id===line.productId);
  if(!product||!Number.isInteger(line.quantity)||line.quantity<=0)continue;
  const quantity=Math.min((result.get(line.productId)||0)+line.quantity,available(product),99);
  if(quantity>0)result.set(line.productId,quantity);
 }
 return Array.from(result,([productId,quantity])=>({productId,quantity}));
}
