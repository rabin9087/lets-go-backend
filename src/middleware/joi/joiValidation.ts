import Joi, {Schema} from "joi"

export const SORTSTR = Joi.string().allow("", null)
export const SORTSTRREQUIRED = Joi.string().max(200).required()
export const LONGSTR = Joi.string().max(500).required().allow("", null)
export const LONGSTRREQUIRED = Joi.string().max(5000).required()
export const NUMBER = Joi.number().required().allow("", null)
export const NUMBERREQUIRED = Joi.number().required()
export const EMAIL = Joi.string().lowercase().email({ minDomainSegments: 2 }).allow("", null)
export const EMAILREQUIRED = Joi.string().lowercase().email({ minDomainSegments: 2 }).required()
export const PHONE = Joi.string().allow("", null)
export const PHONEREQUIRED = Joi.string().allow("", null)
export const PASSWORDREQUIRED = Joi.string().min(5).required()
export const BOOLEANREQUIRED = Joi.boolean().required()
export const DATE = Joi.date().allow("", null)
export const DATEREQUIRED = Joi.date().required()
// pattern(new RegExp('^[a-zA-Z0-9]{3,30}$'));

export const COORDINATEREQUIRED = Joi.object({
    latitude: Joi.number().required(), longitude: Joi.number().required()
}).required()


import { Request, Response, NextFunction } from 'express'

export type IJoiValidationProcess = {
    schemaObj: Record<string, Schema>,
    req: Request,
    res: Response,
    next: NextFunction
}

export const JoiValidationProcess = ({ schemaObj, req, res, next }: IJoiValidationProcess ) => {
    try {
        //all the schema model will be obtained in schemaObj
        const schema = Joi.object(schemaObj)
        //error validation 
        const { error } = schema.validate(req.body)
        if (error) {
            return res.json({
                status: "error",
                message: error.message
            })
        }
        //if there is not any error then req will be sent into next middleware
        next()

    } catch (error) {
        console.log(error)
        next(error)
    }
}

export const AuthHeaderSchema = Joi.object({
  authorization: Joi.string()
    .pattern(/^Bearer\s+[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/)
    .required()
    .messages({
      "string.empty": "Authorization header is required.",
      "string.pattern.base": "Invalid Authorization token format. Expected: Bearer <token>",
    }),
}).unknown(true); // allow other headers