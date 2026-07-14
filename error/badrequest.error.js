import { StatusCodes } from "http-status-codes";
import CustomError from "./custom.error.js";

class BadRequest extends CustomError{
    constructor(message){
        super(message)
        this.status=StatusCodes.BAD_REQUEST
    }
}

export default BadRequest