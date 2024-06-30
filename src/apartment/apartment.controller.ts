import ApartmentService from "./apartment.service";

class ApartmentController {
    private apartmentService: ApartmentService;

    constructor(apartmentService: ApartmentService) {
        this.apartmentService = new ApartmentService();
    }

    getAllApartments = async (req,res) => {
        try {
            const apartments = await this.apartmentService.getAllApartments();
            if (!apartments) {
                res.status(404).json({ message: 'There are no apartments' });
                return;
              }
            res.status(200).json(apartments);
        }
        catch{
            res.status(500).json({error: 'Internal server error'});
        }
    }

    getApartmentById = async (req, res) => {
        try {
            const id = parseInt(req.params.id);
            const apartment = await this.apartmentService.getApartmentById(id);
            if (!apartment) {
                res.status(404).json({ message: 'Apartment not found' });
                return;
              }
            res.status(200).json(apartment);
        }
        catch{
            res.status(500).json({error: 'Internal server error'});
        }
    }

    getBuyApartments = async (req, res) => {
        try {
            const apartments = await this.apartmentService.getBuyApartments();
            if (!apartments) {
                res.status(404).json({ message: 'There are no buy apartments' });
                return;
              }
            res.status(200).json(apartments);
        }
        catch{
            res.status(500).json({error: 'Internal server error'});
        }
    }

    getRentApartments = async (req, res) => {
        try {
            const apartments = await this.apartmentService.getRentApartments();
            if (!apartments) {
                res.status(404).json({ message: 'There are no rent apartments' });
                return;
              }
            res.status(200).json(apartments);
        }
        catch{
            res.status(500).json({error: 'Internal server error'});
        }
    }

    getDailyApartments = async (req, res) => {
        try {
            const apartments = await this.apartmentService.getDailyApartments();
            if (!apartments) {
                res.status(404).json({ message: 'There are no daily apartments' });
                return;
              }
            res.status(200).json(apartments);
        }
        catch{
            res.status(500).json({error: 'Internal server error'});
        }
    }

    getRecommendations = async (req, res) => {
        try{
            const apartmentType = req.params.type;
            console.log(apartmentType)
            const userPrompt = req.body.prompt;
            const recommendations = await this.apartmentService.getRecommendations(apartmentType, userPrompt);
            if (!recommendations) {
                res.status(404).json({ message: 'No recommendations found' });
                return;
            }
            res.status(200).json(recommendations);
        }
        catch{
            res.status(500).json({error: 'Internal server error'});
        }
    }
}

export default ApartmentController