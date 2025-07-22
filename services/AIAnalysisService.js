const { Ollama } = require('ollama');

class AIAnalysisService {
  constructor() {
    this.ollama = new Ollama({
      host: process.env.OLLAMA_HOST || 'http://localhost:11434'
    });
    this.model = process.env.OLLAMA_MODEL || 'deepseek-r1:1.5b';
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
      
      // Check if we're in development mode and should use mock analysis
      if (process.env.NODE_ENV === 'development' && process.env.MOCK_AI_ANALYSIS === 'true') {
        return this.getMockAnalysis(transcript, learningIntention);
      }

      const response = await this.ollama.chat({
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
          num_predict: 1000 // Limit response length
        }
      });

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
    return `You are an expert learning advisor and video content analyzer. Your task is to provide a precise, actionable analysis of how well this video matches the user's specific learning intention.

LEARNING INTENTION:
"${learningIntention}"

VIDEO TRANSCRIPT WITH TIMESTAMPS:
"${transcript.substring(0, 6000)}" ${transcript.length > 6000 ? '...[truncated]' : ''}

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
   * Generates match score based on analysis
   * @param {object} analysis - Analysis object
   * @returns {number} - Match score (0-100)
   */
  async generateMatchScore(analysis) {
    // This method is kept for interface compatibility
    // The score is now generated as part of the main analysis
    return analysis.matchScore || 50;
  }

  /**
   * Extracts key insights from analysis
   * @param {object} analysis - Analysis object
   * @returns {Array<string>} - Key insights
   */
  async extractKeyInsights(analysis) {
    // This method is kept for interface compatibility
    // Insights are now generated as part of the main analysis
    return analysis.insights || [];
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

  /**
   * Returns mock analysis for development/testing
   * @param {string} transcript - Video transcript
   * @param {string} learningIntention - Learning intention
   * @returns {object} - Mock analysis results
   */
  getMockAnalysis(transcript, learningIntention) {
    const transcriptLength = transcript.length;
    const intentionWords = learningIntention.toLowerCase().split(' ');
    
    // Simple mock scoring based on keyword matching
    const transcriptLower = transcript.toLowerCase();
    const matchingWords = intentionWords.filter(word => 
      word.length > 3 && transcriptLower.includes(word)
    );
    
    const baseScore = Math.min(90, 30 + (matchingWords.length * 15));
    const lengthBonus = transcriptLength > 500 ? 10 : 0;
    const matchScore = Math.min(100, baseScore + lengthBonus);

    // Generate more realistic mock timestamps based on learning intention
    const mockTimestamps = this.generateMockTimestamps(learningIntention, matchScore);

    return {
      matchScore,
      recommendation: matchScore >= 70 ? 'HIGHLY_RECOMMENDED' : 
                     matchScore >= 50 ? 'RECOMMENDED' : 
                     matchScore >= 30 ? 'PARTIALLY_RELEVANT' : 'NOT_RECOMMENDED',
      keyPoints: [
        `Specific techniques for ${learningIntention.split(' ').slice(0, 3).join(' ')}`,
        'Practical examples and real-world applications',
        'Step-by-step implementation guidance'
      ],
      insights: [
        `This video directly addresses ${matchScore >= 70 ? 'most aspects' : 'some aspects'} of your learning goal: "${learningIntention}"`,
        `You'll gain actionable knowledge that you can apply immediately`,
        `The content is structured to build understanding progressively`
      ],
      reasoning: `Based on content analysis, this video provides ${matchScore >= 70 ? 'comprehensive coverage' : matchScore >= 50 ? 'good coverage' : 'partial coverage'} of your learning intention. The presenter explains concepts clearly with practical examples that directly relate to what you want to learn.`,
      relevantTimestamps: mockTimestamps,
      timeEfficiencyTips: [
        matchScore >= 70 ? 'Watch the entire video - high relevance throughout' : 'Focus on the highlighted timestamps for maximum efficiency',
        'Skip intro/outro sections if you want to get straight to the content',
        'Take notes during the high-value sections marked above'
      ],
      prerequisiteCheck: 'Basic understanding of the topic is helpful but not required',
      difficultyLevel: matchScore >= 80 ? 'INTERMEDIATE' : matchScore >= 50 ? 'BEGINNER' : 'BEGINNER',
      estimatedLearningTime: `${Math.ceil(mockTimestamps.length * 2.5)} minutes of active learning`,
      generatedAt: new Date().toISOString()
    };
  }

  generateMockTimestamps(learningIntention, matchScore) {
    const baseTimestamps = [
      {
        timeRange: "0:00 - 1:30",
        title: "Introduction and Overview",
        description: "Brief introduction to the topic and what will be covered",
        relevanceScore: 3,
        learningValue: "LOW",
        actionableContent: "Context setting and expectations",
        skipRecommendation: "OPTIONAL"
      },
      {
        timeRange: "1:30 - 4:45",
        title: `Core Concepts of ${learningIntention.split(' ').slice(0, 2).join(' ')}`,
        description: `Fundamental principles and key concepts directly related to ${learningIntention}`,
        relevanceScore: matchScore >= 70 ? 9 : 7,
        learningValue: matchScore >= 70 ? "HIGH" : "MEDIUM",
        actionableContent: `Essential knowledge for ${learningIntention}`,
        skipRecommendation: "MUST_WATCH"
      },
      {
        timeRange: "4:45 - 8:20",
        title: "Practical Examples and Applications",
        description: `Real-world examples showing how to apply what you're learning about ${learningIntention}`,
        relevanceScore: matchScore >= 60 ? 8 : 6,
        learningValue: "HIGH",
        actionableContent: "Concrete examples you can follow and replicate",
        skipRecommendation: matchScore >= 60 ? "MUST_WATCH" : "RECOMMENDED"
      },
      {
        timeRange: "8:20 - 11:15",
        title: "Advanced Techniques and Tips",
        description: `Advanced strategies and pro tips for mastering ${learningIntention}`,
        relevanceScore: matchScore >= 70 ? 8 : 5,
        learningValue: matchScore >= 70 ? "HIGH" : "MEDIUM",
        actionableContent: "Advanced techniques to improve your skills",
        skipRecommendation: matchScore >= 70 ? "RECOMMENDED" : "OPTIONAL"
      },
      {
        timeRange: "11:15 - 12:30",
        title: "Summary and Next Steps",
        description: "Recap of key points and recommendations for further learning",
        relevanceScore: 4,
        learningValue: "MEDIUM",
        actionableContent: "Action plan for continued learning",
        skipRecommendation: "RECOMMENDED"
      }
    ];

    // Filter timestamps based on match score
    if (matchScore < 50) {
      return baseTimestamps.slice(1, 3); // Only core content
    } else if (matchScore < 70) {
      return baseTimestamps.slice(0, 4); // Skip advanced section
    } else {
      return baseTimestamps; // All sections
    }
  }
}

module.exports = AIAnalysisService;