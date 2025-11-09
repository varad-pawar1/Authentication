import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  resetUserPassword,
  forgetPassword,
  resetforgetPassword,
} from "../controllers/auth_controller";
import { protect } from "../middlewares/auth_middleware";

const router = Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/refresh", refreshAccessToken);
router.post("/forgetpassword", forgetPassword);
router.post("/reset-password/:token", resetforgetPassword);

router.post("/logout", protect, logoutUser);
router.post("/reset", protect, resetUserPassword);
router.get("/me", protect, (req: any, res: any) => {
  return res.json({ user: req.user });
});

export default router;
