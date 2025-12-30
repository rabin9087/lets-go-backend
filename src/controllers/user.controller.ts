import { Request, Response, NextFunction } from "express";
import { createUser, getUserByPhoneAndJWT, getUserByPhoneOrEmail, signOutUserByPhoneANDJWT, updateDriverOnlineStatus } from "../schema/users/user.model";
import userSchema, { IUser } from "../schema/users/user.schema";
import { hashPassword, validatePassword } from "../utils/bcrypt";
import { createAccessJWT, createRefreshJWT, verifyRefreshJWT } from "../utils/jwt";

export const createUserController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {

   const {name, email, phone,password, role, status, vehicleRego, licenceNumber, vehicleType} = req.body
    // Validate required fields
    if (!name || !phone) {
      return res.status(400).json({
        status: "error",
        message: "Name and phone are required.",
      });
    }

    if (!password) {
      return res.status(400).json({
        status: "error",
        message: "Password is required.",
      });
    }

    // Hash password
    const hashedPassword = hashPassword(password);

    // Build user object dynamically
    const newUserObj: Partial<IUser> = {
      name,
      email,
      phone,
      password: hashedPassword,
      role: role as IUser["role"],
      status: status as IUser["status"],
    };

    // Optional driver fields
    if (role === "driver") {
      newUserObj.driverProfile = {
        vehicle: {
          rego: vehicleRego,
          model: vehicleType?.model,
          color: vehicleType?.color,
          year: vehicleType?.year,
          photos: vehicleType?.photos || [],
        },
      };
    }

    // Create user in DB
    const newUser: IUser = await createUser(newUserObj);

    // Remove sensitive info
    newUser.password = undefined;

    return res.status(201).json({
      status: "success",
      message: "User created successfully. Please check your email to verify your account.",
      data: newUser,
    });
  } catch (error: any) {
    // Handle duplicate key error (email/phone)
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyValue)[0];
      return res.status(400).json({
        status: "error",
        message: `${duplicateField} already exists.`,
      });
    }
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
        .send({ status: "error", message: "Wrong password." });
    }

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
    delete user.refreshJWT;
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


export const addAddressController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { address, coords, label } = req.body;
console.log(address, coords, label)
    if (!address || !coords?.latitude || !coords?.longitude || !label) {
      return res.status(400).json({
        status: "error",
        message: "Label, address, and coordinates are required",
      });
    }

    const updatedUser = await userSchema.findByIdAndUpdate(
      req.userInfo?._id,
      {
        $push: {
          savedLocations: {
            label,
            coordinates: {
              latitude: coords.latitude,
              longitude: coords.longitude,
            },
            address
          },
        },
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Address added successfully",
      data: updatedUser.savedLocations,
    });
  } catch (error) {
    next(error);
  }
};

export const registerPushNotificationToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => { 
  const { pushToken } = req.body;
  if (!req.userInfo?._id || !pushToken) {
    return res.status(400).json({ message: 'Missing data' });
  }

  try {
    await userSchema.findByIdAndUpdate(req.userInfo?._id , { pushToken }, { new: true });
    res.json({ status: 'success', message: 'Token stored' });
  } catch (err) {
    console.error(err);
   next(err)
  }
}