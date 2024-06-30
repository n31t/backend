import openai from '../openai';

class RoadmapService {
  async *processStreamedString(stream: AsyncIterable<any>): AsyncGenerator<string, void, unknown> {
    for await (const part of stream) {
      const chunk = part.choices[0]?.delta?.content;
      if (chunk) {
        yield chunk;
      }
    }
  }

  async create(userPrompt: string, callback: (data: any) => void) {
    const stream = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `
          You are a regular Chat GPT 4o.
          `,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      stream: true,
    });
    try {
      let completeMessage = '';
      for await (const textChunk of this.processStreamedString(stream)) {
        completeMessage += textChunk;
        callback(completeMessage);
      }
    } catch (error) {
      console.error('Error processing OpenAI stream', error);
      throw new Error('Failed to process OpenAI stream');
    }
  }
}

export default RoadmapService;
