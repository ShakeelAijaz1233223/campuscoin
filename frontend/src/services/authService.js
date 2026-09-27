import authApi from '../api/authApi';
export const authService={signIn:credentials=>authApi.login(credentials),signOut:()=>authApi.logout(),restoreSession:()=>authApi.me(),register:values=>authApi.register(values),requestReset:email=>authApi.forgot({email}),resetPassword:(token,password)=>authApi.reset(token,{password})};export default authService;
