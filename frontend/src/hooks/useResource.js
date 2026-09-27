import {useCallback,useEffect,useRef,useState} from 'react';
export default function useResource(api,params={}) {
 const key=JSON.stringify(params);const [data,setData]=useState(null),[loading,setLoading]=useState(true),[error,setError]=useState(null),[version,setVersion]=useState(0);const current=useRef(api); current.current=api;
 useEffect(()=>{const c=new AbortController();setLoading(true);setError(null);current.current.list(JSON.parse(key),c.signal).then(d=>{if(!c.signal.aborted)setData(d);}).catch(e=>{if(!c.signal.aborted)setError(e);}).finally(()=>{if(!c.signal.aborted)setLoading(false);});return ()=>c.abort();},[key,version,api]);
 const refresh=useCallback(()=>setVersion(v=>v+1),[]);
 return {data,loading,error,refresh,items:Array.isArray(data)?data:data?.items||[]};
}
