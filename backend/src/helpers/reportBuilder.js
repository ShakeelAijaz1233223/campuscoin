const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { round2 } = require('./statistics');

const EXPORTS_DIR = path.join(__dirname, '../../exports');

const ensureExportsDir = () => {
  if (!fs.existsSync(EXPORTS_DIR)) fs.mkdirSync(EXPORTS_DIR, { recursive: true });
};

/**
 * Build a PDF monthly report for a user.
 * data: { user, period, totals, categoryBreakdown, monthlyTrend, dailyBreakdown, budgets, transactions }
 * Returns the file path of the generated PDF.
 */
const buildMonthlyReportPDF = (data) => {
  ensureExportsDir();
  const filename = `report_${data.user.id}_${data.period.year}_${String(data.period.month).padStart(2, '0')}_${Date.now()}.pdf`;
  const filePath = path.join(EXPORTS_DIR, filename);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    const currency = data.user.currency || 'PKR';
    const money = (n) => `${currency} ${round2(n || 0).toLocaleString('en-US')}`;

    // Header
    doc.fontSize(22).fillColor('#1a237e').text('CampusCoin', { align: 'left' });
    doc.fontSize(16).fillColor('#333').text(`Monthly Financial Report — ${data.period.label}`, { align: 'left' });
    doc.fontSize(10).fillColor('#777').text(`Generated: ${new Date().toUTCString()}`, { align: 'left' });
    doc.fontSize(10).fillColor('#777').text(`Account: ${data.user.email}`, { align: 'left' });
    doc.moveDown(1);

    // Totals summary
    doc.fontSize(13).fillColor('#1a237e').text('Summary');
    const savings = round2(data.totals.income - data.totals.expense);
    const savingsRate = data.totals.income > 0 ? round2((savings / data.totals.income) * 100) : 0;
    doc.fontSize(11).fillColor('#333');
    doc.text(`Total Income: ${money(data.totals.income)}`);
    doc.text(`Total Expenses: ${money(data.totals.expense)}`);
    doc.text(`Net Savings: ${money(savings)} (${savingsRate}%)`);
    doc.text(`Transactions: ${data.totals.count || 0}`);
    doc.moveDown(1);

    // Category breakdown table
    if (data.categoryBreakdown && data.categoryBreakdown.length > 0) {
      doc.fontSize(13).fillColor('#1a237e').text('Category Breakdown');
      const tableTop = doc.y + 5;
      const colX = [50, 260, 360, 460];
      doc.fontSize(10).fillColor('#555');
      doc.text('Category', colX[0], tableTop);
      doc.text('Amount', colX[1], tableTop);
      doc.text('Txns', colX[2], tableTop);
      doc.text('% Share', colX[3], tableTop);
      let y = tableTop + 15;
      doc.moveTo(50, y).lineTo(545, y).strokeColor('#ccc').stroke();
      y += 5;
      doc.fillColor('#333');
      data.categoryBreakdown.slice(0, 20).forEach((c) => {
        if (y > 720) { doc.addPage(); y = 60; }
        const share = data.totals.expense > 0 ? round2((parseFloat(c.total) / data.totals.expense) * 100) : 0;
        doc.fontSize(9).text(String(c.category_name).substring(0, 32), colX[0], y);
        doc.text(money(c.total), colX[1], y);
        doc.text(String(c.count), colX[2], y);
        doc.text(`${share}%`, colX[3], y);
        y += 16;
      });
      doc.moveDown(1.5);
    }

    // Six-month trend
    if (data.monthlyTrend && data.monthlyTrend.length > 0) {
      if (doc.y > 600) doc.addPage();
      doc.fontSize(13).fillColor('#1a237e').text('Income vs Expense (Last 6 Months)');
      let y = doc.y + 10;
      doc.fontSize(9).fillColor('#333');
      data.monthlyTrend.forEach((m) => {
        if (y > 720) { doc.addPage(); y = 60; }
        doc.text(`${m.label}:  Income ${money(m.income)}  |  Expenses ${money(m.expense)}`, 50, y);
        y += 14;
      });
      doc.moveDown(1);
    }

    // Budget vs actual
    if (data.budgets && data.budgets.length > 0) {
      if (doc.y > 600) doc.addPage();
      doc.fontSize(13).fillColor('#1a237e').text('Budget vs Actual');
      let y = doc.y + 10;
      doc.fontSize(9);
      data.budgets.forEach((b) => {
        if (y > 720) { doc.addPage(); y = 60; }
        const pct = b.amount > 0 ? round2((parseFloat(b.spent) / parseFloat(b.amount)) * 100) : 0;
        const status = pct > 100 ? 'EXCEEDED' : pct >= 80 ? 'NEAR LIMIT' : 'OK';
        doc.fillColor(pct > 100 ? '#b71c1c' : pct >= 80 ? '#e65100' : '#333');
        doc.text(`${b.category_name}: ${money(b.spent)} / ${money(b.amount)} (${pct}%) ${status}`, 50, y);
        y += 14;
      });
      doc.moveDown(1);
    }

    // Transactions list (top 30)
    if (data.transactions && data.transactions.length > 0) {
      doc.addPage();
      doc.fontSize(13).fillColor('#1a237e').text('Transactions');
      let y = doc.y + 10;
      doc.fontSize(8);
      data.transactions.forEach((t) => {
        if (y > 750) { doc.addPage(); y = 60; }
        doc.fillColor(t.type === 'income' ? '#1b5e20' : '#333');
        const desc = String(t.description || '').substring(0, 34);
        const cat = String(t.category_name || 'Uncategorized').substring(0, 16);
        doc.text(`${t.date}  ${desc.padEnd(36)} ${cat.padEnd(18)} ${t.type === 'income' ? '+' : '-'}${money(t.amount)}`, 50, y);
        y += 13;
      });
    }

    // Footer disclaimer
    doc.fontSize(8).fillColor('#999');
    doc.text('This report was generated by CampusCoin. Figures are advisory and based on recorded transactions only.', 50, doc.page.height - 60, { width: 495 });

    doc.end();
    stream.on('finish', () => resolve({ filePath, filename }));
    stream.on('error', reject);
  });
};

