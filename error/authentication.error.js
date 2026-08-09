import { StatusCodes } from "http-status-codes";
import CustomError from "./custom.error.js";

class UnAuthenticated extends CustomError{
    constructor(message){
        super(message)
        this.status=StatusCodes.UNAUTHORIZED
    }
}

export default UnAuthenticated