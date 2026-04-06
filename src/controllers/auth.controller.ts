import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { sendSuccess, sendCreated } from '../utils/apiResponse';
import { AuthRequest } from '../types';

const isProduction = process.env.NODE_ENV === 'production';

// Cross-site cookies REQUIRE sameSite: 'none' + secure: true.
// 'strict' blocks cookies entirely when frontend and backend are on different domains.
const cookieOptions = {
    httpOnly: true,
    secure: isProduction,          // must be true when sameSite is 'none'
    sameSite: (isProduction ? 'none' : 'lax') as 'none' | 'lax',
    path: '/',
};

const ACCESS_TOKEN_MAX_AGE  = 7  * 24 * 60 * 60 * 1000; // 7 days
const REFRESH_TOKEN_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days

function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
    res.cookie('accessToken',  accessToken,  { ...cookieOptions, maxAge: ACCESS_TOKEN_MAX_AGE  });
    res.cookie('refreshToken', refreshToken, { ...cookieOptions, maxAge: REFRESH_TOKEN_MAX_AGE });
}

function clearAuthCookies(res: Response) {
    res.cookie('accessToken',  '', { ...cookieOptions, expires: new Date(0) });
    res.cookie('refreshToken', '', { ...cookieOptions, expires: new Date(0) });
}

export class AuthController {
    register = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await authService.register(req.body);
            setAuthCookies(res, result.accessToken, result.refreshToken);
            sendCreated(res, result, 'Registration successful! Please verify your email.');
        } catch (err) {
            console.error('Registration error:', err);
            next(err);
        }
    };

    login = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { email, password } = req.body;
            const result = await authService.login(email, password);
            setAuthCookies(res, result.accessToken, result.refreshToken);
            sendSuccess(res, result, 'Login successful');
        } catch (err) {
            next(err);
        }
    };

    googleAuth = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { idToken } = req.body;
            const { OAuth2Client } = require('google-auth-library');
            const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

            const ticket = await client.verifyIdToken({
                idToken,
                audience: process.env.GOOGLE_CLIENT_ID,
            });
            const payload = ticket.getPayload();

            const result = await authService.googleAuth(
                payload.sub,
                payload.email,
                payload.name,
                payload.picture
            );

            setAuthCookies(res, result.accessToken, result.refreshToken);

            // Do NOT expose tokens in body — they're in httpOnly cookies
            const { accessToken, refreshToken, ...responseWithoutTokens } = result;
            sendSuccess(res, responseWithoutTokens, 'Google login successful');
        } catch (err) {
            next(err);
        }
    };

    refreshToken = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

            if (!refreshToken) {
                throw new Error('No refresh token provided');
            }

            const result = await authService.refreshTokens(refreshToken);
            setAuthCookies(res, result.accessToken, result.refreshToken);
            sendSuccess(res, null, 'Token refreshed');
        } catch (err) {
            next(err);
        }
    };

    forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
        try {
            await authService.forgotPassword(req.body.email);
            sendSuccess(
                res,
                null,
                'If an account exists, a password reset email has been sent.'
            );
        } catch (err) {
            next(err);
        }
    };

    resetPassword = async (req: Request, res: Response, next: NextFunction) => {
        try {
            await authService.resetPassword(req.body.token, req.body.password);
            sendSuccess(res, null, 'Password reset successfully. Please log in.');
        } catch (err) {
            next(err);
        }
    };

    verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
        try {
            await authService.verifyEmail(req.query.token as string);
            sendSuccess(res, null, 'Email verified successfully!');
        } catch (err) {
            next(err);
        }
    };

    getMe = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            sendSuccess(res, req.user, 'Authenticated user');
        } catch (err) {
            next(err);
        }
    };

    logout = async (req: Request, res: Response, next: NextFunction) => {
        try {
            clearAuthCookies(res);
            sendSuccess(res, null, 'Logout successful');
        } catch (err) {
            next(err);
        }
    };
}

export const authController = new AuthController();
