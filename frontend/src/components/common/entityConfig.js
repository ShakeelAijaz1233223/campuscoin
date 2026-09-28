import transactionApi from '../../api/transactionApi';
import categoryApi from '../../api/categoryApi';
import recurringApi from '../../api/recurringApi';
import budgetApi from '../../api/budgetApi';
import goalApi from '../../api/goalApi';
import billApi from '../../api/billApi';
import noteApi from '../../api/noteApi';
import { today } from '../../utils/formatDate';
const f = (name, label, type = 'text', extra = {}) => ({
  name,
  label,
  type,
  ...extra
});
export const transactionFields = [
  f('description', 'Description', 'text', { maxLength: 500 }),
  f('type', 'Transaction type', 'select', {
    required: true,
    options: ['expense', 'income']
  }),
  f('amount', 'Amount', 'number', { required: true, min: 0.01, step: 0.01 }),
  f('date', 'Date', 'date', { required: true, default: today() }),
  f('categoryId', 'Category', 'category'),
  f('accountId', 'Account', 'account', { required: true }),
  f('notes', 'Notes', 'textarea', { maxLength: 2000 })
];
export const configs = {
  transactions: {
    api: transactionApi,
    title: 'Transactions',
    singular: 'transaction',
    description: 'Every little purchase. The whole picture.',
    fields: transactionFields,
    columns: ['description', 'category', 'date', 'type', 'amount'],
    filters: true,
    searchable: true
  },
  categories: {
    api: categoryApi,
    title: 'Categories',
    singular: 'category',
    description: 'A place for every part of your student life.',
    fields: [
      f('name', 'Category name', 'text', { required: true, maxLength: 100 }),
      f('type', 'Type', 'select', {
        required: true,
        options: ['expense', 'income']
      }),
      f('color', 'Color', 'color', { default: '#aef28a' }),
      f('icon', 'Icon label', 'text', { maxLength: 50 })
    ],
    columns: ['name', 'type', 'color']
  },
  recurring: {
    api: recurringApi,
    title: 'Recurring transactions',
    singular: 'recurring transaction',
    description: 'Build consistency into your cash flow.',
    fields: [
      ...transactionFields.filter((f) => !['date', 'notes'].includes(f.name)),
      f('frequency', 'Frequency', 'select', {
        required: true,
        options: [
          'daily',
          'weekly',
          'biweekly',
          'monthly',
          'quarterly',
          'yearly'
        ]
      }),
      f('startDate', 'Start date', 'date', {
        required: true,
        default: today()
      }),
      f('endDate', 'End date (optional)', 'date'),
      f('enabled', 'Active', 'checkbox', { default: true })
    ],
    columns: ['description', 'amount', 'frequency', 'nextDate', 'enabled']
  },
  budgets: {
    api: budgetApi,
    title: 'Budgets',
    singular: 'budget',
    description: 'A little intention goes a long way.',
    fields: [
      f('categoryId', 'Expense category', 'category', {
        required: true,
        categoryType: 'expense'
      }),
      f('amount', 'Monthly limit', 'number', {
        required: true,
        min: 0.01,
        step: 0.01
      }),
      f('month', 'Month', 'month', {
        required: true,
        default: today().slice(0, 7)
      })
    ],
    columns: ['name', 'month', 'amount', 'spent'],
    cards: true
  },
  goals: {
    api: goalApi,
    title: 'Savings goals',
    singular: 'goal',
    description: 'Big plans, made possible one step at a time.',
    fields: [
      f('name', 'What are you saving for?', 'text', {
        required: true,
        maxLength: 200
      }),
      f('targetAmount', 'Target amount', 'number', {
        required: true,
        min: 0.01,
        step: 0.01
      }),
      f('savedAmount', 'Amount already saved', 'number', {
        required: true,
        min: 0,
        step: 0.01,
        default: 0
      }),
      f('targetDate', 'Target date', 'date'),
      f('notes', 'Your motivation', 'textarea', { maxLength: 2000 })
    ],
    columns: ['name', 'targetAmount', 'savedAmount', 'targetDate'],
    cards: true
  },
  bills: {
    api: billApi,
    title: 'Bills & payments',
    singular: 'bill',
    description: 'Stay a step ahead of what’s due.',
    fields: [
      f('name', 'Bill name', 'text', { required: true, maxLength: 100 }),
      f('amount', 'Amount', 'number', {
        required: true,
        min: 0.01,
        step: 0.01
      }),
      f('dueDate', 'Due date', 'date', { required: true }),
      f('categoryId', 'Category', 'category'),
      f('status', 'Status', 'select', {
        options: ['unpaid', 'paid'],
        required: true
      }),
      f('reminderDays', 'Remind me this many days before', 'number', {
        default: 3,
        min: 0,
        max: 30
      }),
      f('notes', 'Notes', 'textarea')
    ],
    columns: ['name', 'amount', 'dueDate', 'status'],
    cards: true
  },
  notes: {
    api: noteApi,
    title: 'Notes',
    singular: 'note',
    description: 'A little space for your financial plans.',
    fields: [
      f('title', 'Title', 'text', { required: true, maxLength: 300 }),
      f('body', 'Note', 'textarea', { required: true, maxLength: 10000 })
    ],
    columns: ['title', 'body', 'updatedAt'],
    cards: true
  }
};
export { f };
