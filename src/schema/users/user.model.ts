import mongoose from "mongoose";
import userSchema, { IUser } from "./user.schema";

export const createUser = (userObj: IUser) => {
  return new userSchema(userObj).save();
};

export const UpdateUserRefreshJWTByPhone = ({phone, refreshJWT}: {phone: string, refreshJWT: string}) => {
    return userSchema.findOneAndUpdate({ phone }, {refreshJWT}, { new: true });
}

export const getAllUser = () => {
  return userSchema.find();
};

export const getUserByPhoneOrEmail = async (email_phone: string) => {
  return await userSchema
    .findOne({ $or: [{ email: email_phone }, { phone: email_phone }] }).populate("currentTrip")
};

export const UpdateUserByPhone = (phone: string, data: { refreshJWT?: string } & Record<string, any>) => {
  const updateQuery: Record<string, any> = { $set: { ...data } };

  if (data.refreshJWT) {
    updateQuery.$push = { refreshJWT: data.refreshJWT }; // Push new JWT instead of replacing it
    delete updateQuery.$set.refreshJWT; // Remove from $set to avoid overwriting
  }
  return userSchema.findOneAndUpdate({ phone }, updateQuery, { new: true });
};

export const signOutUserByPhoneANDJWT = (phone: string ) => {
  // const updateQuery: Record<string, any> = { $set: { ...data } };

  // if (data.refreshJWT) {
  //   updateQuery.$pull = { refreshJWT: data.refreshJWT }; // Remove specific JWT from the array
  //   delete updateQuery.$set.refreshJWT; // Ensure it is not set in $set
  // }

  return userSchema.findOneAndUpdate({ phone },{refreshJWT: ""},  { new: true });
};

export const UpdateUserCartHistoryByPhone = (
  phone: string,
  data: { items: any[] },
  amount: number,
  orderNumber: number,
  paymentStatus: string,
  deliveryStatus: string
) => {
  return userSchema.findOneAndUpdate(
    { phone },
    { 
      $push: { 
        cartHistory: { 
          $each: [{ items: data.items, amount, purchasedAt: new Date() , orderNumber, paymentStatus, deliveryStatus}], 
          $position: 0 // Inserts at index 0
        } 
      } 
    },
    { new: true, upsert: true }
  );
};

export const getUserByPhoneAndJWT = async ({
  phone,
  refreshJWT,
}: {
  phone: string;
  refreshJWT: string;
}) => {
  return userSchema.findOne({
    phone,
    refreshJWT, // Check if refreshJWT exists in the array
  }).populate("currentTrip")
    // .populate("cartHistory.items.productId"); // Path to populate cartHistory items;
};

export const findADriverBylocation = (pickup: {lan: string, long: string}, dropUp: {lan: string, long: string}) => {
    return 
}

export const updateDriverOnlineStatus = async (
  driverId: string,
  isOnline: boolean
) => {
  return await userSchema.findOneAndUpdate(
    { phone: driverId },
    {
      $set: {
        "driverProfile.isOnline": isOnline,
      },
    },
    { new: true }
  ).select({_id: 1, "driverProfile.isOnline": 1});
};

export const addNewTripToUser = async ({_id, currentTrip }: {_id: mongoose.Types.ObjectId, currentTrip: mongoose.Types.ObjectId | null}) => {
  const update: any = {
    $set: { currentTrip },
  };

  // ✅ Only push if currentTrip is NOT null
  if (currentTrip) {
    update.$push = {
      trips: {
        $each: [currentTrip],
        $position: 0, // 👈 push at FIRST position
      },
    };
  }

  return await userSchema.findByIdAndUpdate(_id, update, {
    new: true,
  });
};