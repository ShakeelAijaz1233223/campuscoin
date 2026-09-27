import Papa from 'papaparse';
import {request} from './apiClient';
export const importApi={
 validate:async({rows,aiSuggestions,accountId})=>{
  const csv=Papa.unparse(rows.map(({suggestion,...row})=>({...row,category_id:row.categoryId||''})));
  const form=new FormData();form.append('file',new Blob([csv],{type:'text/csv'}),'transactions.csv');form.append('account_id',String(accountId));form.append('use_ai',String(aiSuggestions));
  const d=await request('/imports/upload',{method:'POST',body:form});
  const detail=await request('/imports/'+d.import_id);
  return {validationId:d.import_id,rows:detail.rows.map(r=>{const raw=typeof r.raw_data==='string'?JSON.parse(r.raw_data):r.raw_data;return {...raw,categoryId:raw.category_id||'',...(r.suggested_category_id&&!raw.category_id?{suggestion:{categoryId:r.suggested_category_id,categoryName:'Category '+r.suggested_category_id,confidence:r.ai_confidence}}:{})};}),
   duplicates:detail.rows.filter(r=>r.status==='duplicate'),errors:d.errors.map(e=>({row:e.row_number,message:e.error}))};
 },
 confirm:async({validationId,skipDuplicates})=>{
  const d=await request(`/imports/${encodeURIComponent(validationId)}/confirm`,{method:'POST',body:{include_duplicates:!skipDuplicates,skip_duplicates:skipDuplicates}});
  return {...d,id:validationId,status:'completed',progress:100,processed:d.total_rows??d.imported,skipped:(d.duplicates_skipped||0)+(d.failed||0)};
 },
 status:async id=>{const d=await request('/imports/'+encodeURIComponent(id));return {id,status:d.import.status,imported:d.import.successful_rows,processed:d.import.total_rows,progress:d.import.status==='completed'?100:0};}
};
export default importApi;
