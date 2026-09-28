import { Link } from 'react-router-dom';
import { ArrowUpRight, CalendarClock, ReceiptText } from 'lucide-react';
import { Card } from '../common/UI';
import formatCurrency from '../../utils/formatCurrency';
import formatDate from '../../utils/formatDate';
export default function UpcomingBills({ items = [], currency }) {
  return (
    <Card className="upcoming-bills">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">STAY A STEP AHEAD</p>
          <h2>On the horizon</h2>
        </div>
        <CalendarClock size={19} className="muted" />
      </div>
      {items.length ? (
        items.slice(0, 3).map((bill) => (
          <Link to="/bills" key={bill.id} className="bill-preview">
            <span className="transaction-icon">
              <ReceiptText size={16} />
            </span>
            <span>
              <b>{bill.name}</b>
              <small>Due {formatDate(bill.due_date)}</small>
            </span>
            <strong>{formatCurrency(bill.amount, currency)}</strong>
          </Link>
        ))
      ) : (
        <div className="horizon-empty">
          <span className="mini-icon">
            <CalendarClock size={22} />
          </span>
          <h3>A little breathing room.</h3>
          <p>No unpaid bills due in the next seven days.</p>
        </div>
      )}
      <Link to="/bills" className="text-button">
        View bills & payments <ArrowUpRight size={14} />
      </Link>
    </Card>
  );
}
