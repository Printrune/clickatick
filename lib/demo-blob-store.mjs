import {DemoError,readDemoJson} from './demo-http.mjs';
export function demoStorageConfigured(env=process.env){return Boolean(env.BLOB_READ_WRITE_TOKEN?.trim()||env.BLOB_STORE_ID?.trim());}
export function createDemoBlobStore({loadSDK=()=>import('@vercel/blob')}={}){
 return {
  async read(path,limit){
   try{const sdk=await loadSDK(),result=await sdk.get(path,{access:'private',useCache:false,abortSignal:AbortSignal.timeout(20000)});if(!result)return null;if(result.statusCode!==200||!result.stream||result.blob.size>limit)throw new Error('Invalid stored demo');return await readDemoJson(result.stream,limit);}
   catch{throw new DemoError('Demo storage is unavailable. Your draft and selections are kept.',503);}
  },
  async create(path,record,limit){
   const body=JSON.stringify(record);if(Buffer.byteLength(body)>limit)throw new DemoError('These demo details are too large.',413);
   try{const sdk=await loadSDK();await sdk.put(path,body,{access:'private',addRandomSuffix:false,allowOverwrite:false,contentType:'application/json',cacheControlMaxAge:60,abortSignal:AbortSignal.timeout(20000)});return {record,created:true};}
   catch{const existing=await this.read(path,limit);if(existing)return {record:existing,created:false};throw new DemoError('Demo storage is unavailable. Your draft and selections are kept.',503);}
  }
 };
}