/**
 * Build a PDF report for a custom date range / daily / weekly reports.
 */
const buildRangeReportPDF = (data) => {
  ensureExportsDir();
  const filename = `report_${data.user.id}_${data.period.label.replace(/[^\w]/g, '_')}_${Date.now()}.pdf`;
  const filePath = path.join(EXPORTS_DIR, filename);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    const currency = data.user.currency || 'PKR';
    const money = (n) => `${currency} ${round2(n || 0).toLocaleString('en-US')}`;

    doc.fontSize(22).fillColor('#1a237e').text('CampusCoin');
    doc.fontSize(16).fillColor('#333').text(`Financial Report — ${data.period.title}`);
    doc.fontSize(10).fillColor('#777').text(`Range: ${data.period.startDate} to ${data.period.endDate}`);
    doc.fontSize(10).fillColor('#777').text(`Generated: ${new Date().toUTCString()} | Account: ${data.user.email}`);
    doc.moveDown(1);

    const savings = round2(data.totals.income - data.totals.expense);
    doc.fontSize(13).fillColor('#1a237e').text('Summary');
    doc.fontSize(11).fillColor('#333');
    doc.text(`Total Income: ${money(data.totals.income)}`);
    doc.text(`Total Expenses: ${money(data.totals.expense)}`);
    doc.text(`Net Savings: ${money(savings)}`);
    doc.text(`Transactions: ${data.totals.count || 0}`);
    doc.moveDown(1);

    if (data.breakdown && data.breakdown.length > 0) {
      doc.fontSize(13).fillColor('#1a237e').text(data.breakdownLabel || 'Breakdown');
      let y = doc.y + 10;
      doc.fontSize(9);
      data.breakdown.slice(0, 40).forEach((r) => {
        if (y > 720) { doc.addPage(); y = 60; }
        doc.fillColor('#333');
        doc.text(`${r.label}: ${money(r.income !== undefined ? r.income : r.total)}${r.expense !== undefined ? ` | Expenses: ${money(r.expense)}` : ''}`, 50, y);
        y += 14;
      });
    }

    doc.fontSize(8).fillColor('#999');
    doc.text('Generated by CampusCoin. Advisory figures based on recorded transactions only.', 50, doc.page.height - 60, { width: 495 });

    doc.end();
    stream.on('finish', () => resolve({ filePath, filename }));
    stream.on('error', reject);
  });
};

module.exports = { buildMonthlyReportPDF, buildRangeReportPDF, EXPORTS_DIR };
