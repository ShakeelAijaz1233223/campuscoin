import {useState} from 'react';
import {Download,Share2} from 'lucide-react';
import {Button} from '../common/UI';
import {exportReport,saveBlob} from '../../services/exportService';
import exportApi from '../../api/exportApi';
import {useApp} from '../../context/AppContext';
export default function ReportExport({filters,formats=['pdf']}) {
 const [busy,setBusy]=useState('');const {notify}=useApp();
 async function run(format){setBusy(format);try{await exportReport(filters,format);notify('Your export is ready.');}catch(e){notify(e.message,'error');}finally{setBusy('');}}
 async function share(){setBusy('share');try{
  const blob=await exportApi.download({...filters,format:'pdf'});
  const file=new File([blob],'campuscoin-report.pdf',{type:'application/pdf'});
  if(navigator.canShare?.({files:[file]})){await navigator.share({files:[file],title:'CampusCoin report'});}
  else {saveBlob(blob,file.name);notify('PDF downloaded. Attach it to an email or message to share securely.');}
 }catch(e){if(e.name!=='AbortError')notify(e.message,'error');}finally{setBusy('');}}
 return <div className="row wrap">{formats.map(format=><Button key={format} variant="secondary" disabled={!!busy} loading={busy===format} onClick={()=>run(format)}><Download size={16}/>{format.toUpperCase()}</Button>)}<Button variant="secondary" disabled={!!busy} loading={busy==='share'} onClick={share}><Share2 size={15}/>Share PDF</Button></div>;
}
