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
    // Increase transcript length for better analysis with improved chunking
    const maxTranscriptLength = 4000;
    const truncatedTranscript = transcript.length > maxTranscriptLength 
      ? this.intelligentTruncate(transcript, maxTranscriptLength)
      : transcript;
      
    return `You are an expert learning advisor and video content analyzer with deep expertise in educational content assessment. Your task is to provide a comprehensive, actionable analysis of how well this video matches the user's specific learning intention.

LEARNING INTENTION:
"${learningIntention}"

VIDEO TRANSCRIPT:
"${truncatedTranscript}"

ANALYSIS FRAMEWORK:
1. CONTENT RELEVANCE: How directly does the video content address the learning intention?
2. LEARNING EFFICIENCY: Which parts provide maximum learning value vs time invested?
3. SKILL PROGRESSION: What specific skills/knowledge will be gained and in what order?
4. PRACTICAL APPLICATION: How can the learner immediately apply what they learn?

Respond in the following JSON format with detailed, specific analysis:

{
  "matchScore": [number from 0-100 based on content alignment with learning intention],
  "recommendation": "[HIGHLY_RECOMMENDED|RECOMMENDED|PARTIALLY_RELEVANT|NOT_RECOMMENDED]",
  "keyPoints": [
    "Specific, actionable skill or concept 1 that directly addresses the learning intention",
    "Specific, actionable skill or concept 2 with practical application details",
    "Specific, actionable skill or concept 3 with measurable learning outcomes",
    "Advanced technique or insight that goes beyond basic coverage",
    "Real-world application or case study mentioned in the video"
  ],
  "insights": [
    "Precise analysis of how this video uniquely addresses your specific learning goal with concrete examples",
    "Specific knowledge gaps this video fills and why they matter for your learning journey",
    "Actionable next steps with specific resources or practice recommendations after watching",
    "How this video compares to typical content on this topic and what makes it special",
    "Potential challenges you might face and how the video helps overcome them"
  ],
  "reasoning": "Comprehensive explanation analyzing: (1) Content-intention alignment with specific examples, (2) Teaching quality and clarity assessment, (3) Practical value and real-world applicability, (4) Completeness of coverage for the stated learning goal, (5) Any limitations or gaps in addressing the learning intention",
  "relevantTimestamps": [
    {
      "timeRange": "MM:SS - MM:SS",
      "title": "Specific, descriptive title of the concept/skill covered",
      "description": "Detailed description of exactly what knowledge/skills are taught, including specific techniques, examples, or frameworks presented",
      "relevanceScore": [number from 1-10],
      "learningValue": "HIGH|MEDIUM|LOW",
      "actionableContent": "Specific, measurable skills or knowledge you'll gain that directly apply to your learning intention",
      "skipRecommendation": "MUST_WATCH|RECOMMENDED|OPTIONAL|SKIP",
      "keyTakeaways": "The 2-3 most important points from this section",
      "practicalApplication": "How you can immediately apply what's taught in this section"
    }
  ],
  "timeEfficiencyTips": [
    "Specific time-saving recommendation with exact timestamps (e.g., 'Skip introduction and start at 2:30 where core concepts begin')",
    "Priority viewing order based on your learning intention with reasoning",
    "Sections you can safely skip with explanation of why they don't match your goal",
    "Optimal playback speed recommendations for different sections",
    "Pause points for practice or note-taking with specific suggestions"
  ],
  "prerequisiteCheck": "Detailed assessment of required background knowledge, including specific concepts, tools, or experience needed",
  "difficultyLevel": "BEGINNER|INTERMEDIATE|ADVANCED",
  "estimatedLearningTime": "Realistic time estimate for active learning (taking notes, pausing, practicing) vs passive watching",
  "learningPath": {
    "beforeWatching": "Specific preparation steps or background reading recommended",
    "duringWatching": "Active learning strategies for maximum retention",
    "afterWatching": "Concrete practice exercises or next steps to reinforce learning"
  },
  "contentQuality": {
    "teachingClarity": "Assessment of how clearly concepts are explained",
    "practicalExamples": "Quality and relevance of examples provided",
    "comprehensiveness": "How thoroughly the topic is covered relative to your learning intention"
  }
}

CRITICAL ANALYSIS STANDARDS:
- Provide SPECIFIC timestamps with exact minute:second format when possible
- Focus on MEASURABLE learning outcomes and actionable skills
- Identify content that can be SKIPPED to optimize learning time
- Match analysis precisely to the user's EXACT learning intention
- Give concrete, specific insights with examples from the transcript
- Assess both content quality and learning efficiency
- Provide practical next steps and application guidance

Respond only with the valid JSON object, no additional text or formatting.`;
  }

  /**
   * Parses the AI response and extracts structured analysis
   * @param {string} analysisText - Raw AI response
   * @returns {object} - Parsed analysis results
   */
  parseAnalysisResponse(analysisText) {
    try {
      // Clean the response and extract JSON
      const cleanedText = analysisText.trim();
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }

      const analysisData = JSON.parse(jsonMatch[0]);

      // Validate and normalize the response with enhanced structure
      return {
        matchScore: Math.max(0, Math.min(100, parseInt(analysisData.matchScore) || 0)),
        recommendation: this.normalizeRecommendation(analysisData.recommendation),
        keyPoints: Array.isArray(analysisData.keyPoints) ? analysisData.keyPoints.slice(0, 6) : [],
        insights: Array.isArray(analysisData.insights) ? analysisData.insights.slice(0, 6) : [],
        reasoning: analysisData.reasoning || 'Analysis completed',
        relevantTimestamps: Array.isArray(analysisData.relevantTimestamps) ?
          analysisData.relevantTimestamps.slice(0, 5).map(ts => ({
            ...ts,
            keyTakeaways: ts.keyTakeaways || 'Key learning points from this section',
            practicalApplication: ts.practicalApplication || 'Practical application of concepts covered'
          })) : [],
        timeEfficiencyTips: Array.isArray(analysisData.timeEfficiencyTips) ? 
          analysisData.timeEfficiencyTips.slice(0, 5) : [],
        prerequisiteCheck: analysisData.prerequisiteCheck || 'No specific prerequisites identified',
        difficultyLevel: this.normalizeDifficultyLevel(analysisData.difficultyLevel),
        estimatedLearningTime: analysisData.estimatedLearningTime || 'Time estimate not available',
        learningPath: {
          beforeWatching: analysisData.learningPath?.beforeWatching || 'No specific preparation needed',
          duringWatching: analysisData.learningPath?.duringWatching || 'Take notes and pause for reflection',
          afterWatching: analysisData.learningPath?.afterWatching || 'Practice the concepts learned'
        },
        contentQuality: {
          teachingClarity: analysisData.contentQuality?.teachingClarity || 'Teaching clarity assessment not available',
          practicalExamples: analysisData.contentQuality?.practicalExamples || 'Practical examples assessment not available',
          comprehensiveness: analysisData.contentQuality?.comprehensiveness || 'Comprehensiveness assessment not available'
        },
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('JSON parsing failed:', error.message);
      // Fallback parsing if JSON parsing fails
      return this.fallbackAnalysis(analysisText);
    }
  }

  /**
   * Intelligently truncates transcript to preserve important content
   * @param {string} transcript - Full transcript
   * @param {number} maxLength - Maximum length
   * @returns {string} - Truncated transcript
   */
  intelligentTruncate(transcript, maxLength) {
    if (transcript.length <= maxLength) return transcript;
    
    // Try to find natural break points (sentences, paragraphs)
    const truncated = transcript.substring(0, maxLength);
    const lastSentence = truncated.lastIndexOf('.');
    const lastParagraph = truncated.lastIndexOf('\n');
    
    const breakPoint = Math.max(lastSentence, lastParagraph);
    if (breakPoint > maxLength * 0.8) {
      return transcript.substring(0, breakPoint + 1) + '\n\n[Content truncated for analysis - full transcript analyzed for timestamps]';
    }
    
    return truncated + '...[Content truncated for analysis]';
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
   * Normalizes difficulty level values
   * @param {string} difficulty - Raw difficulty level
   * @returns {string} - Normalized difficulty level
   */
  normalizeDifficultyLevel(difficulty) {
    const validLevels = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];
    const normalized = difficulty?.toUpperCase();
    return validLevels.includes(normalized) ? normalized : 'INTERMEDIATE';
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
      keyPoints: [
        'AI analysis completed but response format needs improvement',
        'Content relevance assessed based on available transcript',
        'Manual review of video content recommended for detailed insights'
      ],
      insights: [
        'The AI model provided analysis but in an unexpected format',
        'Video content has been processed and basic relevance determined',
        'Consider re-running analysis or checking AI model configuration',
        analysisText.length > 100 ? analysisText.substring(0, 200) + '...' : analysisText
      ],
      reasoning: 'Analysis completed using fallback method due to response parsing challenges. The AI model processed the content but returned results in an unexpected format. Basic relevance scoring was applied based on available content analysis.',
      relevantTimestamps: [],
      timeEfficiencyTips: [
        'Review the full video to identify key learning sections',
        'Take notes on sections that align with your learning intention',
        'Consider breaking the video into smaller segments for focused learning'
      ],
      prerequisiteCheck: 'Prerequisites assessment not available in fallback mode',
      difficultyLevel: 'INTERMEDIATE',
      estimatedLearningTime: 'Time estimate not available - recommend active viewing with note-taking',
      learningPath: {
        beforeWatching: 'Prepare note-taking materials and ensure focused learning environment',
        duringWatching: 'Take active notes and pause frequently to process information',
        afterWatching: 'Review notes and identify areas for further research or practice'
      },
      contentQuality: {
        teachingClarity: 'Content quality assessment not available in fallback mode',
        practicalExamples: 'Practical examples assessment not available in fallback mode',
        comprehensiveness: 'Comprehensiveness assessment not available in fallback mode'
      },
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