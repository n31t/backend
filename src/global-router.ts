import { Router } from 'express';
import apartmentRouter from './apartment/apartment.router';
import authRouter from './auth/auth-router';
import userRouter from './profile/user-router';

// other routers can be imported here

const globalRouter = Router();

// Use the userRouter for user-related routes
globalRouter.use(authRouter);
globalRouter.use('/users', userRouter)
globalRouter.use('/apartments', apartmentRouter);


// other routers can be added here

export default globalRouter;
