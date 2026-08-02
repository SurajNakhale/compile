import {type Response } from "express";

export function successResponse(res: Response, statusCode: number, data?: unknown){
    return res.status(statusCode).json({
        data
    })
}
export function errorResponse(res: Response, statusCode: number, err?: unknown){
    return res.status(statusCode).json({
        err
    })
}

