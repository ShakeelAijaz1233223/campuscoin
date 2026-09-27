const BASE = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/$/, '');
export class ApiError extends Error { constructor(message,status,details){super(message);this.name='ApiError';this.status=status;this.details=details;} }
export function queryString(params={}) {const q=new URLSearchParams();Object.entries(params).forEach(([k,v])=>{if(v!==undefined&&v!==null&&v!=='')q.set(k,String(v));});return q.size?'?'+q.toString():'';}
export async function request(path,{method='GET',body,signal,blob=false,...rest}={}) {
 const controller=new AbortController(); const timer=setTimeout(()=>controller.abort(),25000);
 const abort=()=>controller.abort(); signal?.addEventListener('abort',abort,{once:true}); if(signal?.aborted)controller.abort();
 try { const form=body instanceof FormData;const csrf=document.cookie.split('; ').find(x=>x.startsWith('XSRF-TOKEN='))?.split('=')[1];
 const response=await fetch(BASE+path,{...rest,method,credentials:'include',signal:controller.signal,headers:{Accept:blob?'application/octet-stream':'application/json',...(!form&&body?{'Content-Type':'application/json'}:{}),...(csrf?{'X-XSRF-TOKEN':decodeURIComponent(csrf)}:{}),...rest.headers},body:body?(form?body:JSON.stringify(body)):undefined});
 const type=response.headers.get('content-type')||'';
 if(!response.ok){const data=type.includes('json')?await response.json().catch(()=>({})):{};if(response.status===401&&!path.startsWith('/auth/'))window.dispatchEvent(new Event('session-expired'));throw new ApiError(data.message||({401:'Your session has expired. Please sign in again.',403:'You do not have permission for this action.',404:'This API endpoint is not available.',429:'Too many requests. Please try again shortly.'}[response.status])||'The service is unavailable. Check your backend connection and try again.',response.status,data.errors);}
 if(blob)return response.blob(); if(response.status===204)return null;
 if(!type.includes('json'))throw new ApiError('The API returned an unexpected response. Connect a compatible CampusCoin backend.',502);
 const data=await response.json();return data.data!==undefined?data.data:data;
 }catch(error){if(error instanceof ApiError)throw error;if(error.name==='AbortError')throw new ApiError(signal?.aborted?'Request cancelled.':'The request timed out. Please try again.',408);throw new ApiError('Cannot reach CampusCoin. Check your connection and backend configuration.',0);}finally{clearTimeout(timer);signal?.removeEventListener('abort',abort);}
}
export function resourceApi(path){return {list:(params,signal)=>request(path+queryString(params),{signal}),get:(id)=>request(path+'/'+encodeURIComponent(id)),create:(body)=>request(path,{method:'POST',body}),update:(id,body)=>request(path+'/'+encodeURIComponent(id),{method:'PATCH',body}),remove:(id)=>request(path+'/'+encodeURIComponent(id),{method:'DELETE'})};}
