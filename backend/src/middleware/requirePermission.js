const { errorResponse } = require("../utils/helpers");

exports.requireMainAdminPermission = (permissionKey) => (req, res, next) => {
  const perms = req.mainAdmin?.permissions || {};
  if (perms[permissionKey] !== true) {
    return errorResponse(res, 403, `Missing permission: ${permissionKey}`);
  }
  return next();
};
