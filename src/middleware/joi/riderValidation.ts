import { Request, Response, NextFunction } from 'express'
import { COORDINATEREQUIRED, JoiValidationProcess, NUMBERREQUIRED, SORTSTRREQUIRED } from './joiValidation';



export const rideByRegoRequestValidation = (
    req: Request,
  res: Response,
  next: NextFunction
) => {
    const schemaObj = {
        regoPhone: SORTSTRREQUIRED
        
    };
    return JoiValidationProcess({ schemaObj, req, res, next });
}

export const rideRequestValidation = (
    req: Request,
  res: Response,
  next: NextFunction
) => {
    const schemaObj = {
        pickupLocation: COORDINATEREQUIRED,
      dropoffLocation: COORDINATEREQUIRED,
    //   polyline,
      riderId: COORDINATEREQUIRED,
      distance: COORDINATEREQUIRED,
      price: NUMBERREQUIRED,
      status: SORTSTRREQUIRED, //"requested", "ontrip", "cancelled", "completed"
      paymentStatus: SORTSTRREQUIRED,
        
    };
    return JoiValidationProcess({ schemaObj, req, res, next });
}