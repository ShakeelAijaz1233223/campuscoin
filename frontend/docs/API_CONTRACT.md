# CampusCoin frontend ↔ backend contract (proposed)

Base: `/api/v1`. JSON. Cookie session. Errors: `{ message, errors? }` with a proper status.
Lists accept `page`, `limit`, `q`, `sort` and return `{ items: [], total }`.
Standard resources support `GET /`, `GET /:id`, `POST /`, `PATCH /:id`, `DELETE /:id`.

| Area | Endpoints | Notes |
|---|---|---|
| auth | `GET /auth/me` → `{user}`; `POST /auth/login {email,password}` → `{user}`; `POST /auth/register {name,email,password,academicYear,monthlyAllowance}`; `POST /auth/logout`; `POST /auth/forgot-password {email}`; `POST /auth/reset-password/:token {password}` | `user.role` = `student` \| `admin` |
| profile | `GET /profile`, `PATCH /profile` | name, email, academicYear, monthlyAllowance, savingsGoal, currency |
| accounts | resource `/accounts` | name, type, openingBalance, currency, balance |
| categories | resource `/categories` | name, type (income/expense), color, icon |
| transactions | resource `/transactions` (filters: type, categoryId, from, to, minAmount, maxAmount, sort=-date…) ; `POST /transactions/suggest-category {description,type}` → `{categoryId,categoryName,confidence}` | |
| recurring | resource `/recurring-transactions` | frequency, startDate, endDate, enabled, nextDate |
| budgets | resource `/budgets` | name, categoryId?, amount, month (YYYY-MM), alertThreshold, spent |
| goals | resource `/goals` | name, targetAmount, savedAmount, targetDate, notes |
| bills | resource `/bills` | name, amount, dueDate, categoryId, status, reminderDays |
| dashboard | `GET /dashboard?month=` → `{currency,balance,income,expense,savings,financialStatus,spendingTrend[{label,amount}],recentTransactions,budgets,categories[{label,amount}],monthlyOverview[{label,income,expense}],budgetActual[{label,budget,actual}],insight{summary},tips,alerts[{id,type,severity,message}]}` | |
| reports | `GET /reports?period=monthly|six-month&from&to&categoryId&incomeSource` → `{currency,summary{income,expense,savings},incomeExpense,categories,daily,weekly,exportFormats:['pdf','image']}` | |
| insights | `GET /insights?month`, `GET /insights/:id`, `POST /insights/generate {month}` | title, summary, body, comparison, spendingGrowth, unusualPatterns, suggestions, bookmarkId |
| tips | `GET /tips`, `POST /tips/:id/dismiss` | title, body, category, bookmarkId |
| bookmarks | `GET /bookmarks?type=tip|insight`, `POST /bookmarks {type,itemId}`, `DELETE /bookmarks/:id` | returns `{id,type,item}` |
| notes | resource `/notes` | title, body |
| notifications | `GET /notifications?read=false`, `PATCH /notifications/:id/read`, `PATCH /notifications/read-all` | title, message, type, read, link, createdAt |
| imports | `POST /imports/validate {rows,aiSuggestions}` → `{validationId,rows[+suggestion],errors[{row,message}],duplicates}`; `POST /imports/confirm {validationId,rows,skipDuplicates}` → job `{id,status,progress,processed,imported,skipped}`; `GET /imports/:id` | |
| exports | `GET /exports?format=pdf|image&…filters` → binary; `POST /exports/share {filters,expiresInHours}` → `{url}` | |
| search | `GET /search?q=` → `{items[{id,type,title,snippet,url}],total}` | |
| settings | `GET /settings`, `PATCH /settings` | notification preferences |
| admin | `GET /admin/users`, `PATCH /admin/users/:id {enabled}`, `POST /admin/users/:id/reset-access`, resources `/admin/categories`, `/admin/announcements`, `/admin/tips`, `GET /admin/statistics` → `{totalUsers,activeUsers,totalTransactions,topCategories[{label,count}],activity[{label,count}]}` | admin role enforced server-side |
