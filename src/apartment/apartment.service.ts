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

            let promptType = "";
            if (apartmentType === "rent") {
                promptType = "Аренда с оплатой в месяц";
            } else if (apartmentType === "daily") {
                promptType = "Аренда на день";
            } else if (apartmentType === "buy") {
                promptType = "Купить недвижимость";
            }


            const response = await openai.chat.completions.create({
                model: 'gpt-4o',
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
                        Данные о квартирах: ${JSON.stringify(apartmentsFiltered)}
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

            const recommendations = JSON.parse(messageContent);

            if (!Array.isArray(recommendations) || recommendations.length === 0) {
                throw new Error('Invalid response format from OpenAI')
              }
        

            return recommendations;
        } catch (err) {
            console.error('Error getting recommendations:', err);
            throw err;
        }
    }

}

export default ApartmentService