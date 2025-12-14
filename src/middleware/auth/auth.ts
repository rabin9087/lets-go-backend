import { NextFunction, Request, Response } from "express";

import { CustomError } from "../../types";
import { IUser } from "../../schema/users/user.schema";
import { createAccessJWT, verifyAccessJWT, verifyRefreshJWT } from "../../utils/jwt";
import { getAllUser, getUserByPhoneAndJWT, getUserByPhoneOrEmail } from "../../schema/users/user.model";
import { CheckUserByToken, findOneByFilterAndDelete } from "../../schema/session/session.model";

type UserWithoutSensitiveData = Omit<IUser, 'password' | 'refreshJWT'>;

export const auth = async (req: Request, res: Response, next: NextFunction) => {
  try {
     // 1. Get access JWT token from the frontend
    const { authorization } = req.headers;
    if (!authorization) {
      return res.status(401).json({
        status: "error",
        message: "Authorization token missing",
      });
    }

    // Extract token from "Bearer <token>" format
    const token = authorization.startsWith("Bearer ") ? authorization.split(" ")[1] : authorization;

    const decoded = verifyAccessJWT(token as string);
    //decoded have three properties one of them being user phone expiry data
    // extrat phone and get get user by email
    if (decoded?.phone) {
      // check if the user is active
      const user = await getUserByPhoneOrEmail(decoded.phone);
      if (user?._id) {
        // user.refreshJWT = undefined;
        user.password = undefined;
          user.refreshJWT = undefined;
        //   user?.driverProfile?.bankDetails = undefined
        req.userInfo = user as IUser;
        return next();
      }
    }

    res.status(401).json({
      status: "error",
      message: "Unauthorized access",
    });
  } catch (error: CustomError | any) {
    if (error.message.includes("jwt expired")) {
      error.statusCode = 403;
      error.message = "Your token has expired. Please login Again";
    }
    if (error.message.includes("invalid signature")) {
      error.statusCode = 401;
      error.message = error.message;
    }
    next(error);
  }
};

export const newAdminSignUpAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
   // 1. Get access JWT token from the frontend
    const { authorization } = req.headers;
    if (!authorization) {
      return res.status(401).json({
        status: "error",
        message: "Authorization token missing",
      });
    }

    // Extract token from "Bearer <token>" format
    const token = authorization.startsWith("Bearer ") ? authorization.split(" ")[1] : authorization;
    const decoded = verifyAccessJWT(token as string);

    if (!decoded?.phone) {
      return res.status(401).json({
        status: "error",
        message: "Unauthorized access",
        decoded,
      });
    }
    const session = await findOneByFilterAndDelete({
      email_phone: decoded.phone!,
      token: token!,
    });

    if (!session) {
      return res.status(401).send({
        status: "error",
        message: "Link expired. Please ask admin for a new link",
      });
    }
    req.body.role = "ADMIN";
    return next();
    
  } catch (error: CustomError | any) {
    if (error.message.includes("jwt expired")) {
      error.statusCode = 403;
      error.message = "Your token has expired. Please login Again";
    }
    if (error.message.includes("invalid signature")) {
      error.statusCode = 401;
      error.message = error.message;
    }
    next(error);
  }
};

export const adminAccess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { authorization } = req.headers;

    if (!authorization) {
      return res.status(401).json({
        status: "error",
        message: "Authorization token missing",
      });
    }

    const token = authorization.startsWith("Bearer ") ? authorization.split(" ")[1] : authorization;

    const decoded = verifyAccessJWT(token);

    if (decoded?.phone) {
      const user = await getUserByPhoneOrEmail(decoded.phone);
      if (user?.role === "admin") {
        return next();
      }
    }

    res.status(403).json({
      status: "error",
      message: "Forbidden: Only admin can access this resource.",
    });
  } catch (error: any) {
    if (error.message.includes("jwt expired")) {
      error.statusCode = 403;
      error.message = "Your token has expired. Please login again.";
    }
    if (error.message.includes("invalid signature")) {
      error.statusCode = 401;
      error.message = "Invalid token signature.";
    }
    next(error);
  }
};

export const superAdminAccess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 1. Get access JWT token from the frontend
    const { authorization } = req.headers;
    if (!authorization) {
      return res.status(401).json({
        status: "error",
        message: "Authorization token missing",
      });
    }

    // Extract token from "Bearer <token>" format
    const token = authorization.startsWith("Bearer ") ? authorization.split(" ")[1] : authorization;

    // 2. Decode the JWT to verify if it's valid and not expired
    const decoded = verifyAccessJWT(token);
    
    if (decoded?.phone) {
      // 3. Check if the user exists by phone number and verify role
      const user = await getUserByPhoneOrEmail(decoded.phone);
      if (user?.role === "superadmin") {
        return next();
      }
    }

    // If not an admin, unauthorized access
    res.status(403).json({
      status: "error",
      message: "Forbidden: Only admin can access this resource.",
    });
  } catch (error: any) {
    if (error.message.includes("jwt expired")) {
      error.statusCode = 403;
      error.message = "Your token has expired. Please login again.";
    }
    if (error.message.includes("invalid signature")) {
      error.statusCode = 401;
      error.message = "Invalid token signature.";
    }
    next(error);
  }
};

