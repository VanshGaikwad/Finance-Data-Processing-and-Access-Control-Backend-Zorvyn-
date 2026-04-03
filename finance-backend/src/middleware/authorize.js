function buildRoleErrorMessage(roles) {
  return `Access denied. Required role: ${roles.join(' or ')}.`;
}

function authorize(...roles) {
  const allowedSet = new Set(roles);

  return function authorizeRequest(req, res, next) {
    const currentRole = req.user?.role;

    if (!allowedSet.has(currentRole)) {
      return res.status(403).json({
        error: buildRoleErrorMessage(roles)
      });
    }

    return next();
  };
}

module.exports = authorize;