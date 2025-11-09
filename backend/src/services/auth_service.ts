import User from "../models/user_model";
import {
  generateAccessToken,
  generateFogetPasswordToken,
  generateRefreshToken,
} from "../utils/jwt";
import { sendResetLinkEmail } from "../utils/nodemailer";

export const createUser = async ({ name, email, password }: any) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) throw new Error("Email already exists");

  const user = await User.create({
    name,
    email,
    password,
    providers: ["email"],
  });

  return { name: user.name, email: user.email };
};

export const login = async ({ email, password }: any) => {
  const user = await User.findOne({ email });
  if (!user) throw new Error("User not found.");

  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw new Error("Incorrect credentials.");

  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken(user.id);

  user.refreshToken = refreshToken;
  await user.save();

  return {
    user: { name: user.name, email: user.email },
    accessToken,
    refreshToken,
  };
};

export const resetPassword = async ({ userId, password, newpassword }: any) => {
  const user = await User.findById(userId);

  if (!user) throw new Error("User not found.");

  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw new Error("Current password is incorrect.");

  user.password = newpassword;
  await user.save();

  return {
    user: { name: user.name, email: user.email },
  };
};

export const forgetUserPassword = async ({ email }: any) => {
  const user = await User.findOne({ email });
  if (!user) throw new Error("User not found.");

  const resetToken = generateFogetPasswordToken(user.id);
  user.resetToken = resetToken;
  user.resetTokenExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  await user.save();
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
  await sendResetLinkEmail({ to: user.email, resetUrl });
  return { message: "Reset link sent to your email." };
};

export const resetPasswordService = async ({ token, newPassword }: any) => {
  const user = await User.findOne({
    resetToken: token,
    resetTokenExpiry: { $gt: Date.now() },
  });

  if (!user) {
    throw new Error("Invalid or expired reset token.");
  }
  user.password = newPassword;
  user.resetToken = undefined;
  user.resetTokenExpiry = undefined;

  await user.save();

  return { message: "Password reset successful. Please login now." };
};
