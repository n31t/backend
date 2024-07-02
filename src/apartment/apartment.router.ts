import { Router } from "express";
import ApartmentController from "./apartment.controller";
import ApartmentService from "./apartment.service";

const apartmentRouter = Router();
const apartmentService = new ApartmentService();
const apartmentController = new ApartmentController(apartmentService);

apartmentRouter.get('/', apartmentController.getAllApartments);
apartmentRouter.get('/:id', apartmentController.getApartmentById);
apartmentRouter.get('/type/buy', apartmentController.getBuyApartments);
apartmentRouter.get('/type/rent', apartmentController.getRentApartments);
apartmentRouter.get('/type/daily', apartmentController.getDailyApartments);
apartmentRouter.get('/link/:link', apartmentController.getApartmentByLink);

// apartmentRouter.get('/recommendations/:type', apartmentController.getRecommendations);
apartmentRouter.get('/lc/emdedded', apartmentController.generateEmbedding)

export default apartmentRouter;