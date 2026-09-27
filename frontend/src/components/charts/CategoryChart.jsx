import FinancialChart from './FinancialChart';export default function CategoryChart(props){return <FinancialChart type="pie" series={[{key:'amount',name:'Amount'}]} {...props}/>;}
