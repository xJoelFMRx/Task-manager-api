// Centralized middleware for error handling
export const errorHandler = (err, req, res, next) => {
  // A Mongoose CastError on an ObjectId means the id in the URL is malformed.
  // Treat it as a "not found" (404) rather than an unexpected server error (500).
  if (err.name === "CastError" && err.kind === "ObjectId") {
    return res.status(404).json({ message: req.t("task_not_found") });
  }

  const status = err.status || 500;
  // Only log the full stack for unexpected server errors, not operational 4xx errors.
  if (status >= 500) {
    console.error(err.stack);
  }
  res.status(status).json({
    message: err.message || req.t("internal_server_error")
  });
};
