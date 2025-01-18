import jwt from "jsonwebtoken"

const User=(req,res,next)=>{
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Authorization header missing or invalid" });
        }
        const token =req.headers.authorization.split(" ")[1];
        let decodedata=jwt.verify(token,process.env.JWT_SECRET)
        req.userid=decodedata?.id;
        next();
    } catch (error) {
        console.log('auth middleware',error);
    }
}
export default User;