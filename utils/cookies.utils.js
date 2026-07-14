import jwt from 'jsonwebtoken'
function createJWT({ payload }) {
    return jwt.sign(payload, process.env.JWT_SECRET)
}
function verifyJWT({token}) {
    return jwt.verify(token, process.env.JWT_SECRET)
}

function attachCookie({ user, refreshToken, res }) {
    const accessToken = createJWT({ payload: user })
    res.cookie("accessToken", accessToken, { maxAge: 1000*60*15 , secure: process.env.NODE_ENV === 'production', httpOnly: true, signed: true,sameSite:"none" })
    //for 15 min
    const newRefreshToken = createJWT({ payload: { user, refreshToken } })
    res.cookie("refreshToken", newRefreshToken, { maxAge:  1000 * 60 * 60 * 48, secure: process.env.NODE_ENV === 'production', httpOnly: true,sameSite:"none" , signed: true })
    //48 hr  
}
function removeCookie({ res }) {
    res.clearCookie("accessToken", { secure: process.env.NODE_ENV === 'production', httpOnly: true, signed: true })
    res.clearCookie("refreshToken", { secure: process.env.NODE_ENV === 'production', httpOnly: true, signed: true })
}

export { attachCookie, removeCookie, verifyJWT }