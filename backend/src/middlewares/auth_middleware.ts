import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/user_model";

export const protect = async (req: any, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.accessToken;
    if (!token) return res.status(401).json({ message: "Not authorized" });

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = await User.findById(decoded.id).select("-password");

    next();
  } catch {
    return res.status(401).json({ message: "Access token expired" });
  }
};
