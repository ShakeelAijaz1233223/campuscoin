import{LayoutDashboard,ArrowLeftRight,Wallet,Target,ReceiptText,ChartNoAxesCombined,Sparkles,Lightbulb,Bookmark,Shapes,Repeat,Bell,Settings,UserRound,Shield}from'lucide-react';
export const navigation=[
{label:'Overview',path:'/dashboard',icon:LayoutDashboard,group:'MAIN'},
{label:'Transactions',path:'/transactions',icon:ArrowLeftRight},
{label:'Budget',path:'/budgets',icon:Wallet},
{label:'Savings goals',path:'/goals',icon:Target},
{label:'Bills & payments',path:'/bills',icon:ReceiptText},
{label:'Reports',path:'/reports',icon:ChartNoAxesCombined},
{label:'AI Insights',path:'/insights',icon:Sparkles,group:'YOUR ADVANTAGE',badge:'AI'},
{label:'Saving tips',path:'/saving-tips',icon:Lightbulb},
{label:'Saved & notes',path:'/saved',icon:Bookmark},
{label:'Categories',path:'/categories',icon:Shapes,group:'ORGANIZER'},
{label:'Recurring',path:'/recurring-transactions',icon:Repeat},
{label:'Notifications',path:'/notifications',icon:Bell},
{label:'Profile',path:'/profile',icon:UserRound},
{label:'Settings',path:'/settings',icon:Settings}];
export const adminNavigation=[{label:'Admin overview',path:'/admin',icon:Shield,group:'ADMINISTRATION'},{label:'Users',path:'/admin/users',icon:UserRound},{label:'Default categories',path:'/admin/categories',icon:Shapes},{label:'Announcements',path:'/admin/announcements',icon:Bell},{label:'System tips',path:'/admin/tips',icon:Lightbulb},{label:'Usage statistics',path:'/admin/statistics',icon:ChartNoAxesCombined}];
