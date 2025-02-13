import { faker } from '@faker-js/faker';

// Function to generate sentences
const generateSentences = (count = 10) => {
  const sentences = [
    // Keep a few static sentences as fallback
    "The quick brown fox jumps over the lazy dog.",
    "Practice makes perfect when learning to type.",
    
    // Generate random sentences
    ...Array(count).fill(null).map(() => 
      faker.lorem.sentence(
        faker.number.int({ min: 5, max: 12 }) // Random length sentences
      )
    )
  ];

  // Clean up sentences to ensure they end with proper punctuation
  return sentences.map(sentence => 
    sentence.charAt(0).toUpperCase() + 
    sentence.slice(1).replace(/[.!?]*$/, '.')
  );
};

// Export both the generator and a default set of sentences
export const sentences = generateSentences();

// Export generator for dynamic updates
export const getNewSentence = () => 
  generateSentences(1)[0];

// Export categories for different types of sentences
export const getSentenceByType = (type) => {
  switch (type) {
    case 'quote':
      return faker.lorem.sentence(8);
    case 'programming':
      return `${faker.hacker.phrase()} ${faker.hacker.verb()} ${faker.hacker.noun()}.`;
    case 'business':
      return faker.company.catchPhrase() + '.';
    default:
      return faker.lorem.sentence();
  }
}; 