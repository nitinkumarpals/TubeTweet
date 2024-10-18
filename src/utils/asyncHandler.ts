// prototype-> const asyncHander = () => { () => {} };
import { Request, Response, NextFunction } from "express";
export const asyncHandler =
    (fn: (req: Request, res: Response, next: NextFunction) => any) =>
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await fn(req, res, next);
        } catch (error: any) {
            res.status(error.statusCode || 500).json({
                success: false,
                message: error.message
            });
        }
    };

// const asyncHandler = (fn) => async (req, res, next) => {
//   try {
//     await fn(req, res, next);
//   } catch (error) {
//     res.status(error.code || 500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };
