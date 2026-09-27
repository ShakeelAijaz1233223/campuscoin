import test from 'node:test';
import assert from 'node:assert/strict';
import {payload,filters,collection,single,person} from '../src/api/contract.js';
test('registration maps names, allowance and academic year',()=>{
 assert.deepEqual(payload('/auth/register',{name:'Amina Khan',academicYear:'postgraduate',monthlyAllowance:5000}),{first_name:'Amina',last_name:'Khan',academic_year:'graduate',monthly_allowance:5000});
 assert.equal(person({id:3,email:'x@y.test',profile:{id:8,first_name:'Amina',last_name:'Khan',academic_year:'graduate'}}).id,3);
});
test('resource bodies map all financial fields',()=>{
 assert.deepEqual(payload('/budgets',{month:'2026-09',categoryId:2,amount:500}),{month:9,year:2026,category_id:2,amount:500});
 assert.deepEqual(payload('/goals',{targetAmount:100,savedAmount:10,notes:'Laptop'}),{target_amount:100,current_amount:10,description:'Laptop'});
 assert.deepEqual(payload('/bills',{status:'paid',dueDate:'2026-10-01',reminderDays:0}),{is_paid:true,due_date:'2026-10-01',reminder_days:0});
 assert.deepEqual(payload('/recurring-transactions',{enabled:false,startDate:'2026-10-01'}),{is_active:false,start_date:'2026-10-01'});
 assert.deepEqual(payload('/admin/tips',{published:false,body:'Advice'}),{status:'inactive',content:'Advice'});
});
test('pagination metadata and numeric SQL values reach the UI',()=>{
 const c=collection('/transactions',{transactions:[{id:1,category_id:4,category_name:'Food',amount:'12.50'}],pagination:{totalItems:47}},{page:2,limit:20});
 assert.equal(c.total,47);assert.deepEqual(c.items[0].category,{id:4,name:'Food'});
 assert.equal(single('/bills',{bill:{is_paid:1}}).status,'paid');
 assert.equal(single('/recurring-transactions',{recurring_transaction:{is_active:0}}).enabled,false);
});
test('filters retain server names, direction, month and unread boolean',()=>{
 assert.deepEqual(filters({q:'lunch',sort:'-amount',month:'2026-09',read:false,from:'2026-09-01'}),{search:'lunch',sort:'amount',order:'DESC',month:9,year:2026,is_read:0,start_date:'2026-09-01'});
});

test('optional and canonical academic years are not sent as invalid values',()=>{
 assert.equal(payload('/auth/register',{name:'Solo',academicYear:''}).academic_year,undefined);
 assert.equal(payload('/auth/register',{name:'Solo',academicYear:'senior'}).academic_year,'senior');
 for(const [year,expected] of Object.entries({'1':'freshman','2':'sophomore','3':'junior','4':'senior','5':'other',postgraduate:'graduate'}))assert.equal(payload('/auth/register',{academicYear:year}).academic_year,expected);
});
