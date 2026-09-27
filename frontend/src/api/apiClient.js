import {payload,filters,collection,single} from './contract.js';
const BASE = (import.meta.env?.VITE_API_BASE_URL || '/api/v1').replace(/\/$/, '');
export class ApiError extends Error { constructor(message,status,details){super(message);this.name='ApiError';this.status=status;this.details=details;} }
export function queryString(params={}) {const q=new URLSearchParams();Object.entries(params).forEach(([k,v])=>{if(v!==undefined&&v!==null&&v!=='')q.set(k,String(v));});return q.size?'?'+q.toString():'';}
export async function request(path,{method='GET',body,signal,blob=false,...rest}={}) {
 const controller=new AbortController(); const timer=setTimeout(()=>controller.abort(),25000);
 const abort=()=>controller.abort(); signal?.addEventListener('abort',abort,{once:true}); if(signal?.aborted)controller.abort();
 try { const form=body instanceof FormData;
 const response=await fetch(BASE+path,{...rest,method,credentials:'include',signal:controller.signal,headers:{'X-Requested-With':'CampusCoin',Accept:blob?'application/octet-stream':'application/json',...(!form&&body?{'Content-Type':'application/json'}:{}),...rest.headers},body:body?(form?body:JSON.stringify(body)):undefined});
 const type=response.headers.get('content-type')||'';
 if(!response.ok){const data=type.includes('json')?await response.json().catch(()=>({})):{};if(response.status===401&&!path.startsWith('/auth/'))window.dispatchEvent(new Event('session-expired'));throw new ApiError((data.errors?.length?data.errors.map(e=>e.message||e.msg).filter(Boolean).join(' '):'')||data.message||({401:'Your session has expired. Please sign in again.',403:'You do not have permission for this action.',404:'This API endpoint is not available.',429:'Too many requests. Please try again shortly.'}[response.status])||'The service is unavailable. Check your backend connection and try again.',response.status,data.errors);}
 if(!['GET','HEAD'].includes(method)&&!path.startsWith('/auth/'))window.dispatchEvent(new Event('data-changed'));
 if(blob)return response.blob(); if(response.status===204)return null;
 if(!type.includes('json'))throw new ApiError('The API returned an unexpected response. Connect a compatible CampusCoin backend.',502);
 const data=await response.json();const result=data.data!==undefined?data.data:data;return data.meta?.pagination&&result&&typeof result==='object'?{...result,pagination:data.meta.pagination}:result;
 }catch(error){if(error instanceof ApiError)throw error;if(error.name==='AbortError')throw new ApiError(signal?.aborted?'Request cancelled.':'The request timed out. Please try again.',408);throw new ApiError('Cannot reach CampusCoin. Check your connection and backend configuration.',0);}finally{clearTimeout(timer);signal?.removeEventListener('abort',abort);}
}
export function resourceApi(path){return {
 list:async(params={},signal)=>collection(path,await request(path+queryString(filters(params)),{signal}),params),
 get:async id=>single(path,await request(path+'/'+encodeURIComponent(id))),
 create:async body=>single(path,await request(path,{method:'POST',body:payload(path,body)})),
 update:async(id,body)=>single(path,await request(path+'/'+encodeURIComponent(id),{method:path.startsWith('/admin/')?'PUT':'PATCH',body:payload(path,body)})),
 remove:id=>request(path+'/'+encodeURIComponent(id),{method:'DELETE'})
};}
