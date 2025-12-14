import z from "zod";
import { envVariables } from "./env";
import { IUser } from "../schema/users/user.schema";

declare global {
  namespace Express {
      interface Request {
        userInfo?: IUser 
      }
      interface Response{
          status: string
      }
  }
}

interface ImportMetaEnv {
  readonly JWT_ACCESS_SECRET: string;
  readonly JWT_REFRESH_SECRET: string;
  readonly WEB_DOMAIN: string;
  readonly GMAIL_APP_NAME: string;
  readonly GMAIL_APP_PASSWORD: string;
  readonly GMAIL_USER: string;
  readonly BUCKET_NAME: string;
  readonly REGION: string;
  readonly ACCESS_KEY: string;
  readonly SECRET_KEY: string;
  readonly STRIP_SECRET: string;
  readonly MONGO_URI: string;
  readonly REDIS_DB_URI: string;
  readonly REDIS_PASSWORD: string;
  readonly REDIS_HOST: string;
  readonly REDIS_PORT: string;
  readonly ZAPIER_WEBHOOK_URL_CREATE_ORDER: string;
  readonly ZAPIER_WEBHOOK_URL_OTP: string;
  readonly ZAPIER_WEBHOOK_URL_ORDER_START_PICKING: string;
  readonly ZAPIER_WEBHOOK_URL_ORDER_STATUS: string;
  readonly ZAPIER_WEBHOOK_URL_Signup_user: string;
  readonly ZAPIER_WEBHOOK_URL_productSuggestUser: string;
  // Add other environment variables here...
}

declare global {
  namespace NodeJS {
    interface ProcessEnv extends z.infer<typeof envVariables> {
      readonly env: ImportMetaEnv;
    }
  }
}