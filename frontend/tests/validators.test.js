import test from 'node:test';import assert from 'node:assert/strict';import {validateTransaction,isIsoDate,validatePassword} from '../src/utils/validators.js';import formatCurrency from '../src/utils/formatCurrency.js';import formatDate from '../src/utils/formatDate.js';
test('CSV validation accepts a valid row',()=>assert.deepEqual(validateTransaction({description:'Test entry',amount:'1.50',type:'expense',date:'2026-09-01'}),[]));
test('CSV rejects missing and invalid values',()=>assert.equal(validateTransaction({description:'',amount:'-2',type:'other',date:'tomorrow'}).length,4));
test('date validation rejects overflowing dates and non-leap dates',()=>{assert.equal(isIsoDate('2026-02-30'),false);assert.equal(isIsoDate('2026-02-29'),false);assert.equal(isIsoDate('2024-02-29'),true);assert.equal(isIsoDate(''),false);});
test('password baseline and formatting are predictable',()=>{assert.equal(validatePassword('123'),false);assert.equal(validatePassword('long-password-123'),false);assert.equal(formatCurrency(null),'—');assert.equal(formatCurrency('abc'),'—');assert.equal(formatDate('invalid'),'—');});

test('password policy matches registration and reset API requirements',()=>{
 for(const value of ['Abcdef12','Strong@123','  Test<Password>123  '])assert.equal(validatePassword(value),true,value);
 for(const value of ['12345678','abcdefghijklm','ABCDEFGH12','NoNumbersHere','Short1',null])assert.equal(validatePassword(value),false,String(value));
});

test('date-only financial records retain their calendar date in western time zones',async()=>{
 const {execFileSync}=await import('node:child_process');
 const output=execFileSync(process.execPath,['--input-type=module','-e',"import formatDate from './src/utils/formatDate.js'; console.log(formatDate('2026-09-01'));"],{cwd:new URL('..',import.meta.url),env:{...process.env,TZ:'America/Los_Angeles'}});
 assert.equal(output.toString().trim(),'1 Sept 2026');
});
