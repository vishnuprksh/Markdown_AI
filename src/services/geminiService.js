import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI with the API key
const API_KEY = 'AIzaSyB7vcz6EYCGBqBbCBdNLFn0s0bt8jdBWYQ';
const genAI = new GoogleGenerativeAI(API_KEY);

// Get the Gemini Flash 2.5 model
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

class GeminiService {
  /**
   * Enhance markdown content using Gemini AI
   * @param {string} content - The markdown content to enhance
   * @param {string} prompt - Custom prompt for the AI enhancement
   * @returns {Promise<string>} - Enhanced markdown content
   */
  async enhanceMarkdown(content, prompt = '') {
    try {
      const defaultPrompt = `You are an expert markdown editor assistant. Please improve and enhance the following markdown content while maintaining its structure and meaning. Make the content more engaging, fix any grammatical errors, improve clarity, and enhance formatting where appropriate. Keep all existing markdown syntax and structure intact. Only return the improved markdown content without any additional explanations or wrapper text.`;
      
      const fullPrompt = prompt || defaultPrompt;
      const inputText = `${fullPrompt}\n\nMarkdown content to enhance:\n\n${content}`;
      
      const result = await model.generateContent(inputText);
      const response = await result.response;
      const enhancedContent = response.text();
      
      return enhancedContent.trim();
    } catch (error) {
      console.error('Error enhancing markdown with Gemini:', error);
      throw new Error('Failed to enhance content with AI. Please try again.');
    }
  }

  /**
   * Generate new markdown content based on a prompt
   * @param {string} prompt - The prompt for content generation
   * @returns {Promise<string>} - Generated markdown content
   */
  async generateMarkdown(prompt) {
    try {
      const fullPrompt = `You are an expert markdown content creator. Based on the following prompt, create comprehensive, well-structured markdown content. Use appropriate headers, formatting, lists, and other markdown features to make the content engaging and readable. Only return the markdown content without any additional explanations or wrapper text.

Prompt: ${prompt}`;
      
      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      const generatedContent = response.text();
      
      return generatedContent.trim();
    } catch (error) {
      console.error('Error generating markdown with Gemini:', error);
      throw new Error('Failed to generate content with AI. Please try again.');
    }
  }

  /**
   * Fix grammar and improve text quality
   * @param {string} content - The content to fix
   * @returns {Promise<string>} - Fixed content
   */
  async fixGrammar(content) {
    try {
      const prompt = `Please fix any grammatical errors, improve sentence structure, and enhance the clarity of the following markdown content. Maintain all markdown formatting and structure. Only return the corrected content without any additional explanations.

Content to fix:\n\n${content}`;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const fixedContent = response.text();
      
      return fixedContent.trim();
    } catch (error) {
      console.error('Error fixing grammar with Gemini:', error);
      throw new Error('Failed to fix grammar with AI. Please try again.');
    }
  }

  /**
   * Summarize markdown content
   * @param {string} content - The content to summarize
   * @returns {Promise<string>} - Summarized content in markdown
   */
  async summarizeContent(content) {
    try {
      const prompt = `Please create a concise summary of the following markdown content. Present the summary in well-formatted markdown with appropriate headers and bullet points. Capture the key points and main ideas. Only return the summary in markdown format without any additional explanations.

Content to summarize:\n\n${content}`;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const summary = response.text();
      
      return summary.trim();
    } catch (error) {
      console.error('Error summarizing content with Gemini:', error);
      throw new Error('Failed to summarize content with AI. Please try again.');
    }
  }

  /**
   * Translate markdown content to another language
   * @param {string} content - The content to translate
   * @param {string} targetLanguage - The target language
   * @returns {Promise<string>} - Translated content in markdown
   */
  async translateContent(content, targetLanguage) {
    try {
      const prompt = `Please translate the following markdown content to ${targetLanguage}. Maintain all markdown formatting, structure, and syntax. Only return the translated markdown content without any additional explanations.

Content to translate:\n\n${content}`;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const translatedContent = response.text();
      
      return translatedContent.trim();
    } catch (error) {
      console.error('Error translating content with Gemini:', error);
      throw new Error('Failed to translate content with AI. Please try again.');
    }
  }

  /**
   * Custom AI processing with user-defined prompt
   * @param {string} content - The content to process
   * @param {string} customPrompt - Custom instructions for AI
   * @returns {Promise<string>} - Processed content
   */
  async customProcess(content, customPrompt) {
    try {
      const fullPrompt = `${customPrompt}

Please process the following markdown content according to the instructions above. Maintain markdown formatting where appropriate and only return the processed content without additional explanations.

Content to process:\n\n${content}`;
      
      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      const processedContent = response.text();
      
      return processedContent.trim();
    } catch (error) {
      console.error('Error processing content with Gemini:', error);
      throw new Error('Failed to process content with AI. Please try again.');
    }
  }
}

export default new GeminiService();
