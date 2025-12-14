import sessionSchema from "./session.schema";

export const insertNewSession = (obj: {
  token: string;
  email_phone?: string;
}) => {
  return new sessionSchema(obj).save();
};

export const findOneByTokenAndEmail = (token: string, email: string) => {
  return sessionSchema.findOne({ token, email_phone: email });
};

export const findOneByFilterAndDelete = (filter: {
  email_phone: string;
  token: string;
}) => {
  return sessionSchema.findOneAndDelete(filter);
};

export const CheckUserByToken = (filter: { email_phone: string; token: string }) => {
  return sessionSchema.findOne(filter);
};
export const findOneAndDelete = (token: { token: string }) => {
  return sessionSchema.findOneAndDelete(token);
};
