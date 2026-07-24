import jwt from 'jsonwebtoken';
import { config } from '../config/config';
import { JwtPayload } from '../types';

// Pin the signing algorithm on both sign and verify. Without an explicit
// `algorithms` allow-list, jsonwebtoken will accept any algorithm the token
// header claims — the classic algorithm-confusion / "alg: none" foot-gun.
const ALG: jwt.Algorithm = 'HS256';

export const generateAccessToken = (payload: JwtPayload): string => {
    return jwt.sign(payload, config.jwt.secret, {
        algorithm: ALG,
        expiresIn: config.jwt.expiresIn as jwt.SignOptions['expiresIn'],
    });
};

export const generateRefreshToken = (payload: JwtPayload): string => {
    return jwt.sign(payload, config.jwt.refreshSecret, {
        algorithm: ALG,
        expiresIn: config.jwt.refreshExpiresIn as jwt.SignOptions['expiresIn'],
    });
};

export const verifyAccessToken = (token: string): JwtPayload => {
    return jwt.verify(token, config.jwt.secret, { algorithms: [ALG] }) as JwtPayload;
};

export const verifyRefreshToken = (token: string): JwtPayload => {
    return jwt.verify(token, config.jwt.refreshSecret, { algorithms: [ALG] }) as JwtPayload;
};
