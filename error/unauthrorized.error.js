import { StatusCodes } from "http-status-codes";
import CustomError from "./custom.error.js";

class Unauthorized extends CustomError{
    constructor(message){
        super(message)
        this.status=StatusCodes.FORBIDDEN
    }
}

export default Unauthorized