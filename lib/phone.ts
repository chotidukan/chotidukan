export function phoneNumber(value:string){const raw=value.replace(/[\s()-]/g,'');const phone=/^[6-9]\d{9}$/.test(raw)?'+91'+raw:raw;return /^\+[1-9]\d{7,14}$/.test(phone)?phone:null;}
