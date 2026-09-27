const env = require('./env');
const logger = require('../utils/logger');

class AIProvider {
  async categorize(description, categories) {
    throw new Error('AI categorize not implemented');
  }
  async batchCategorize(descriptions, categories) {
    throw new Error('AI batch categorize not implemented');
  }
  async generateInsight(data) {
    throw new Error('AI generateInsight not implemented');
  }
  async generateTips(data) {
    throw new Error('AI generateTips not implemented');
  }
}

class KeywordAIProvider extends AIProvider {
  constructor() {
    super();
    this.keywordMap = {
      'food': ['food', 'lunch', 'dinner', 'breakfast', 'snack', 'grocery', 'groceries', 'restaurant', 'cafe', 'coffee', 'tea', 'meal', 'pizza', 'burger', 'chicken', 'fruit', 'vegetable', 'bread', 'milk', 'rice'],
      'transport': ['transport', 'bus', 'uber', 'careem', 'rickshaw', 'taxi', 'fuel', 'petrol', 'gas', 'metro', 'train', 'bike', 'ride', 'fare', 'ticket', 'parking'],
      'hostel/rent': ['rent', 'hostel', 'accommodation', 'housing', 'room', 'apartment', 'utility', 'electricity', 'water', 'gas bill'],
      'academics': ['book', 'textbook', 'stationery', 'pen', 'paper', 'tuition', 'course', 'semester', 'exam', 'fees', 'lab', 'library', 'notebook', 'assignment'],
      'subscriptions': ['netflix', 'spotify', 'subscription', 'streaming', 'amazon', 'prime', 'youtube premium', 'apple', 'disney'],
      'entertainment': ['movie', 'cinema', 'concert', 'game', 'gaming', 'party', 'outing', 'fun', 'club', 'sport', 'music', 'event'],
      'allowance': ['allowance', 'pocket money', 'monthly money', 'from parents'],
      'part-time job': ['salary', 'wage', 'job', 'work', 'freelance', 'part-time', 'internship', 'stipend'],
      'scholarship': ['scholarship', 'grant', 'aid', 'fellowship', 'bursary', 'stipend'],
      'gift': ['gift', 'present', 'birthday', 'reward', 'bonus', 'prize']
    };
  }

  categorize(description, categories) {
    const desc = description.toLowerCase();
    let bestMatch = null;
    let bestScore = 0;

    for (const [catKey, keywords] of Object.entries(this.keywordMap)) {
      for (const keyword of keywords) {
        if (desc.includes(keyword) && keyword.length > bestScore) {
          bestScore = keyword.length;
          const cat = categories.find(c => c.name.toLowerCase() === catKey.toLowerCase());
          if (cat) bestMatch = cat;
        }
      }
    }

    if (bestMatch) {
      return { categoryId: bestMatch.id, categoryName: bestMatch.name, confidence: Math.min(0.95, 0.5 + bestScore * 0.05), explanation: `Matched keyword in description` };
    }
    return { categoryId: null, categoryName: null, confidence: 0, explanation: 'No matching keywords found' };
  }

  batchCategorize(descriptions, categories) {
    return descriptions.map(desc => ({ description: desc, ...this.categorize(desc, categories) }));
  }

  generateInsight(data) {
    const { totalIncome, totalExpense, previousExpense, topCategory, savingsRate } = data;
    const savings = totalIncome - totalExpense;
    const change = previousExpense ? ((totalExpense - previousExpense) / previousExpense * 100).toFixed(1) : 0;
    let summary = `This month you earned PKR ${totalIncome.toLocaleString()} and spent PKR ${totalExpense.toLocaleString()}, saving PKR ${savings.toLocaleString()}.`;
    if (change > 0) summary += ` Your spending increased by ${change}% compared to last month.`;
    else if (change < 0) summary += ` Your spending decreased by ${Math.abs(change)}% compared to last month.`;
    if (topCategory) summary += ` Your top spending category was ${topCategory}.`;
    const tip = savingsRate < 20 ? 'Try to save at least 20% of your income by reducing non-essential expenses.' : 'Great job saving! Consider investing your savings for better returns.';
    return { summary, tip, metadata: { savingsRate, change } };
  }

  generateTips(data) {
    return [];
  }
}

class OpenAIProvider extends AIProvider {
  constructor(apiKey) {
    super();
    this.apiKey = apiKey;
  }

  async categorize(description, categories) {
    // OpenAI integration placeholder - requires actual API key
    // Falls back to keyword matching if API call fails
    return new KeywordAIProvider().categorize(description, categories);
  }

  async batchCategorize(descriptions, categories) {
    return descriptions.map(desc => ({ description: desc, ...this.categorize(desc, categories) }));
  }

  async generateInsight(data) {
    return new KeywordAIProvider().generateInsight(data);
  }

  async generateTips(data) {
    return new KeywordAIProvider().generateTips(data);
  }
}

let provider = null;

const getAIProvider = () => {
  if (provider) return provider;
  if (env.AI_PROVIDER === 'openai' && env.AI_API_KEY) {
    provider = new OpenAIProvider(env.AI_API_KEY);
    logger.info('AI Provider: OpenAI');
  } else {
    provider = new KeywordAIProvider();
    logger.info('AI Provider: Keyword-based');
  }
  return provider;
};

module.exports = { getAIProvider, AIProvider, KeywordAIProvider };