import { Request, Response, NextFunction, RequestHandler } from "express";

/**
 * A wrapper to catch errors in asynchronous express routes
 * and pass them to the global error handler.
 */

export const asyncHandler = (fn: RequestHandler) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next)
    }
}