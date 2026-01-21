// Auth middleware exports
export {
  loadCurrentUser,
  devAuthMiddleware,
  createAuthMiddleware,
  softJwtCheck,
  strictJwtCheck,
  createGlobalAuthMiddleware,
} from "./authMiddleware";

export {
  requireRole,
  requireAdmin,
  requireTeacher,
  requireParent,
  requireStaff,
  hasRole,
  isAdmin,
  isTeacher,
  isParent,
} from "./roleMiddleware";

export {
  errorHandler,
  notFoundHandler,
  AuthenticationError,
  AuthorizationError,
} from "./errorMiddleware";
