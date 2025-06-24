import {Filter} from 'bad-words';

// Initialize the filter
const filter = new Filter();

// Add additional words if needed
const additionalBadWords: string[] = [
  // Add any custom words you want to filter
  // Example: 'customword1', 'customword2'
];

if (additionalBadWords.length > 0) {
  filter.addWords(...additionalBadWords);
}

export const contentFilter = {
  /**
   * Check if text contains inappropriate content
   * @param text The text to check
   * @returns true if text is clean, false if it contains bad words
   */
  isClean: (text: string): boolean => {
    if (!text || typeof text !== 'string') {
      return true;
    }

    try {
      return filter.clean(text) === text;
    } catch (error) {
      console.error('Content filter error:', error);
      // If filter fails, allow the content but log the error
      return true;
    }
  },

  /**
   * Clean the text by replacing bad words with asterisks
   * @param text The text to clean
   * @returns Cleaned text with bad words replaced
   */
  clean: (text: string): string => {
    if (!text || typeof text !== 'string') {
      return text;
    }

    try {
      return filter.clean(text);
    } catch (error) {
      console.error('Content filter error:', error);
      // If filter fails, return original text
      return text;
    }
  },

  /**
   * Get a user-friendly error message for inappropriate content
   */
  getErrorMessage: (): string => {
    return 'Your prompt contains inappropriate content. Please revise and try again.';
  },
};
