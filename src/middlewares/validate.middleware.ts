import { type NextFunction, type Request, type Response } from "express";
import { type ZodType } from "zod";

// Middleware to validate request body against a Zod schema
export const validateBody =
  (schema: ZodType) => (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error.issues.map((issue) => issue.message).join(", "),
        error: "Bad request",
      });
    }

    req.body = result.data;
    next();
  };

// Middleware to validate request query params against a Zod schema
export const validateQuery =
  (schema: ZodType) => (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error.issues.map((issue) => issue.message).join(", "),
        error: "Bad request",
      });
    }

    // Express 5's req.query is a getter-only property, so it can't be
    // reassigned directly (`req.query = ...` throws a TypeError).
    Object.defineProperty(req, "query", {
      value: result.data,
      writable: true,
      enumerable: true,
      configurable: true,
    });
    next();
  };
