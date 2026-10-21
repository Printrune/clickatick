import {readFile} from 'node:fs/promises';
export async function GET(){if(process.env.NODE_ENV!=='development')return new Response(null,{status:404});return new Response(await readFile('evidence/avatar-reference.jpg'),{headers:{'Content-Type':'image/jpeg'}});}
