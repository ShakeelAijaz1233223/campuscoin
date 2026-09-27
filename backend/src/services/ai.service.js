const CategoryModel = require('../models/category.model');
const AiCorrectionModel = require('../models/aiCorrection.model');
const { getAIProvider } = require('../config/ai');
const { NotFoundError, BadRequestError } = require('../utils/errors');

/**
 * AI category service — optional provider abstraction.
 * If the provider fails or is unavailable, callers receive a graceful
 * "unavailable" result and manual categorization continues to work.
 */
const suggestCategory = async (userId, description, type = 'expense') => {
  if (!description || !description.trim()) throw new BadRequestError('Description is required for AI suggestion');

  const categories = await CategoryModel.findByUser(userId, { type });
  if (categories.length === 0) throw new NotFoundError('No categories available');

  // Check user's correction history first (learning from corrections)
  const learned = await AiCorrectionModel.findCorrectionsForDescription(userId, description);
  if (learned.length > 0) {
    const learnedCat = categories.find((c) => c.id === learned[0].corrected_category_id);
    if (learnedCat) {
      return {
        category_id: learnedCat.id,
        category_name: learnedCat.name,
        confidence: 0.99,
        explanation: 'Learned from your previous corrections for similar transactions',
        learned: true,
        provider: 'correction-history'
      };
    }
  }

  try {
    const provider = getAIProvider();
    const result = provider.categorize(description, categories);
    if (result.categoryId) {
      await AiCorrectionModel.createSuggestion(userId, description, result.categoryId, result.confidence);
    }
    return {
      category_id: result.categoryId,
      category_name: result.categoryName,
      confidence: result.confidence,
      explanation: result.explanation || null,
      learned: false,
      provider: 'keyword-engine'
    };
  } catch (err) {
    return { category_id: null, category_name: null, confidence: 0, explanation: 'AI suggestion unavailable — please choose manually', provider: 'none', error: true };
  }
};

const suggestBatch = async (userId, descriptions, type = 'expense') => {
  const categories = await CategoryModel.findByUser(userId, { type });
  const results = [];
  for (const description of descriptions) {
    try {
      const provider = getAIProvider();
      const result = provider.categorize(description, categories);
      if (result.categoryId) {
        await AiCorrectionModel.createSuggestion(userId, description, result.categoryId, result.confidence);
      }
      results.push({ description, category_id: result.categoryId, category_name: result.categoryName, confidence: result.confidence });
    } catch (err) {
      results.push({ description, category_id: null, category_name: null, confidence: 0, error: true });
    }
  }
  return results;
};

/**
 * Record a user's manual correction — the learning signal.
 */
const recordCorrection = async (userId, { description, original_category_id, corrected_category_id }) => {
  const corrected = await CategoryModel.findById(corrected_category_id);
  if (!corrected || (corrected.user_id !== userId && corrected.is_default !== 1)) {
    throw new BadRequestError('Invalid corrected category');
  }
  if (original_category_id) {
    const original = await CategoryModel.findById(original_category_id);
    if (!original || (original.user_id !== userId && original.is_default !== 1)) {
      throw new BadRequestError('Invalid original category');
    }
  }
  const result = await AiCorrectionModel.create(userId, description, original_category_id || null, corrected_category_id);

  // Mark the most recent open suggestion for this description as corrected
  const suggestions = await AiCorrectionModel.getSuggestionHistory(userId, { limit: 5 });
  const match = suggestions.records.find((s) => s.description === description && s.accepted === null);
  if (match) await AiCorrectionModel.updateSuggestion(match.id, false, corrected_category_id);

  return { id: result.id, learned: true };
};

const getCorrectionHistory = async (userId, filters) => {
  return AiCorrectionModel.findByUser(userId, filters);
};

const getSuggestionHistory = async (userId, filters) => {
  return AiCorrectionModel.getSuggestionHistory(userId, filters);
};

const getStatus = () => {
  return {
    available: true,
    provider: env_provider(),
    ai_optional: true,
    message: 'AI is advisory. Transactions can always be created manually.'
  };
};

const env_provider = () => {
  const env = require('../config/env');
  return env.AI_PROVIDER === 'openai' && env.AI_API_KEY ? 'openai (fallback keyword engine)' : 'keyword-engine';
};

module.exports = { suggestCategory, suggestBatch, recordCorrection, getCorrectionHistory, getSuggestionHistory, getStatus };
