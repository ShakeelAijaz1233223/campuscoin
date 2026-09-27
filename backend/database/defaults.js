// Essential reference data only: no users, balances, transactions or insights.
// Existing/archived administrator content is never overwritten or reactivated.
    const incomeCategories = [
      ['Allowance', 'wallet', '#4CAF50'], ['Part-time Job', 'briefcase', '#2196F3'],
      ['Scholarship', 'award', '#9C27B0'], ['Gift', 'gift', '#FF9800'], ['Other Income', 'plus-circle', '#607D8B']
    ];
    const expenseCategories = [
      ['Food', 'utensils', '#F44336'], ['Transport', 'bus', '#FF9800'], ['Hostel/Rent', 'home', '#795548'],
      ['Academics', 'book', '#3F51B5'], ['Subscriptions', 'tv', '#E91E63'], ['Entertainment', 'music', '#9C27B0'],
      ['Miscellaneous', 'grid', '#607D8B']
    ];
    const tips = [
      ['Track Every Expense', 'The key to financial health is knowing where your money goes. Record even the smallest purchases.', 'general', 10],
      ['Use the 50/30/20 Rule', 'Try to spend 50% on needs, 30% on wants, and save 20% of your income.', 'savings', 9],
      ['Cook More, Eat Out Less', 'Preparing meals at home can save you up to 60% on food expenses compared to eating out.', 'food', 8],
      ['Use Student Discounts', 'Always ask for student discounts. Many services offer special rates for students.', 'general', 7],
      ['Set Up an Emergency Fund', 'Aim to save at least one month of expenses for unexpected costs.', 'savings', 9],
      ['Review Subscriptions Monthly', 'Cancel subscriptions you rarely use to save money.', 'subscriptions', 6],
      ['Walk or Cycle When Possible', 'Short distances can be walked instead of using transport — saving money and improving health.', 'transport', 5],
      ['Buy Used Textbooks', 'Second-hand textbooks or library copies cut academic costs significantly.', 'academics', 7],
      ['Avoid Impulse Purchases', 'Wait 24 hours before non-essential purchases. You may find you do not need the item.', 'general', 8],
      ['Set Monthly Budget Limits', 'Create budgets for each spending category and track progress throughout the month.', 'budgeting', 10]
    ];

async function seedDefaults(connection) {
  const [[lock]] = await connection.query("SELECT GET_LOCK(CONCAT('campuscoin:seed:', SHA1(DATABASE())), 30) AS acquired");
  if (Number(lock.acquired) !== 1) throw new Error('Could not lock reference-data setup');
  try {
    await connection.beginTransaction();
    for (const [key, value, description] of [
      ['app_name','CampusCoin','Application name'],
      ['app_version','1.0.0','Application version'],
      ['maintenance_mode','false','Maintenance mode toggle']
    ]) {
      await connection.execute('INSERT INTO system_settings (setting_key, setting_value, description) SELECT ?, ?, ? WHERE NOT EXISTS (SELECT 1 FROM system_settings WHERE setting_key = ?)', [key,value,description,key]);
    }
    for (const [type, categories] of [['income',incomeCategories],['expense',expenseCategories]]) {
      for (const [index, [name, icon, color]] of categories.entries()) {
        await connection.execute('INSERT INTO categories (user_id, name, type, icon, color, is_default, sort_order) SELECT NULL, ?, ?, ?, ?, 1, ? WHERE NOT EXISTS (SELECT 1 FROM categories WHERE user_id IS NULL AND name = ? AND type = ?)', [name,type,icon,color,index+1,name,type]);
      }
    }
    for (const [title, content, category, priority] of tips) {
      await connection.execute('INSERT INTO tips (title, content, category, priority, is_system) SELECT ?, ?, ?, ?, 1 WHERE NOT EXISTS (SELECT 1 FROM tips WHERE is_system = 1 AND title = ?)', [title,content,category,priority,title]);
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    await connection.query("SELECT RELEASE_LOCK(CONCAT('campuscoin:seed:', SHA1(DATABASE())))");
  }
}
module.exports = seedDefaults;