export const driverAccess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 1. Get access JWT token from the frontend
    const { authorization } = req.headers;
    if (!authorization) {
      return res.status(401).json({
        status: "error",
        message: "Authorization token missing",
      });
    }

    // Extract token from "Bearer <token>" format
    const token = authorization.startsWith("Bearer ") ? authorization.split(" ")[1] : authorization;

    // 2. Decode the JWT to verify if it's valid and not expired
    const decoded = verifyAccessJWT(token);
    
    if (decoded?.phone) {
      // 3. Check if the user exists by phone number and verify role
      const user = await getUserByPhoneOrEmail(decoded.phone);
      if (user?.role === "driver") {
        req.userInfo = user
            return next();
      }
    }

    // If not an admin, unauthorized access
    res.status(403).json({
      status: "error",
      message: "Forbidden: Only admin can access this resource.",
    });
  } catch (error: any) {
    if (error.message.includes("jwt expired")) {
      error.statusCode = 403;
      error.message = "Your token has expired. Please login again.";
    }
    if (error.message.includes("invalid signature")) {
      error.statusCode = 401;
      error.message = "Invalid token signature.";
    }
    next(error);
  }
};

// Picker Access Control
export const riderAccess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 1. Get access JWT token from the frontend
    const { authorization } = req.headers;
    if (!authorization) {
      return res.status(401).json({
        status: "error",
        message: "Authorization token missing",
      });
    }

    // Extract token from "Bearer <token>" format
    const token = authorization.startsWith("Bearer ") ? authorization.split(" ")[1] : authorization;

    // 2. Decode the JWT to verify if it's valid and not expired
    const decoded = verifyAccessJWT(token);
    
    if (decoded?.phone) {
      // 3. Check if the user exists by phone number and verify role
      const user = await getUserByPhoneOrEmail(decoded.phone);
      if (user?.role === "rider") {
        return next();
      }
    }

    // If not an admin or picker, unauthorized access
    res.status(403).json({
      status: "error",
      message: "Forbidden: Only admin or picker can access this resource.",
    });
  } catch (error: any) {
    if (error.message.includes("jwt expired")) {
      error.statusCode = 403;
      error.message = "Your token has expired. Please login again.";
    }
    if (error.message.includes("invalid signature")) {
      error.statusCode = 401;
      error.message = "Invalid token signature.";
    }
    next(error);
  }
};

export const riderDriverAccess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 1. Get access JWT token from the frontend
    const { authorization } = req.headers;
    if (!authorization) {
      return res.status(401).json({
        status: "error",
        message: "Authorization token missing",
      });
    }

    // Extract token from "Bearer <token>" format
    const token = authorization.startsWith("Bearer ") ? authorization.split(" ")[1] : authorization;

    // 2. Decode the JWT to verify if it's valid and not expired
    const decoded = verifyAccessJWT(token);
    
    if (decoded?.phone) {
      // 3. Check if the user exists by phone number and verify role
      const user = await getUserByPhoneOrEmail(decoded.phone);
      if (user?.role === "rider" || user?.role === "driver") {
        return next();
      }
    }

    // If not an admin or picker, unauthorized access
    res.status(403).json({
      status: "error",
      message: "Forbidden: Only admin or picker can access this resource.",
    });
  } catch (error: any) {
    if (error.message.includes("jwt expired")) {
      error.statusCode = 403;
      error.message = "Your token has expired. Please login again.";
    }
    if (error.message.includes("invalid signature")) {
      error.statusCode = 401;
      error.message = "Invalid token signature.";
    }
    next(error);
  }
};

export const refreshAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 1. Get the refreshAuth token
    const { authorization } = req.headers;
    console.log(authorization)
    if (!authorization) {
      return res.status(401).json({ status: "error", message: "No Authorization provided" });
    }

    // Extract token from "Bearer <token>"
    const token = authorization.startsWith("Bearer ") ? authorization.split(" ")[1] : authorization;

    // 2. Try to verify access JWT first
    try {
      const accessDecoded = verifyAccessJWT(token);
      if (accessDecoded?.phone) {
        // 3. Check if user is active
        const userToken = await CheckUserByToken({ email_phone: accessDecoded.phone || accessDecoded.email, token });
        if (userToken?._id) {
          const user = await getUserByPhoneOrEmail(accessDecoded.phone);
          if (user?._id) {
            user.password = undefined; // Remove password from response
            user.refreshJWT = undefined; // Remove password from response
            return res.json({
              status: "success",
              message: "Authorized",
              user,
            });
          }
        }
      }
    } catch (error) {
      console.log("Access JWT verification failed, attempting Refresh JWT...");
    }

    // 3. Verify refresh token
    const decoded = verifyRefreshJWT(token);

    if (decoded?.phone) {
      // 4. Check if user exists with the refresh token
      const user = await getUserByPhoneAndJWT({
        phone: decoded.phone || decoded.email,
        refreshJWT: token,        
      });

      if (user?._id) {
        user.password = undefined; // Remove password before sending response
        // user.cartHistory = undefined; // Remove password before sending response
        // 5. Generate a new access JWT
        const accessJWT = await createAccessJWT({email: user.email  as string, phone: user.phone, role: user.role});
        user.refreshJWT = token
        req.userInfo = user
        
        return res.json({
          status: "success",
          message: "Authorized",
          accessJWT,
          user,
        });
      }
    }

    // If no valid token is found, return unauthorized
    return res.status(401).json({
      status: "error",
      message: "Unauthorized",
    });
  } catch (error: any) {
    next(error);
  }
};