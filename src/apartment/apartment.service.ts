import { Prisma, PrismaClient } from "@prisma/client";
import openai from "../openai";

class ApartmentService {
    private prisma: PrismaClient;

    constructor() {
        this.prisma = new PrismaClient();
    }

    async getAllApartments() {
        return this.prisma.apartment.findMany();
    }

    async getApartmentById(id: number) {
        return this.prisma.apartment.findUnique({
            where: {
                id: id
            }
        })
    }

    async getBuyApartments() {
        return this.prisma.apartment.findMany({
            where: {
                type: 'buy'
            }
        })
    }

    async getRentApartments() {
        return this.prisma.apartment.findMany({
            where: {
                type: 'rent'
            }
        })
    }

    async getDailyApartments() {
        return this.prisma.apartment.findMany({
            where: {
                type: 'daily'
            }
        })
    }

    private chunkArray<T>(array: T[], chunkSize: number): T[][] {
        const chunks: T[][] = [];
        for (let i = 0; i < array.length; i += chunkSize) {
            chunks.push(array.slice(i, i + chunkSize));
        }
        return chunks;
    }

    private async sendChunkedRequest(apartmentType: string, userPrompt: string, chunk: any[]): Promise<{ id: number, reason: string }[]> {
        const promptType = apartmentType === "rent" ? "Аренда с оплатой в месяц" :
                           apartmentType === "daily" ? "Аренда на день" : "Купить недвижимость";

        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'system',
                    content: `
                        Вы — профессиональный агент по недвижимости, хорошо знакомый с Алматы, который идеально знает расположение абсолютно всего в городе. Тип запроса: ${promptType}. Ты должен предоставить от 1 до 20 квартир на твое усмотрение. На основе предоставленных данных о квартирах и запроса пользователя, создайте JSON-массив, который включает объекты с следующими данными:
                        apartmentId и reason. Ответ должен быть строго в формате JSON массива и не должен включать никакого дополнительного текста.
                        JSON массив должен выглядеть следующим образом:
                        [
                            {
                                "apartmentId": 123,
                                "reason": "Причина выбора этой квартиры, основанная на запросе пользователя и также плюсы этой квартиры, относительно других"
                            }
                        ]
                        Данные о каждой квартире представлены в следующем формате:
                        {
                            "id": Int,                    // Уникальный идентификатор квартиры (целое число)
                            "price": Int,                 // Цена квартиры (целое число)
                            "location": String,           // Расположение квартиры (строка)
                            "floor": String,              // Этаж квартиры (строка)
                            "characteristics": Json       // Характеристики квартиры (JSON объект)
                        }
                    `
                },
                {
                    role: 'user',
                    content: `
                    Запрос пользователя: ${userPrompt}
                    Данные о квартирах: ${JSON.stringify(chunk)}
                    `
                }
            ],
            stream: false
        });

        let messageContent = response.choices[0]?.message?.content || null;
        console.log('Received message content:', messageContent);

        if (!messageContent) {
            throw new Error('No content received from OpenAI');
        }

        // Remove possible formatting characters
        messageContent = messageContent.replace(/```json|```/g, '').trim();

        return JSON.parse(messageContent);
    }

    async getRecommendations(apartmentType: string, userPrompt: string): Promise<{ id: number, reason: string }[]> {
        try {
            const apartments = await this.prisma.apartment.findMany({
                where: {
                    type: apartmentType
                }
            });

            const apartmentsFiltered = apartments.map(apartment => {
                const { photos, site, type, updatedAt, lastChecked, link, number, ...rest } = apartment;
                return rest;
            });

            const chunkSize = 35; // Adjust the chunk size based on token limit considerations
            const chunks = this.chunkArray(apartmentsFiltered, chunkSize);

            let recommendations: { id: number, reason: string }[] = [];

            for (const chunk of chunks) {
                const chunkRecommendations = await this.sendChunkedRequest(apartmentType, userPrompt, chunk);
                recommendations = recommendations.concat(chunkRecommendations);
            }

            return recommendations;
        } catch (err) {
            console.error('Error getting recommendations:', err);
            throw err;
        }
    }
}

export default ApartmentService;
