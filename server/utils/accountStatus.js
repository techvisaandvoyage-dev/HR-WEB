const respondIfAccountBlocked = (account, res) => {
  if (account?.status !== 'blocked') return false;
  res.status(403).json({
    success: false,
    code: 'ACCOUNT_BLOCKED',
    message: 'Your account is blocked. Contact support.',
    reason: account.blockReason || ''
  });
  return true;
};

module.exports = { respondIfAccountBlocked };
