// express.d.ts
import { Request as ExpressRequest } from "express";

declare global {
    namespace Express {
        interface Request {
           user?: IUser;
        }
    }
}
