import {createHash} from 'node:crypto';
import {readFile,readdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {createInterface} from 'node:readline';
import {Pool} from '@neondatabase/serverless';

const directory=fileURLToPath(new URL('./migrations/',import.meta.url));
const mode=process.argv[2]??'inspect';
if(!['inspect','apply'].includes(mode))throw new Error('Use inspect or apply.');
const lines=createInterface({input:process.stdin,crlfDelay:Infinity});
const iterator=lines[Symbol.asyncIterator]();
const first=await iterator.next();
lines.close();
if(first.done||!first.value)throw new Error('A database URL is required on standard input.');
const url=first.value.trim();
const parsed=new URL(url);
if(!['postgres:','postgresql:'].includes(parsed.protocol))throw new Error('A PostgreSQL URL is required.');
const pool=new Pool({connectionString:url,max:1});
let client;
try{
 client=await pool.connect();
 const tables=(await client.query("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname='public' ORDER BY tablename")).rows.map(row=>row.tablename);
 const hasLedger=tables.includes('clickatick_schema_migrations');
 if(!hasLedger&&tables.length)throw new Error(`Public schema already has ${tables.length} tables without a migration ledger; inspect it manually.`);
 const files=(await readdir(directory)).filter(name=>/^\d{3}_.*\.sql$/.test(name)).sort();
 if(files.length!==9||!files[7].startsWith('008_integrated_promotions_referrals')||!files[8].startsWith('009_event_planner'))throw new Error('Expected nine versioned migrations.');
 if(mode==='inspect'){
  const applied=hasLedger?(await client.query('SELECT filename,sha256 FROM clickatick_schema_migrations ORDER BY filename')).rows:[];
  process.stdout.write(JSON.stringify({mode,tables:tables.length,applied:applied.map(row=>row.filename),pending:files.filter(name=>!applied.some(row=>row.filename===name))})+'\n');
 }else{
  await client.query('SELECT pg_advisory_lock(650149019)');
  try{
   await client.query('CREATE TABLE IF NOT EXISTS clickatick_schema_migrations (filename text PRIMARY KEY, sha256 char(64) NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())');
   const applied=new Map((await client.query('SELECT filename,sha256 FROM clickatick_schema_migrations')).rows.map(row=>[row.filename,row.sha256]));
   for(const name of files){
    const sql=await readFile(new URL(`./migrations/${name}`,import.meta.url),'utf8');
    const hash=createHash('sha256').update(sql).digest('hex');
    if(applied.has(name)){
     if(applied.get(name)!==hash)throw new Error(`Migration ${name} changed after application.`);
     process.stdout.write(`verified ${name}\n`);
     continue;
    }
    await client.query('BEGIN');
    try{
     await client.query(sql);
     await client.query('INSERT INTO clickatick_schema_migrations(filename,sha256) VALUES($1,$2)',[name,hash]);
     await client.query('COMMIT');
     process.stdout.write(`applied ${name}\n`);
    }catch(error){
     await client.query('ROLLBACK');
     throw new Error(`Migration ${name} failed (${error.code??'database error'}).`);
    }
   }
   const count=(await client.query('SELECT count(*)::int AS count FROM clickatick_schema_migrations')).rows[0].count;
   process.stdout.write(JSON.stringify({mode,appliedCount:count})+'\n');
  }finally{await client.query('SELECT pg_advisory_unlock(650149019)')}
 }
}catch(error){
 process.stderr.write(`${error.message}\n`);
 process.exitCode=1;
}finally{
 client?.release();
 await pool.end();
}
