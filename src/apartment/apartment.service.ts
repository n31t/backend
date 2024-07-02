import { Prisma, PrismaClient } from "@prisma/client";
import openai from "../openai";
import pinecone from "../pinecone";

let { GoogleGenerativeAIEmbeddings } = require("@langchain/google-genai");
const LangchainOpenAI = require("@langchain/openai").OpenAI;
let { loadQAStuffChain } = require("langchain/chains");
let { Document } = require("langchain/document");
const embeddings = new GoogleGenerativeAIEmbeddings({
    model: "embedding-001", // 768 dimensions
});

const indexName = 'homespark2';
const index = pinecone.index(indexName);

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

    async getApartmentByLink(link: string) {
        return this.prisma.apartment.findUnique({
            where: {
                link: link
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

    // private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    //     const chunks: T[][] = [];
    //     for (let i = 0; i < array.length; i += chunkSize) {
    //         chunks.push(array.slice(i, i + chunkSize));
    //     }
    //     return chunks;
    // }

    // private async sendChunkedRequest(apartmentType: string, userPrompt: string, chunk: any[]): Promise<{ id: number, reason: string }[]> {
    //     const promptType = apartmentType === "rent" ? "Аренда с оплатой в месяц" :
    //                        apartmentType === "daily" ? "Аренда на день" : "Купить недвижимость";

    //     const response = await openai.chat.completions.create({
    //         model: 'gpt-3.5-turbo',
    //         messages: [
    //             {
    //                 role: 'system',
    //                 content: `
    //                     Вы — профессиональный агент по недвижимости, хорошо знакомый с Алматы, который идеально знает расположение абсолютно всего в городе. Тип запроса: ${promptType}. Ты должен предоставить от 1 до 20 квартир на твое усмотрение. На основе предоставленных данных о квартирах и запроса пользователя, создайте JSON-массив, который включает объекты с следующими данными:
    //                     apartmentId и reason. Ответ должен быть строго в формате JSON массива и не должен включать никакого дополнительного текста.
    //                     JSON массив должен выглядеть следующим образом:
    //                     [
    //                         {
    //                             "apartmentId": 123,
    //                             "reason": "Причина выбора этой квартиры, основанная на запросе пользователя и также плюсы этой квартиры, относительно других"
    //                         }
    //                     ]
    //                     Данные о каждой квартире представлены в следующем формате:
    //                     {
    //                         "id": Int,                    // Уникальный идентификатор квартиры (целое число)
    //                         "price": Int,                 // Цена квартиры (целое число)
    //                         "location": String,           // Расположение квартиры (строка)
    //                         "floor": String,              // Этаж квартиры (строка)
    //                         "characteristics": Json       // Характеристики квартиры (JSON объект)
    //                     }
    //                 `
    //             },
    //             {
    //                 role: 'user',
    //                 content: `
    //                 Запрос пользователя: ${userPrompt}
    //                 Данные о квартирах: ${JSON.stringify(chunk)}
    //                 `
    //             }
    //         ],
    //         stream: false
    //     });

    //     let messageContent = response.choices[0]?.message?.content || null;
    //     console.log('Received message content:', messageContent);

    //     if (!messageContent) {
    //         throw new Error('No content received from OpenAI');
    //     }

    //     // Remove possible formatting characters
    //     messageContent = messageContent.replace(/```json|```/g, '').trim();

    //     return JSON.parse(messageContent);
    // }

    // async getRecommendations(apartmentType: string, userPrompt: string): Promise<{ id: number, reason: string }[]> {
    //     try {
    //         const apartments = await this.prisma.apartment.findMany({
    //             where: {
    //                 type: apartmentType
    //             }
    //         });

    //         const apartmentsFiltered = apartments.map(apartment => {
    //             const { photos, site, type, updatedAt, lastChecked, link, number, ...rest } = apartment;
    //             return rest;
    //         });

    //         const chunkSize = 35; // Adjust the chunk size based on token limit considerations
    //         const chunks = this.chunkArray(apartmentsFiltered, chunkSize);

    //         let recommendations: { id: number, reason: string }[] = [];

    //         for (const chunk of chunks) {
    //             const chunkRecommendations = await this.sendChunkedRequest(apartmentType, userPrompt, chunk);
    //             recommendations = recommendations.concat(chunkRecommendations);
    //         }

    //         return recommendations;
    //     } catch (err) {
    //         console.error('Error getting recommendations:', err);
    //         throw err;
    //     }
    // }


    async generateEmbedding(prompt: string, classify: string): Promise<{ link: string; comment: string }[]> {
        const embeddedPrompt = await new GoogleGenerativeAIEmbeddings().embedQuery(prompt);
        
        console.log("Embedded Prompt:", embeddedPrompt); // Log the embedded prompt
        
        let promptResponse = await index.query({
            vector: embeddedPrompt,
            topK: 5,
            includeMetadata: true,
            filter: {
                type: classify // Assuming that 'type' is a field in your metadata and 'classify' is the type you want to filter by
            }
        });

        console.log("Prompt Response:", JSON.stringify(promptResponse, null, 2)); // Log the prompt response

        const results = await Promise.all(promptResponse.matches.map(async (match) => {
            if (!match.metadata || !match.metadata.link) {
                return { link: '', comment: '' };
            }

            const link = match.metadata.link;
            const concatenatedResponse = Object.values(match.metadata).join(' ');

            // console.log("Concatenated Response:", concatenatedResponse);
            console.log(match.metadata) 

            const llm = new LangchainOpenAI({
                apiKey: process.env.OPENAI_API_KEY,
            });

            const chain = loadQAStuffChain(llm);
            const result = await chain.call({
                input_documents: [new Document({ pageContent: match.metadata })], // Pass match.metadata directly
                question: prompt,
            });

            console.log("Result:", result); // Log the result from Langchain

            return { link: String(link), comment: String(result.text) }; // Ensure link and comment are converted to strings
        }));

        return results;
    }

}

export default ApartmentService;
