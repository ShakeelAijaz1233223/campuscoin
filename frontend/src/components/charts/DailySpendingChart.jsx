import FinancialChart from './FinancialChart';export default function DailySpendingChart(props){return <FinancialChart type="area" series={[{key:'amount',name:'Daily spending'}]} {...props}/>;}
