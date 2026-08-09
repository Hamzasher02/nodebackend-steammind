import {StatusCodes} from 'http-status-codes'

function routeNotFoundMiddleware(req,res){
    res.status(StatusCodes.NOT_FOUND).json({
        success:false,
        message:'Route not found',
        data:{}
    })
}

export default routeNotFoundMiddleware