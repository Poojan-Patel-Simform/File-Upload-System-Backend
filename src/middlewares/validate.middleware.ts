import { type NextFunction, type Request, type Response } from "express";
import { type ZodType } from "zod";

/** Validates req.body against a Zod schema (400 on failure) and replaces it with the parsed data. */
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

    // Use the parsed data (coerced types, defaults applied)
    req.body = result.data;
    next();
  };

/** Validates req.query against a Zod schema (400 on failure) and replaces it with the parsed data. */
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
