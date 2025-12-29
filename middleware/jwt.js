const jwt = require("jsonwebtoken");
require("dotenv").config();

const verifyJWT = async (req, res, next) => {
  try {

    const incomingToken = req.headers.token;

    if (!incomingToken) {
      return res.send({
        statusCode: 401,
        success: false,
        message: "Token Missing",
        result: {},
      });
    }

    const decodedToken = jwt.decode(incomingToken, process.env.JWT_SECRET_KEY);

    if (!decodedToken) {
      return res.send({
        statusCode: 401,
        success: false,
        message: "Invalid token",
        result: {},
      });
    }

    req.token = decodedToken;

    return next();
  } catch (error) {
    console.error(error);
    return res.send({
      statusCode: 500,
      success: false,
      message: error.message || "Internal Server Error",
      result: {},
    });
  }
};

const generateAuthJwt = async (payload) => {
  const { expires_in, ...params } = payload;
  const token = jwt.sign(params, process.env.JWT_SECRET_KEY, { expiresIn: expires_in });

  if (!token) {
    return false;
  }
  return token;
};

module.exports = { verifyJWT, generateAuthJwt };
