import users from '../models/auth.js'
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import dotenv from "dotenv";
import OTP from '../models/OTP.js'; 
import nodemailer from "nodemailer";
import { upload } from '../config/cloudinary.js';
dotenv.config();

const jwtSecret = process.env.JWT_SECRET;

export const verifyOTP = async (email, otp) => {
    const otpEntry = await OTP.findOne({ 'email': email });

    if (!otpEntry) {
        return false;
    }
    if (otpEntry.otp != otp){
        return false;
    }
    return true;
};

export const validateOTP = async (req, res) => {
    const { email, otp } = req.body;
    console.log(email, otp);
    try {
        const isValid = await verifyOTP(email, otp); // Verify OTP using utility
        if (!isValid) {
            return res.status(400).json({ message: "Invalid OTP." });
        }

        const existingUser = await users.findOne({ email });
        if (!existingUser) {
            return res.status(404).json({ message: "User not found." });
        }

        const token = jwt.sign(
            { email: existingUser.email, id: existingUser._id },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.status(200).json({ result: existingUser, token });
    } catch (error) {
        console.log("Error validating OTP:", error);
        res.status(500).json({ message: "Something went wrong..." });
    }
};

export const sendOTP = async (email) => {
    const otp = Math.floor(100000 + Math.random() * 900000); // Generates a 6-digit number
    console.log(otp);
    const expirationTime = new Date(Date.now() + 5 * 60 * 1000); // OTP expires in 5 minutes

    await OTP.findOneAndUpdate(
        { email }, // Filter: Find OTP by email
        { otp, expiration: expirationTime }, // Update: New OTP and expiration
        { upsert: true, new: true } // Options: Create if not exists, return the new document
    );    

    const transporter = nodemailer.createTransport({
        service: 'gmail', // Or any other email service
        auth: {
            user: process.env.EMAIL_USERNAME, // Your email address
            pass: process.env.EMAIL_PASSWORD, // Your app password
        },
    });

        // Email options
        const mailOptions = {
            from: '29779cseaiml@gmail.com',
            to: email,
            subject: 'Your OTP Code',
            text: `Your OTP code is ${otp}. It will expire in 5 minutes.`,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent');
    return otp;
};

export const logUserLogin = async (userId, deviceInfo) => {
    const { browser, deviceType, os, ipAddress } = deviceInfo;
    try {
        // Create a new login entry
        const loginEntry = {
            browser,
            os,
            deviceType,
            ipAddress,
            time: new Date(), // Add the current timestamp
        };

        // Find the user and update the loginHistory array
        await users.findByIdAndUpdate(
            userId,
            { $push: { loginHistory: loginEntry } }, // Append the new login entry to the array
            { new: true, upsert: true } // Return updated document, create if not exists
        );
        console.log('Login history recorded successfully.');
    } catch (error) {
        console.log('Error logging user login:', error);
    }
};

export const login = async (req, res) => {
    const { email, password, deviceType, browser, os, ipAddress } = req.body;
    const deviceInfo = {'deviceType' : deviceType, 'browser': browser, 'os': os, 'ipAddress':ipAddress};
    try {
        if (!email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const existingUser = await users.findOne({ email });
        if (!existingUser) {
            return res.status(404).json({ message: "User does not exist" });
        }

        const isPasswordCorrect = await bcrypt.compare(password, existingUser.password);
        if (!isPasswordCorrect) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Restrict mobile access based on time
        if (deviceType === 'Mobile') {
            const currentHour = new Date().getHours();
            if (currentHour < 10 || currentHour > 13) {
                return res.status(403).json({ message: "Mobile access is restricted to 10 AM - 1 PM." });
            }
        }

        // Handle Google Chrome (OTP-based login)
        if (browser === 'Chrome') {
            const otp = await sendOTP(email); // Send OTP
            const token = jwt.sign(
                { email: existingUser.email, id: existingUser._id },
                jwtSecret,
                { expiresIn: "1h" }
            );
            await logUserLogin(existingUser._id, deviceInfo); // Log login details
            return res.status(200).json({
                result: existingUser, 
                token, 
                message: "OTP sent to your email.",
                otpRequired: true,
            });
        }

        // Handle Microsoft Edge (no OTP required)
        if (browser === 'Microsoft Edge') {
            const token = jwt.sign(
                { email: existingUser.email, id: existingUser._id },
                jwtSecret,
                { expiresIn: "1h" }
            );

            await logUserLogin(existingUser._id, deviceInfo); // Log login details
            return res.status(200).json({ result: existingUser, token });
        }
        return res.status(400).json({ message: "Unsupported browser/device." });
    } catch (error) {
        console.error("Error in login:", error);
        res.status(500).json({ message: "Something went wrong..." });
    }
};

export const signup = async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const existinguser = await users.findOne({ email });
        if (existinguser) {
            return res.status(404).json({ message: "User already exist" });
        }
        console.log(existinguser);
        const hashedpassword = await bcrypt.hash(password, 12);
        const newuser = await users.create({
            name,
            email,
            password: hashedpassword
        });

        const token = jwt.sign({
            email: newuser.email, id: newuser._id
        }, process.env.JWT_SECRET, { expiresIn: "1h" }
        )
        res.status(200).json({ result: newuser, token });
    } catch (error) {
        res.status(500).json("something went wrong...")
        return
    }
}

export const uploadAvatar = async (req, res) => {
    try {
        const userId = req.userid; // Provided by auth middleware
        const avatarUrl = req.file.path;
        await users.findByIdAndUpdate(userId, { avatar: avatarUrl });
        res.status(200).json({ message: 'Avatar updated successfully', avatar: avatarUrl });
    } catch (error) {
        res.status(500).json({ message: 'Error updating avatar', error });
    }
};

export const setAvatarUrl = async (req, res) => {
    const userId = req.user.id;
    const { avatarUrl } = req.body;
    try {
        await users.findByIdAndUpdate(userId, { avatar: avatarUrl });
        res.status(200).json({ message: 'Avatar URL set successfully', avatar: avatarUrl });
    } catch (error) {
        res.status(500).json({ message: 'Error setting avatar URL', error });
    }
};