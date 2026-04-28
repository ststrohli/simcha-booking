/**
 * AI Services Disabled
 */
export const getPlanningAdvice = async (userPrompt: string): Promise<string> => {
  return "The Simcha AI is currently disabled.";
};

export const summarizeFile = async (fileName: string, fileType: string, notes: string = ''): Promise<string> => {
  return "AI summary is currently disabled.";
};
