// import
import jwt from "jsonwebtoken";
import { UpdateUserRefreshJWTByPhone } from "../schema/users/user.model";
import { insertNewSession } from "../schema/session/session.model";


export type jwtReturnType = {
      role: string,
      phone: string,
      email: string,
}; 

export const createAccessJWT = async ({phone, role, email}: jwtReturnType) => {
  try {
    const secret = process.env.JWT_ACCESS_SECRET
        const token = jwt.sign({ phone, email, role }, secret as string, {
            expiresIn: "30d",
        });
        await insertNewSession({ token, email_phone: phone });
        return token;
    } catch (error: Error | any) {
        throw new Error(error.message);
    }
}

export const verifyAccessJWT = (token: string): jwtReturnType | null => {
  try {
    const secret = process.env.JWT_ACCESS_SECRET;
    if (!secret) throw new Error("JWT_ACCESS_SECRET is missing");

    return jwt.verify(token, secret) as jwtReturnType;
  } catch (error) {
    console.error("Access Token Verification Failed:", error);
    return null; // <-- safer for your controllers
  }
};
//// create refreshJWT and store with user data in user table: long live 30d

export const createRefreshJWT = async ({phone, role, email}: jwtReturnType): Promise<string> => {
  ///expires every 30days
  const refreshJWT = jwt.sign(
    { phone, email, role },
    process.env.JWT_REFRESH_SECRET as string,
    {
      expiresIn: "30d",
    }
  );

  await UpdateUserRefreshJWTByPhone({phone, refreshJWT });
  return refreshJWT;
};

export const verifyRefreshJWT = (token: string): jwtReturnType | null => {
  try {
    const secret = process.env.JWT_REFRESH_SECRET;
    if (!secret) throw new Error("JWT_REFRESH_SECRET is missing");

    return jwt.verify(token, secret) as jwtReturnType;
  } catch (error) {
    console.error("Refresh Token Verification Failed:", error);
    return null;
  }
};