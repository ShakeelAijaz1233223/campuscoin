import reportApi from '../api/reportApi';
export const reportService={fetch:(filters,signal)=>reportApi.list(filters,signal),describePeriod:filters=>filters.period==='six-month'?'Six-month overview':`Monthly report · ${filters.from} to ${filters.to}`};export default reportService;
