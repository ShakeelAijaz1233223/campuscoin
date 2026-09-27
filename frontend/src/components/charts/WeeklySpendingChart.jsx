import FinancialChart from './FinancialChart';export default function WeeklySpendingChart(props){return <FinancialChart type="bar" series={[{key:'amount',name:'Weekly spending'}]} {...props}/>;}
