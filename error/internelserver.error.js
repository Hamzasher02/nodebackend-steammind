import { StatusCodes } from "http-status-codes";
import CustomError from "./custom.error.js";

class InternalServerError extends CustomError{
    constructor(message){
        super(message)
        this.status=StatusCodes.INTERNAL_SERVER_ERROR
    }
}

export default InternalServerError