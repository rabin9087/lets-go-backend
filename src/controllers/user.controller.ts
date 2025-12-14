import { Request, Response, NextFunction } from "express";
import { createUser, getUserByPhoneAndJWT, getUserByPhoneOrEmail, signOutUserByPhoneANDJWT, updateDriverOnlineStatus } from "../schema/users/user.model";
import { IUser } from "../schema/users/user.schema";
import { hashPassword, validatePassword } from "../utils/bcrypt";
import { createAccessJWT, createRefreshJWT, verifyRefreshJWT } from "../utils/jwt";

export const createUserController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
    try {
  
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        status: "error",
        message: "Password is required.",
      });
    }
    // Hash password
    req.body.password = hashPassword(password);

    // Create user in DB
    const newUser: IUser = await createUser(req.body);

    // Do not expose password
    // @ts-ignore
    newUser.password = undefined;

    if (!newUser?._id) {
      return res.status(400).json({
        status: "error",
        message: "Failed to create user.",
      });
    }

    // Generate access token
    // const token = await createAccessJWT(newUser.email as string);

    return res.status(201).json({
      status: "success",
      message: "User created. Please check your email to verify your account.",
      data: newUser,
    });
  } catch (error) {
    return next(error);
  }
};

export const loginUser = async (
  req: Request,
  res: Response, 
  next: NextFunction
) => {
  try {
    const { email_phone, password } = req.body;
    if (!email_phone || !password) throw new Error("Missing credentials.");
    // Find a user with the provided email  address or phone number
    const userDoc = await getUserByPhoneOrEmail(email_phone);
    //if not user found, response not user found with requested email or phone
    if (!userDoc?._id) {
      return res.json({ status: "success", message: `No user found with ${email_phone}` });
    }

    // Verify the password of the user with the one sent in the request body
    const isValidPassword = validatePassword(password, userDoc.password as string);
      if (!isValidPassword) {
      return res
        .status(401)
        .send({ status: "error", message: "Wrong password." });}

        const user = userDoc.toObject() as IUser;

      // If everything goes well, send the token to the client
      const payload = {
          phone: user?.phone,
          email: user?.email as string,
          role: user?.role as string
        }
    const accessJWT = await createAccessJWT(payload);
    const refreshJWT = await createRefreshJWT(payload);
    // todo send jwt tokens to the user
    // Remove fields based on role
    delete user.password;
    if (user.role === "rider") delete user.driverProfile;
    if (user.role === "driver") delete user.riderProfile;
          
    return res.json({
      status: "success",
      message: `Welcome back ${user.name} !`,
      data: {
        user,
        tokens: {
          accessJWT,
          refreshJWT,
          },
      }
    });

  } catch (error) {
    console.log("Server Error from here ")

    next(error);
  }
};

export const logoutUser = async (
  req: Request,
  res: Response, 
  next: NextFunction
) => {
  try {
    const { authorization } = req.headers;
    console.log(authorization)
    // 1. Check if authorization header exists
    if (!authorization) {
      return res.status(401).json({
        status: "error",
        message: "No Authorization provided",
      });
    }
    const token = authorization.startsWith("Bearer ") ? authorization.split(" ")[1] : authorization;

    // 2. Decode the JWT token
    const decoded = verifyRefreshJWT(token);
    if (!decoded || !decoded.phone) {
      return res.status(401).json({
        status: "error",
        message: "Invalid or expired token",
      });
    }

    // 3. Retrieve user by phone and refresh token
    const user = await getUserByPhoneAndJWT({
      phone: decoded.phone,
      refreshJWT: token,
    });

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found or already signed out",
      });
    }

    // 4. Sign out user
    const updatedUser = await signOutUserByPhoneANDJWT(decoded.phone);

    if (updatedUser?._id) {
      return res.json({
        status: "success",
        message: "User signed out successfully",
      });
    }

    return res.status(500).json({
      status: "error",
      message: "Error signing out user",
    });

  } catch (error) {
    next(error);
  }
};
  