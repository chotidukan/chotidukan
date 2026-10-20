import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import vm from 'node:vm';
const luminance=hex=>{const rgb=hex.replace('#','').match(/../g).map(s=>parseInt(s,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return .2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2];};
const ratio=(a,b)=>{const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
for(const [name,fg,bg,min] of [['primary button','#FFFFFF','#173D32',4.5],['body','#242A27','#FAF7F0',4.5],['secondary text','#526358','#FAF7F0',4.5],['selected text','#173D32','#E7EEE6',4.5],['accent text','#242A27','#D97726',4.5],['control boundary','#78877D','#FFFFFF',3],['error','#A52A27','#FFF2F0',4.5]]){const score=ratio(fg,bg);assert.ok(score>=min,name);console.log(`${name}: ${score.toFixed(2)}:1 — pass`);}
assert.ok(ratio('#FFFFFF','#D97726')<4.5,'White on saffron must not be used for normal text');
const html=readFileSync('design/design-preview.html','utf8');
const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
assert.equal(scripts.length,1);new vm.Script(scripts[0][1]);
for(const file of ['app/globals.css','app/neighbourhood.css','app/customer-theme.css','public/product-atlas.png','public/product-atlas-2.png'])assert.ok(existsSync(file),file);
console.log('Design gallery JavaScript syntax and local stylesheet/image paths: pass');
