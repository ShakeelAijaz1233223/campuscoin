const GoalModel = require('../models/goal.model');
const ActivityModel = require('../models/activity.model');
const NotificationModel = require('../models/notification.model');
const { NotFoundError, BadRequestError } = require('../utils/errors');
const { round2 } = require('../helpers/statistics');

const MILESTONES = [25, 50, 75, 100];

const enrichGoal = (goal) => {
  const target = parseFloat(goal.target_amount);
  const current = parseFloat(goal.current_amount);
  const percentage = target > 0 ? round2(Math.min(100, (current / target) * 100)) : 0;
  const remaining = round2(Math.max(0, target - current));
  let days_remaining = null;
  if (goal.target_date) {
    days_remaining = Math.ceil((new Date(goal.target_date) - new Date()) / (1000 * 60 * 60 * 24));
  }
  const reachedMilestones = MILESTONES.filter((m) => percentage >= m);
  return {
    ...goal,
    percentage,
    remaining,
    days_remaining,
    next_milestone: MILESTONES.find((m) => percentage < m) || null,
    milestones_reached: reachedMilestones
  };
};

const getGoals = async (userId, filters) => {
  const { goals, total } = await GoalModel.findByUser(userId, filters);
  const enriched = goals.map(enrichGoal);
  const active = enriched.filter((g) => g.status === 'active');
  return {
    goals: enriched,
    total,
    summary: {
      active_count: active.length,
      completed_count: enriched.filter((g) => g.status === 'completed').length,
      total_target: round2(active.reduce((s, g) => s + parseFloat(g.target_amount), 0)),
      total_saved: round2(active.reduce((s, g) => s + parseFloat(g.current_amount), 0))
    }
  };
};

const getGoal = async (userId, id) => {
  const goal = await GoalModel.findById(id);
  if (!goal || goal.user_id !== userId) throw new NotFoundError('Goal not found');
  return enrichGoal(goal);
};

const createGoal = async (userId, data, ip = null) => {
  if (data.target_amount <= 0) throw new BadRequestError('Target amount must be positive');
  if (data.target_date && new Date(data.target_date) <= new Date()) {
    throw new BadRequestError('Target date must be in the future');
  }
  data.user_id = userId;
  const result = await GoalModel.create(data);
  await ActivityModel.create(userId, 'created', 'goal', result.id, `Created savings goal: ${data.name}`, null, ip);
  return enrichGoal(await GoalModel.findById(result.id));
};

const updateGoal = async (userId, id, data, ip = null) => {
  const goal = await GoalModel.findById(id);
  if (!goal || goal.user_id !== userId) throw new NotFoundError('Goal not found');
  if (data.target_amount !== undefined && data.target_amount <= 0) throw new BadRequestError('Target amount must be positive');

  await GoalModel.update(id, data);
  await ActivityModel.create(userId, 'updated', 'goal', id, `Updated goal: ${goal.name}`, null, ip);
  return enrichGoal(await GoalModel.findById(id));
};

const deleteGoal = async (userId, id, ip = null) => {
  const goal = await GoalModel.findById(id);
  if (!goal || goal.user_id !== userId) throw new NotFoundError('Goal not found');
  await GoalModel.delete(id);
  await ActivityModel.create(userId, 'deleted', 'goal', id, `Deleted goal: ${goal.name}`, null, ip);
  return true;
};

const contribute = async (userId, goalId, { amount, notes, date }, ip = null) => {
  const goal = await GoalModel.findById(goalId);
  if (!goal || goal.user_id !== userId) throw new NotFoundError('Goal not found');
  if (goal.status !== 'active') throw new BadRequestError('Contributions can only be made to active goals');
  if (amount <= 0) throw new BadRequestError('Contribution amount must be positive');

  const prevPct = parseFloat(goal.target_amount) > 0 ? (parseFloat(goal.current_amount) / parseFloat(goal.target_amount)) * 100 : 0;
  const result = await GoalModel.addContribution(goalId, userId, amount, date || new Date().toISOString().split('T')[0], notes);
  const updated = enrichGoal(result.goal);
  const newPct = updated.percentage;

  // Milestone notifications
  for (const milestone of MILESTONES) {
    if (prevPct < milestone && newPct >= milestone) {
      const isComplete = milestone === 100;
      await NotificationModel.create(userId,
        isComplete ? 'goal_completed' : 'goal_milestone',
        isComplete ? 'Goal Completed! 🎉' : `Goal Milestone: ${milestone}%`,
        isComplete
          ? `Congratulations! You've reached your goal "${goal.name}" — target of ${goal.target_amount} achieved!`
          : `Your goal "${goal.name}" has reached ${milestone}% of the target. Keep going!`,
        { goal_id: goalId, milestone }
      );
    }
  }

  await ActivityModel.create(userId, 'created', 'goal_contribution', goalId, `Contributed ${amount} to goal: ${goal.name}`, null, ip);
  return { contribution_id: result.id, goal: updated };
};

const getContributions = async (userId, goalId) => {
  const goal = await GoalModel.findById(goalId);
  if (!goal || goal.user_id !== userId) throw new NotFoundError('Goal not found');
  return GoalModel.getContributions(goalId, userId);
};

const deleteContribution = async (userId, goalId, contributionId, ip = null) => {
  const goal = await GoalModel.findById(goalId);
  if (!goal || goal.user_id !== userId) throw new NotFoundError('Goal not found');
  const contributions=await GoalModel.getContributions(goalId,userId);
  if(!contributions.some(c=>c.id===contributionId))throw new NotFoundError('Contribution not found');
  await GoalModel.removeContribution(contributionId);
  await ActivityModel.create(userId, 'deleted', 'goal_contribution', contributionId, `Removed contribution from goal: ${goal.name}`, null, ip);
  return true;
};

module.exports = { getGoals, getGoal, createGoal, updateGoal, deleteGoal, contribute, getContributions, deleteContribution, enrichGoal };
