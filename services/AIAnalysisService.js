const { Ollama } = require('ollama');

class AIAnalysisService {
  constructor() {
    this.ollama = new Ollama({
      host: process.env.OLLAMA_HOST || 'http://localhost:11434'
    });
    this.model = process.env.OLLAMA_MODEL || 'qwen3:8b';
  }

  /**
   * Analyzes video transcript against learning intention using AI
   * @param {string} transcript - The video transcript
   * @param {string} learningIntention - User's learning intention
   * @returns {Promise<object>} - Analysis results with match score and insights
   */
  async analyzeContent(transcript, learningIntention) {
    try {
      if (!transcript || !learningIntention) {
        throw new Error('Both transcript and learning intention are required');
      }

      const prompt = this.buildAnalysisPrompt(transcript, learningIntention);



      // Log basic info for debugging
      console.log(`Using AI model: ${this.model} for transcript analysis`);

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Analysis timeout after 8 minutes')), 480000); // 8 minutes
      });
      
      const analysisPromise = this.ollama.chat({
        model: this.model,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        options: {
          temperature: 0.3, // Lower temperature for more consistent analysis
          top_p: 0.9,
          num_predict: 800 // Reduced response length for faster processing
        }
      });
      
      const response = await Promise.race([analysisPromise, timeoutPromise]);

      // Parse the response

