// Match immutable, server-verified auth IDs, never editable profile metadata.
export function isSiteAdmin(user:{id:string}|null,configuredIds:string|undefined){return !!user&&!!configuredIds?.split(',').map(s=>s.trim()).filter(Boolean).includes(user.id);}
