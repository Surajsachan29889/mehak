import express from "express"
import  {validateOTP, login, signup} from '../controller/auth.js';
import { uploadAvatar, setAvatarUrl } from '../controller/auth.js';
import { getallusers,updateprofile } from "../controller/users.js";
import auth from "../middleware/auth.js";
import User from "../models/auth.js"
import { upload } from '../config/cloudinary.js';

const router=express.Router();


// Get notification preference
router.get('/notification-preferences', async (req, res) => {
  try {
      const user = await User.findById(req.userid);
      if (!user) {
          return res.status(404).json({ message: 'User not found' });
      }
      res.json({ notificationsEnabled: user.notificationsEnabled });
  } catch (error) {
      res.status(500).json({ message: 'Server error' });
  }
});

// Update notification preference
router.patch('/notification-preferences', async (req, res) => {
  try {
      const { notificationsEnabled } = req.body;
      const user = await User.findByIdAndUpdate(req.userid, { notificationsEnabled }, { new: true });
      if (!user) {
          return res.status(404).json({ message: 'User not found' });
      }
      res.json({ message: 'Preferences updated successfully' });
  } catch (error) {
      res.status(500).json({ message: 'Server error' });
  }
});

  
router.post("/validate-otp", validateOTP);

router.post("/signup",signup);
router.post("/login",login);

router.get("/getallusers",getallusers)

router.patch("/update/:id",auth,updateprofile)

// Route for uploading avatar

router.post('/upload-avatar', auth, upload.single('avatar'), (req, res, next) => {
  next(); // Move to the next middleware
}, uploadAvatar);

// Route for setting avatar from an external URL
// router.post('/set-avatar-url', auth, setAvatarUrl);

export default router