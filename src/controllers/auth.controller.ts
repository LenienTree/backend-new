import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { sendSuccess, sendCreated } from '../utils/apiResponse';
import { AuthRequest } from '../types';

export class AuthController {
    register = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await authService.register(req.body);
            
            // Calculate cookie expiration to match JWT expiration
            const accessTokenExpiry = 7 * 24 * 60 * 60 * 1000; // 7 days to match JWT_EXPIRES_IN
            const refreshTokenExpiry = 30 * 24 * 60 * 60 * 1000; // 30 days to match JWT_REFRESH_EXPIRES_IN
            
            console.log('Setting cookies during registration');
            console.log('Access token:', result.accessToken ? 'generated' : 'missing');
            console.log('Refresh token:', result.refreshToken ? 'generated' : 'missing');
            
            // Set HTTP-only cookies for tokens
            res.cookie('accessToken', result.accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: accessTokenExpiry,
                path: '/'
            });
            
            res.cookie('refreshToken', result.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: refreshTokenExpiry,
                path: '/'
            });
            
            console.log('Cookies set successfully');
            
            // For testing: include tokens in response body (remove in production)
            sendCreated(res, result, 'Registration successful! Please verify your email.');
        } catch (err) {
            console.log('Registration error:', err);
            next(err);
        }
    };

    login = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { email, password } = req.body;
            const result = await authService.login(email, password);
            
            // Calculate cookie expiration to match JWT expiration
            const accessTokenExpiry = 7 * 24 * 60 * 60 * 1000; // 7 days to match JWT_EXPIRES_IN
            const refreshTokenExpiry = 30 * 24 * 60 * 60 * 1000; // 30 days to match JWT_REFRESH_EXPIRES_IN
            
            // Set HTTP-only cookies for tokens
            res.cookie('accessToken', result.accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: accessTokenExpiry,
                path: '/'
            });
            
            res.cookie('refreshToken', result.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: refreshTokenExpiry,
                path: '/'
            });
            
            // For testing: include tokens in response body (remove in production)
            sendSuccess(res, result, 'Login successful');
        } catch (err) {
            next(err);
        }
    };

    googleAuth = async (req: Request, res: Response, next: NextFunction) => {
        try {
            // In production: verify idToken with Google SDK, extract payload
            // Here we accept the decoded payload directly (verify on your end)
            const { idToken } = req.body;
            // TODO: verify with google-auth-library in production
            // For now — placeholder structure
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
            
            // Calculate cookie expiration to match JWT expiration
            const accessTokenExpiry = 7 * 24 * 60 * 60 * 1000; // 7 days to match JWT_EXPIRES_IN
            const refreshTokenExpiry = 30 * 24 * 60 * 60 * 1000; // 30 days to match JWT_REFRESH_EXPIRES_IN
            
            // Set HTTP-only cookies for tokens
            res.cookie('accessToken', result.accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: accessTokenExpiry,
                path: '/'
            });
            
            res.cookie('refreshToken', result.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: refreshTokenExpiry,
                path: '/'
            });
            
            // Remove tokens from response body for security
            const { accessToken, refreshToken, ...responseWithoutTokens } = result;
            sendSuccess(res, responseWithoutTokens, 'Google login successful');
        } catch (err) {
            next(err);
        }
    };

    refreshToken = async (req: Request, res: Response, next: NextFunction) => {
        try {
            // Try to get refresh token from cookies first, then from request body
            const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
            
            if (!refreshToken) {
                throw new Error('No refresh token provided');
            }
            
            const result = await authService.refreshTokens(refreshToken);
            
            // Calculate cookie expiration to match JWT expiration
            const accessTokenExpiry = 7 * 24 * 60 * 60 * 1000; // 7 days to match JWT_EXPIRES_IN
            const refreshTokenExpiry = 30 * 24 * 60 * 60 * 1000; // 30 days to match JWT_REFRESH_EXPIRES_IN
            
            // Set HTTP-only cookies for new tokens
            res.cookie('accessToken', result.accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: accessTokenExpiry,
                path: '/'
            });
            
            res.cookie('refreshToken', result.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: refreshTokenExpiry,
                path: '/'
            });
            
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
            // Clear cookies
            res.cookie('accessToken', '', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                expires: new Date(0),
                path: '/'
            });
            
            res.cookie('refreshToken', '', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                expires: new Date(0),
                path: '/'
            });
            
            sendSuccess(res, null, 'Logout successful');
        } catch (err) {
            next(err);
        }
    };
}

export const authController = new AuthController();
