import pdf from 'pdf-parse';

export class ResumeParser {
  async parsePdf(buffer: Buffer): Promise<string> {
    try {
      const data = await pdf(buffer);
      return data.text;
    } catch (error) {
      console.error('PDF parsing error:', error);
      throw new Error('Failed to parse PDF resume');
    }
  }

  async parseText(file: File): Promise<string> {
    const buffer = Buffer.from(await file.arrayBuffer());

    if (file.type === 'application/pdf') {
      return this.parsePdf(buffer);
    }

    if (file.type === 'text/plain') {
      return buffer.toString('utf-8');
    }

    throw new Error(`Unsupported file type: ${file.type}`);
  }
}

export const resumeParser = new ResumeParser();
