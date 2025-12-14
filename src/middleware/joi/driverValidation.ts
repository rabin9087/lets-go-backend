import { Request, Response, NextFunction } from 'express'
import { BOOLEANREQUIRED, COORDINATEREQUIRED, JoiValidationProcess, SORTSTRREQUIRED } from './joiValidation';

export const driverOnlineStatusValidation = (
    req: Request,
  res: Response,
  next: NextFunction
) => {
    const schemaObj = {
        onlineStatus: BOOLEANREQUIRED,
        currentLocation: COORDINATEREQUIRED,
        destination: COORDINATEREQUIRED,
        email_phone: SORTSTRREQUIRED,
        rego: SORTSTRREQUIRED         
    };
    return JoiValidationProcess({ schemaObj, req, res, next });
}