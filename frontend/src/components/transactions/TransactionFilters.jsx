import { Input, Select, Button } from '../common/UI';
import useResource from '../../hooks/useResource';
import categoryApi from '../../api/categoryApi';
export default function TransactionFilters({ filters, onChange }) {
  const { items } = useResource(categoryApi, { limit: 500 });
  const set = (k, v) => onChange({ ...filters, [k]: v, page: 1 });
  return (
    <div className="filter-panel">
      <Select
        label="Type"
        value={filters.type || ''}
        onChange={(e) => set('type', e.target.value)}
      >
        <option value="">All transactions</option>
        <option value="income">Income</option>
        <option value="expense">Expense</option>
      </Select>
      <Select
        label="Category"
        value={filters.categoryId || ''}
        onChange={(e) => set('categoryId', e.target.value)}
      >
        <option value="">All categories</option>
        {items.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </Select>
      <Input
        label="From"
        type="date"
        value={filters.from || ''}
        onChange={(e) => set('from', e.target.value)}
      />
      <Input
        label="To"
        type="date"
        min={filters.from}
        value={filters.to || ''}
        onChange={(e) => set('to', e.target.value)}
      />
      <Input
        label="Minimum amount"
        type="number"
        min="0"
        value={filters.minAmount || ''}
        onChange={(e) => set('minAmount', e.target.value)}
      />
      <Input
        label="Maximum amount"
        type="number"
        min={filters.minAmount || 0}
        value={filters.maxAmount || ''}
        onChange={(e) => set('maxAmount', e.target.value)}
      />
      <Select
        label="Sort"
        value={filters.sort || '-date'}
        onChange={(e) => set('sort', e.target.value)}
      >
        {[
          ['-date', 'Newest first'],
          ['date', 'Oldest first'],
          ['-amount', 'Highest amount'],
          ['amount', 'Lowest amount'],
          ['description', 'Description A–Z']
        ].map(([v, t]) => (
          <option key={v} value={v}>
            {t}
          </option>
        ))}
      </Select>
      <Button variant="ghost" onClick={() => onChange({ page: 1, limit: 20 })}>
        Reset filters
      </Button>
    </div>
  );
}
