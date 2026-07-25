// Imports the jsonwebtoken package to handle JWT tokens
import jwt from "jsonwebtoken";

// Middleware to authenticate requests using JWT tokens
export const auth = (req, res, next) => {
    // Gets the token from the Authorization header
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token){
        // If there is no token, responds with an access denied error
        return res.status(401).json({ message: req.t("access_denied_no_token") });
    }

    try {
        // Verifies the token using the secret key defined in the environment variables
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Attaches the decoded user info to the request for later use
        req.user = decoded;
        // Continues to the next middleware or controller
        next();
    }catch (error){
        // If the token is invalid, responds with an invalid token error
        res.status(401).json({ message: req.t("invalid_token") });
    }
};