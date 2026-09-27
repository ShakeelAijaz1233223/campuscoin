const asyncHandler = require('../utils/asyncHandler');
const authService = require('../services/auth.service');
const { sendSuccess, sendCreated } = require('../utils/response');

const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  return sendCreated(res, { user: result.user, token: result.token }, 'Account created successfully');
});

const login = asyncHandler(async (req, res) => {
  const result = await authService.login({ ...req.body, ip: req.ip });
  return sendSuccess(res, { user: result.user, token: result.token }, 'Login successful');
});

const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.user.id);
  return sendSuccess(res, null, 'Logged out successfully');
});

const getMe = asyncHandler(async (req, res) => {
  const me = await authService.getMe(req.user.id);
  return sendSuccess(res, { user: me }, 'User profile retrieved');
});

const forgotPassword = asyncHandler(async (req, res) => {
  const result = await authService.forgotPassword(req.body.email);
  const data = { message: 'If an account with that email exists, a reset link has been sent.' };
  if (result.resetToken) data.reset_token = result.resetToken; // dev/test only
  return sendSuccess(res, data, 'Password reset instructions sent');
});

const resetPassword = asyncHandler(async (req, res) => {
  await authService.resetPassword(req.body);
  return sendSuccess(res, null, 'Password has been reset successfully');
});

const changePassword = asyncHandler(async (req, res) => {
  await authService.changePassword(req.user.id, req.body.current_password, req.body.new_password);
  return sendSuccess(res, null, 'Password changed successfully');
});

module.exports = { register, login, logout, getMe, forgotPassword, resetPassword, changePassword };
