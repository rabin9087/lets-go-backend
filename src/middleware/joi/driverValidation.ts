import { Request, Response, NextFunction } from 'express'
import { BOOLEANREQUIRED, COORDINATEREQUIRED, JoiValidationProcess, NUMBERREQUIRED, SORTSTRREQUIRED } from './joiValidation';

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
        rego: SORTSTRREQUIRED,
        seatAvailable: NUMBERREQUIRED
    };
    return JoiValidationProcess({ schemaObj, req, res, next });
}