      const analysisText = response.message.content;
      return this.parseAnalysisResponse(analysisText);

    } catch (error) {
      if (error.message.includes('model not found')) {
        throw new Error(`AI model '${this.model}' not found. Please ensure Ollama is running and the model is installed.`);
      } else if (error.message.includes('connection refused')) {
        throw new Error('Cannot connect to Ollama service. Please ensure Ollama is running on the configured host.');
      } else {
        throw new Error(`AI analysis failed: ${error.message}`);
      }
    }
  }

  /**
   * Builds the analysis prompt for the AI model
   * @param {string} transcript - The video transcript
   * @param {string} learningIntention - User's learning intention
   * @returns {string} - Formatted prompt
   */
  buildAnalysisPrompt(transcript, learningIntention) {
    // Limit transcript to 2000 characters for better performance with qwen3:8b
    const maxTranscriptLength = 2000;
    const truncatedTranscript = transcript.length > maxTranscriptLength 
      ? transcript.substring(0, maxTranscriptLength) + '...[truncated for analysis]'
      : transcript;
      
    return `You are an expert learning advisor and video content analyzer. Your task is to provide a precise, actionable analysis of how well this video matches the user's specific learning intention.

LEARNING INTENTION:
"${learningIntention}"

VIDEO TRANSCRIPT WITH TIMESTAMPS:
"${truncatedTranscript}"

ANALYSIS REQUIREMENTS:
1. Provide SPECIFIC timestamps (in MM:SS format) where relevant content appears
2. Be precise about what the user will learn at each timestamp
3. Identify sections to SKIP if they don't match the learning intention
4. Give actionable recommendations for efficient learning

Respond in the following JSON format:

{
  "matchScore": [number from 0-100],
  "recommendation": "[HIGHLY_RECOMMENDED|RECOMMENDED|PARTIALLY_RELEVANT|NOT_RECOMMENDED]",
  "keyPoints": [
    "Specific skill/concept 1 covered in the video",
    "Specific skill/concept 2 covered in the video", 
    "Specific skill/concept 3 covered in the video"
  ],
  "insights": [
    "Precise insight about how this video addresses your learning goal",
    "Specific knowledge gaps this video will fill for you",
    "Actionable next steps after watching this video"
  ],
  "reasoning": "Detailed explanation of why this video does/doesn't match your learning intention, including specific examples from the content",
  "relevantTimestamps": [
    {
      "timeRange": "MM:SS - MM:SS",
      "title": "Specific topic/skill covered in this section",
      "description": "Detailed description of what you'll learn in this time segment",
      "relevanceScore": [number from 1-10],
      "learningValue": "HIGH|MEDIUM|LOW",
      "actionableContent": "Specific skills, techniques, or knowledge you'll gain",
      "skipRecommendation": "MUST_WATCH|RECOMMENDED|OPTIONAL|SKIP"
    }
  ],
  "timeEfficiencyTips": [
    "Specific recommendation for efficient learning (e.g., 'Skip intro until 2:30')",
    "Priority sections to focus on based on your learning intention",
    "Sections you can safely skip and why"
  ],
  "prerequisiteCheck": "What background knowledge is assumed/required for this video",
  "difficultyLevel": "BEGINNER|INTERMEDIATE|ADVANCED",
  "estimatedLearningTime": "How long it will take to actively learn from this video (vs just watching)"
}

CRITICAL INSTRUCTIONS:
- Be SPECIFIC with timestamps - don't use vague descriptions
- Focus on ACTIONABLE learning outcomes
- Clearly identify what can be SKIPPED to save time
- Match analysis to the EXACT learning intention provided
- Provide timestamps in MM:SS format (estimate if not explicitly provided)
- Rate each timestamp section for learning value
- Give concrete, specific insights rather than generic statements

Respond only with the JSON object, no additional text.`;
  }

  /**
   * Parses the AI response and extracts structured analysis
   * @param {string} analysisText - Raw AI response
   * @returns {object} - Parsed analysis results
   */
  parseAnalysisResponse(analysisText) {
    try {
      // Try to extract JSON from the response
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }

      const analysisData = JSON.parse(jsonMatch[0]);

      // Validate and normalize the response
      return {
        matchScore: Math.max(0, Math.min(100, parseInt(analysisData.matchScore) || 0)),
        recommendation: this.normalizeRecommendation(analysisData.recommendation),
        keyPoints: Array.isArray(analysisData.keyPoints) ? analysisData.keyPoints.slice(0, 5) : [],
        insights: Array.isArray(analysisData.insights) ? analysisData.insights.slice(0, 5) : [],
        reasoning: analysisData.reasoning || 'Analysis completed',
        relevantTimestamps: Array.isArray(analysisData.relevantTimestamps) ?
          analysisData.relevantTimestamps.slice(0, 3) : [],
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      // Fallback parsing if JSON parsing fails
      return this.fallbackAnalysis(analysisText);
    }
  }

  /**
   * Normalizes recommendation values
   * @param {string} recommendation - Raw recommendation
   * @returns {string} - Normalized recommendation
   */
  normalizeRecommendation(recommendation) {
    const validRecommendations = ['HIGHLY_RECOMMENDED', 'RECOMMENDED', 'PARTIALLY_RELEVANT', 'NOT_RECOMMENDED'];
    const normalized = recommendation?.toUpperCase();
    return validRecommendations.includes(normalized) ? normalized : 'PARTIALLY_RELEVANT';
  }

  /**
   * Fallback analysis when JSON parsing fails
   * @param {string} analysisText - Raw AI response
   * @returns {object} - Basic analysis structure
   */
  fallbackAnalysis(analysisText) {
    // Extract basic information from text response
    const matchScore = this.extractMatchScore(analysisText);

    return {
      matchScore,
      recommendation: matchScore >= 70 ? 'RECOMMENDED' : matchScore >= 40 ? 'PARTIALLY_RELEVANT' : 'NOT_RECOMMENDED',
      keyPoints: ['Analysis completed with limited parsing'],
      insights: [analysisText.substring(0, 200) + '...'],
      reasoning: 'Fallback analysis due to parsing issues',
      relevantTimestamps: [],
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Extracts match score from text
   * @param {string} text - Text to search
   * @returns {number} - Extracted score or default
   */
  extractMatchScore(text) {
    const scoreMatch = text.match(/(\d{1,3})(?:\s*%|\s*\/100|\s*out of 100)/i);
    if (scoreMatch) {
      return Math.max(0, Math.min(100, parseInt(scoreMatch[1])));
    }
    return 50; // Default score
  }



  /**
   * Formats analysis results for API response
   * @param {object} rawAnalysis - Raw analysis data
   * @returns {object} - Formatted analysis results
   */
  formatAnalysisResults(rawAnalysis) {
    return {
      matchScore: rawAnalysis.matchScore,
      recommendation: rawAnalysis.recommendation,
      keyPoints: rawAnalysis.keyPoints,
      insights: rawAnalysis.insights,
      reasoning: rawAnalysis.reasoning,
      relevantTimestamps: rawAnalysis.relevantTimestamps,
      generatedAt: rawAnalysis.generatedAt,
      processingTime: rawAnalysis.processingTime || null
    };
  }


}

module.exports = AIAnalysisService;