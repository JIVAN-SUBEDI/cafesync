const ROLE_PERMISSIONS = {
  hotel_admin: [
    "dashboard",
    "staff",
    "menu",
    "category",
    "tables",
    "orders",
    "billing",
    "kitchen",
    "inventory",
    "settings",
    "reports",
  ],
  manager: [
    "dashboard",
    "staff",
    "menu",
    "category",
    "tables",
    "orders",
    "billing",
    "kitchen",
    "inventory",
    "reports",
  ],
  receptionist: [
    "dashboard",
    "tables",
    "orders",
  ],
  billing: [
    "dashboard",
    "orders",
    "billing",
  ],
  waiter: [
    "dashboard",
    "tables",
    "orders",
    "menu",
  ],
  kitchen: [
    "dashboard",
    "kitchen",
    "orders",
  ],
  inventory: [
    "dashboard",
    "inventory",
  ],
};

function getPermissionsByRole(role) {
  return ROLE_PERMISSIONS[role] || [];
}

function hasPermission(role, permission) {
  return getPermissionsByRole(role).includes(permission);
}

module.exports = {
  ROLE_PERMISSIONS,
  getPermissionsByRole,
  hasPermission,
};