import{useEffect,useState}from'react';import{Plus}from'lucide-react';
import useAuth from '../hooks/useAuth';
import useDashboard from '../hooks/useDashboard';
import reportApi from '../api/reportApi';
import{Card,Button,Loading,ErrorState,Modal,Input} from '../components/common/UI';
import PageContainer from '../components/layout/PageContainer';
import HeroCard from '../components/dashboard/HeroCard';
import{IncomeCard,ExpenseCard,SavingsCard} from '../components/dashboard/SummaryCards';
import SpendingRhythm from '../components/dashboard/SpendingRhythm';
import InsightCard from '../components/dashboard/InsightCard';
import RecentTransactions from '../components/dashboard/RecentTransactions';
import BudgetCheckIn from '../components/dashboard/BudgetCheckIn';
import TopCategories from '../components/dashboard/TopCategories';
import MonthlyOverview from '../components/dashboard/MonthlyOverview';
import BudgetVsActual from '../components/dashboard/BudgetVsActual';
import SavingTipsWidget from '../components/dashboard/SavingTipsWidget';
import BudgetAlerts from '../components/dashboard/BudgetAlerts';
import TransactionForm from '../components/transactions/TransactionForm';
import transactionApi from '../api/transactionApi';
import{today} from '../utils/formatDate';
import{useApp} from '../context/AppContext';

const MONTHS=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const monthLabel=m=>{const[y,mm]=m.split('-').map(Number);return `${MONTHS[mm-1]} ${y}`;};
function buildYearMonths(report,year){
 const byMonth={};
 (report?.incomeExpense||[]).forEach(r=>{const k=Number(String(r.name).slice(5,7));if(k>=1&&k<=12)byMonth[k]={income:Number(r.income)||0,expense:Number(r.expense)||0};});
 return Array.from({length:12},(_,i)=>({label:MONTHS[i],income:byMonth[i+1]?.income||0,expense:byMonth[i+1]?.expense||0}));
}
export default function Dashboard(){
 const{user}=useAuth();const{notify}=useApp();
 const[month,setMonth]=useState(today().slice(0,7)),[add,setAdd]=useState(false);
 const year=Number(month.slice(0,4)),monthNum=Number(month.slice(5,7));
 const{data:d,loading,error,refresh}=useDashboard({month});
 const[yearReport,setYearReport]=useState(null);
 useEffect(()=>{const c=new AbortController();setYearReport(null);reportApi.list({from:`${year}-01-01`,to:`${year}-12-31`},c.signal).then(setYearReport).catch(()=>{});return()=>c.abort();},[year]);
 const currency=d?.currency||user?.currency||'PKR';
 const daily=d?.daily||[];
 return <PageContainer>
  {loading?<Card><Loading/></Card>
  :error?<Card><ErrorState error={error} onRetry={refresh}/></Card>
  :d&&<div className="stagger">
   <div className="dashboard-top">
    <HeroCard name={user?.name} balance={d.balance} currency={currency} monthLabel={monthLabel(month)} goals={d.activeGoals} status={d.budgetSummary&&d.budgetSummary.total_budget>0?`${Math.round(d.budgetSummary.percentage)}% of budget used`:(d.savings_rate!==undefined?`Savings rate ${Math.round(d.savings_rate)}%`:null)}/>
    <div className="rail">
     <div className="rail-tools">
      <Input label={`Overview month · ${monthLabel(month)}`} type="month" value={month} onChange={e=>setMonth(e.target.value)} aria-label="Overview month"/>
      <Button onClick={()=>setAdd(true)}><Plus size={17}/>Add transaction</Button>
     </div>
     <div className="rail-cards">
      <IncomeCard value={d.income} currency={currency} daily={daily}/>
      <ExpenseCard value={d.expense} currency={currency} daily={daily}/>
      <SavingsCard value={d.savings} currency={currency} daily={daily}/>
     </div>
    </div>
   </div>
   <div className="dashboard-grid">
    <SpendingRhythm className="span-eight" months={yearReport?buildYearMonths(yearReport,year):[]} currency={currency} badge={String(year)}/>
    <InsightCard insight={d.insight} month={monthNum} year={year}/>
    <RecentTransactions items={d.recentTransactions} currency={currency} onAdd={()=>setAdd(true)}/>
    <BudgetCheckIn summary={d.budgetSummary} budgets={d.budgets} currency={currency}/>
    {d.alerts?.length>0&&<BudgetAlerts alerts={d.alerts}/>}
   </div>
   <div className="lower-grid">
    <TopCategories data={d.categories} currency={currency}/>
    <MonthlyOverview data={d.monthlyOverview} currency={currency}/>
    <BudgetVsActual data={d.budgetActual} currency={currency}/>
    <SavingTipsWidget tips={d.tips}/>
   </div>
  </div>}
  <Modal open={add} title="A new transaction" onClose={()=>setAdd(false)}>
   <TransactionForm onCancel={()=>setAdd(false)} onSubmit={async values=>{await transactionApi.create(values);setAdd(false);notify('Transaction added.');refresh();}}/>
  </Modal>
 </PageContainer>;}
