import JWT from "jsonwebtoken";

export const authUser = async (req, res, next) => {
  try {
    const token =
      req.cookies?.token ||
      (req.headers.authorization && req.headers.authorization.split(" ")[1]);

    if (!token) {
      return res.status(401).json({
        error: "Unauthorized User - No Token",
      });
    }

    const decoded = JWT.verify(token, process.env.JWT_SECRET);

    // Attach user to request
    req.user = decoded;

    next();
  } catch (error) {
    console.log("Auth Error:", error.message);

    return res.status(401).json({
      error: "Unauthorized User - Invalid Token",
    });
  }
};
