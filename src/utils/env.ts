import { z } from "zod";

export const envVariables = z.object({
  MONGO_URI: z.string(),
  REDIS_DB_URI: z.string(),
  REDIS_PASSWORD: z.string(),
  REDIS_HOST: z.string(),
  REDIS_PORT: z.string(),
  JWT_ACCESS_SECRET: z.string(),
  JWT_REFRESH_SECRET: z.string(),
  GMAIL_APP_PASSWORD: z.string(),
  GMAIL_USER: z.string(),
  WEB_DOMAIN: z.string(),
  BUCKET_NAME: z.string(),
  REGION: z.string(),
  ACCESS_KEY: z.string(),
  SECRET_KEY: z.string(),
  STRIP_SECRET: z.string(),
  ZAPIER_WEBHOOK_URL_CREATE_ORDER: z.string(),
  ZAPIER_WEBHOOK_URL_OTP: z.string(),
  ZAPIER_WEBHOOK_URL_ORDER_START_PICKING: z.string(),
  ZAPIER_WEBHOOK_URL_ORDER_PACKED: z.string(),
  ZAPIER_WEBHOOK_URL_Signup_user: z.string(),
  ZAPIER_WEBHOOK_URL_productSuggestUser: z.string(),
});

