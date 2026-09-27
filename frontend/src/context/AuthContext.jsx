import {createContext,useEffect,useState} from 'react';
import authApi from '../api/authApi';
export const AuthContext=createContext(null);
export function AuthProvider({children}){
 const [user,setUser]=useState(null),[loading,setLoading]=useState(true),[error,setError]=useState(null),[expired,setExpired]=useState(false);
 const check=async()=>{setLoading(true);setError(null);try{const d=await authApi.me();setUser(d.user||d);}catch(e){setUser(null);if(e.status!==401)setError(e);}finally{setLoading(false);}};
 useEffect(()=>{check();const expire=()=>{setUser(null);setExpired(true);};window.addEventListener('session-expired',expire);return()=>window.removeEventListener('session-expired',expire);},[]);
 const login=async(values)=>{const d=await authApi.login(values);if(!d.user)throw new Error('The login response must include a user.');setUser(d.user);setExpired(false);return d.user;};
 const logout=async()=>{await authApi.logout();setUser(null);};
 return <AuthContext.Provider value={{user,setUser,loading,error,expired,login,logout,check}}>{children}</AuthContext.Provider>;
}
