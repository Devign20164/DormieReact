/**
 * Async handler middleware to wrap async route handlers
 * This eliminates the need for try/catch blocks in each route
 * @param {Function} fn - The async route handler function
 * @returns {Function} - Express middleware function
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = { asyncHandler }; 