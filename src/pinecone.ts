import { Pinecone } from "@pinecone-database/pinecone";
const { GoogleGenerativeAIEmbeddings } = require("@langchain/google-genai");

const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY as string,
})

export default pinecone;