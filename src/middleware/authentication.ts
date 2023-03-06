import jwt from "jsonwebtoken";

const jwtSecret = process.env.JWT_SECRET || "";
const jwtAccess = process.env.JWT_ACCESS || "";
const jwtIat = process.env.JWT_IAT || "";

/**
 * this is a lazy way of doing authentication
 * since there is only one caller for this backend
 */

export default function (req: IRequest, res: IResponse, next: INextFunction) {
  const authHeader = req.headers["authorization"];

  if (!jwtSecret || !jwtAccess || !jwtIat) {
    console.log("env variables not loaded");
    return next({ status: 500 });
  }

  if (!authHeader) {
    return next({ status: 401 });
  }

  jwt.verify(authHeader, jwtSecret, (err, tokenData) => {
    if (err) {
      console.error(err);
      return next({ status: 500 });
    }

    tokenData = <IJwtPayload>tokenData;

    if (tokenData.iat !== Number(jwtIat) ||
      tokenData.access !== jwtAccess ||
      tokenData.cd !== "1") {
      return next({ status: 401 });
    }

    next();
  });
}