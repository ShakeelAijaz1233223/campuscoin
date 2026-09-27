import exportApi from '../api/exportApi';
export function saveBlob(blob,name){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);}
export async function exportReport(params,format){const blob=await exportApi.download({...params,format});saveBlob(blob,`campuscoin-report.${format==='image'?'png':format}`);}
