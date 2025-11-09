import { Request, Response } from "express";
import {
  createUser,
  forgetUserPassword,
  login,
  resetPassword,
  resetPasswordService,
} from "../services/auth_service";
import User from "../models/user_model";
import { generateAccessToken } from "../utils/jwt";
import jwt from "jsonwebtoken";

export const registerUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required." });
    }

    const user = await createUser({ name, email, password });

    return res
      .status(201)
      .json({ success: true, message: "Account created successfully", user });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};
export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required." });
    }
    const { user, accessToken, refreshToken } = await login({
      email,
      password,
    });

    // Access Token Cookie
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    // Refresh Token Cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return res
      .status(200)
      .json({ success: true, message: "Login success", user });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};
export const refreshAccessToken = async (req: any, res: Response) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) return res.status(401).json({ message: "No token" });

    const decoded: any = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET!
    );

    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const newAccessToken = generateAccessToken(user.id);

    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      maxAge: 15 * 60 * 1000,
    });

    return res.json({ success: true, message: "Access token refreshed" });
  } catch {
    return res.status(401).json({ message: "Expired refresh token" });
  }
};
export const logoutUser = async (req: any, res: Response) => {
  await User.findByIdAndUpdate(req.user._id, { refreshToken: "" });

  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");

  return res
    .status(200)
    .json({ success: true, message: "Logged out successfully" });
};

export const resetUserPassword = async (req: any, res: Response) => {
  try {
    const { password, newpassword } = req.body;
    const userId = req.user.id;

    if (!password || !newpassword) {
      return res
        .status(400)
        .json({ success: false, message: "Both fields are required." });
    }

    await resetPassword({ userId, password, newpassword });

    return res.status(200).json({
      success: true,
      message: "Password updated successfully.",
    });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const forgetPassword = async (req: any, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required." });
    }

    await forgetUserPassword({ email });

    return res.status(200).json({
      success: true,
      message: "Reset link sent to your email.",
    });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const resetforgetPassword = async (req: Request, res: Response) => {
  try {
    const { newPassword } = req.body;
    const { token } = req.params;
    if (!newPassword || !token) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required." });
    }

    const result = await resetPasswordService({ token, newPassword });

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};
