const { Ollama } = require('ollama');

class AIAnalysisService {
  constructor() {
    this.ollama = new Ollama({
      host: process.env.OLLAMA_HOST || 'http://localhost:11434'
    });
    this.model = process.env.OLLAMA_MODEL || 'qwen3:8b';
  }

  /**
   * Tests the connection to Ollama service
   * @returns {Promise<boolean>} - True if connection works
   */
  async testConnection() {
    try {
      const host = process.env.OLLAMA_HOST || 'http://localhost:11434';
      console.log(`Testing Ollama connection to: ${host}`);
      console.log(`Using model: ${this.model}`);

      const response = await this.ollama.chat({
        model: this.model,
        messages: [{
          role: 'user',
          content: 'respond with just "OK"'
        }],
        options: {
          temperature: 0,
          num_predict: 10
        }
      });
      console.log('✅ Ollama connection test successful');
      return true;
    } catch (error) {
      console.log('❌ Ollama connection test failed:', error.message);
      console.log('🔧 Troubleshooting steps:');
      console.log('   1. Check if Ollama is running: ollama serve');
      console.log('   2. Verify model is installed: ollama list');
      console.log('   3. Test API directly: curl http://localhost:11434/api/tags');
      console.log(`   4. Check configured host: ${process.env.OLLAMA_HOST || 'http://localhost:11434'}`);
      return false;
    }
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

      // Use simplified prompt for faster processing
      const prompt = this.buildSimpleAnalysisPrompt(transcript, learningIntention);



      // Log basic info for debugging
      console.log(`Using AI model: ${this.model} for transcript analysis`);

      // Test connection first
      const connectionOk = await this.testConnection();
      if (!connectionOk) {
        throw new Error('Cannot establish connection to Ollama service');
      }

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Analysis timeout after 5 minutes')), 300000); // 5 minutes
      });

      console.log('Starting actual analysis request...');
      const analysisPromise = this.ollama.chat({
        model: this.model,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        options: {
          temperature: 0.1, // Very low temperature for consistent JSON formatting
          top_p: 0.8,
          num_predict: 1000 // Increased for detailed timestamps
        }
      });
      console.log('Analysis request sent, waiting for response...');

      let response;
      try {
        response = await Promise.race([analysisPromise, timeoutPromise]);
        console.log('✅ Analysis response received successfully');
      } catch (raceError) {
        console.log('❌ Analysis request failed:', raceError.message);
        throw raceError;
      }

      // Parse the response
      const analysisText = response.message.content;

      // Log raw AI response for debugging
      console.log('\n=== RAW AI RESPONSE START ===');
      console.log('Response length:', analysisText.length);
      console.log('Raw AI response:');
      console.log(analysisText);
      console.log('=== RAW AI RESPONSE END ===\n');

      // Log character codes for first 100 characters to identify control characters
      console.log('First 100 characters with codes:');
      for (let i = 0; i < Math.min(100, analysisText.length); i++) {
        const char = analysisText[i];
        const code = char.charCodeAt(0);
        if (code < 32 || code > 126) {
          console.log(`Position ${i}: '${char}' (code: ${code})`);
        }
      }

      try {
        return this.parseAnalysisResponse(analysisText);
      } catch (parseError) {
        console.log('Complex analysis failed, trying simplified approach...');
        console.log('Parse error details:', parseError.message);
        return this.getSimplifiedAnalysis(transcript, learningIntention, analysisText);
      }

    } catch (error) {
      if (error.message.includes('model not found')) {
        throw new Error(`AI model '${this.model}' not found. Please ensure Ollama is running and the model is installed.`);
      } else if (error.message.includes('connection refused') || error.message.includes('fetch failed')) {
        throw new Error('Cannot connect to Ollama service. Please ensure Ollama is running on the configured host.');
      } else if (error.message.includes('timeout')) {
        throw new Error('AI analysis timed out. The model may be overloaded or the content too complex.');
      } else {
        throw new Error(`AI analysis failed: ${error.message}`);
      }
    }
  }

  /**
   * Builds a simplified analysis prompt for faster processing
   * @param {string} transcript - The video transcript
   * @param {string} learningIntention - User's learning intention
   * @returns {string} - Formatted prompt
   */
  buildSimpleAnalysisPrompt(transcript, learningIntention) {
    const maxTranscriptLength = 2000; // Shorter transcript
    const truncatedTranscript = transcript.length > maxTranscriptLength
      ? transcript.substring(0, maxTranscriptLength) + '...'
      : transcript;

    return `Analyze this video transcript and respond with ONLY this JSON format:

Learning Goal: "${learningIntention}"
Video Content: "${truncatedTranscript}"

IMPORTANT: Analyze the transcript carefully and provide detailed timestamps showing:
1. EXACTLY what is being taught at each time marker
2. HOW each section relates to the learning goal "${learningIntention}"
3. SPECIFIC skills or knowledge gained from each timestamp
4. WHETHER each section should be watched, skipped, or is optional

{
  "matchScore": [number 0-100],
  "recommendation": "RECOMMENDED or NOT_RECOMMENDED", 
  "keyPoints": ["specific topic 1 covered", "specific topic 2 covered", "specific topic 3 covered"],
  "reasoning": "detailed explanation of match/mismatch with learning goal",
  "actualTopics": ["main topic 1", "main topic 2", "main topic 3"],
  "skillLevel": "BEGINNER or INTERMEDIATE or ADVANCED",
  "timeToComplete": "estimated viewing time in minutes",
  "alternativeLearning": "what you can actually learn from this video instead",
  "relatedSkills": ["skill 1", "skill 2", "skill 3"],
  "prerequisites": "what knowledge is needed to understand this video",
  "nextSteps": "what to learn after watching this video",
  "timestamps": [
    {
      "time": "0:30", 
      "topic": "specific concept being taught",
      "description": "detailed explanation of what is being taught at this moment",
      "relevance": "HIGH or MEDIUM or LOW",
      "learningValue": "what you will learn from this section",
      "connectionToGoal": "how this specific content relates to your learning intention",
      "actionable": "specific skill or knowledge you can apply",
      "skipRecommendation": "MUST_WATCH or RECOMMENDED or OPTIONAL or SKIP"
    },
    {
      "time": "2:15",
      "topic": "next specific concept",
      "description": "what is being explained here",
      "relevance": "HIGH or MEDIUM or LOW", 
      "learningValue": "concrete learning outcome",
      "connectionToGoal": "direct connection to your learning goal",
      "actionable": "what you can do with this knowledge",
      "skipRecommendation": "MUST_WATCH or RECOMMENDED or OPTIONAL or SKIP"
    }
  ]
}

CRITICAL: Respond with ONLY the complete JSON object. No thinking tags, no explanations, no additional text. Start with { and end with }. Ensure all arrays and objects are properly closed.`;
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

    return `You are an expert learning advisor and video content analyzer. Analyze how well this video matches the user's learning intention.

LEARNING INTENTION: "${learningIntention}"

VIDEO TRANSCRIPT: "${truncatedTranscript}"

CRITICAL INSTRUCTIONS:
1. You must respond with ONLY valid JSON - no explanations, no thinking tags, no additional text
2. Ensure all strings are properly quoted and escaped
3. Do not use trailing commas in arrays or objects
4. Complete all arrays and objects properly
5. Use double quotes for all strings, not single quotes

Respond with this exact JSON structure:

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

IMPORTANT: Return ONLY the JSON object. No additional text, explanations, or formatting.`;
  }

  /**
   * Parses the AI response and extracts structured analysis
   * @param {string} analysisText - Raw AI response
   * @returns {object} - Parsed analysis results
   */
  parseAnalysisResponse(analysisText) {
    try {
      // Clean the response and extract JSON
      let cleanedText = analysisText.trim();

      // Remove thinking tags if present
      cleanedText = cleanedText.replace(/<think>[\s\S]*?<\/think>/g, '');

      // Try to find JSON object with multiple patterns
      let jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        // Try alternative patterns
        jsonMatch = cleanedText.match(/```json\s*(\{[\s\S]*?\})\s*```/);
        if (jsonMatch) {
          jsonMatch[0] = jsonMatch[1];
        }
      }
      
      // If still no match, try to extract from incomplete JSON
      if (!jsonMatch) {
        const startBrace = cleanedText.indexOf('{');
        if (startBrace >= 0) {
          let jsonText = cleanedText.substring(startBrace);
          console.log('Extracted incomplete JSON, length:', jsonText.length);
          // Try to complete incomplete JSON
          jsonText = this.completeIncompleteJson(jsonText);
          jsonMatch = [jsonText];
          console.log('Completed JSON, new length:', jsonText.length);
        }
      }

      if (!jsonMatch) {
        console.log('No JSON match found in response');
        console.log('Raw AI response (first 500 chars):', analysisText.substring(0, 500));
        throw new Error('No JSON found in AI response');
      }

      console.log('JSON match found, length:', jsonMatch[0].length);
      console.log('Extracted JSON (first 200 chars):', jsonMatch[0].substring(0, 200));

      // Clean up common JSON issues before parsing
      let jsonText = jsonMatch[0];
      console.log('Before JSON cleanup (first 200 chars):', jsonText.substring(0, 200));

      jsonText = this.fixCommonJsonIssues(jsonText);
      console.log('After JSON cleanup (first 200 chars):', jsonText.substring(0, 200));

      let analysisData;
      try {
        analysisData = JSON.parse(jsonText);
      } catch (parseError) {
        console.log('JSON parsing failed:', parseError.message);
        console.log('Attempting to fix JSON structure...');

        // Handle specific case of incomplete timestamp array
        if (jsonText.includes('"timestamps":[') && jsonText.includes('"description":')) {
          console.log('Detected incomplete timestamps array, attempting smart completion...');
          
          // Find the last complete timestamp object
          const lastCompleteMatch = jsonText.lastIndexOf('"}');
          if (lastCompleteMatch > 0) {
            // Truncate after the last complete timestamp and close properly
            jsonText = jsonText.substring(0, lastCompleteMatch + 2) + ']}';
            console.log('Smart completion: truncated to last complete timestamp');
          }
        } else {
          // Try to fix incomplete JSON by adding missing closing braces
          const openBraces = (jsonText.match(/\{/g) || []).length;
          const closeBraces = (jsonText.match(/\}/g) || []).length;
          if (openBraces > closeBraces) {
            jsonText += '}'.repeat(openBraces - closeBraces);
          }

          // Try to fix incomplete arrays
          const openBrackets = (jsonText.match(/\[/g) || []).length;
          const closeBrackets = (jsonText.match(/\]/g) || []).length;
          if (openBrackets > closeBrackets) {
            jsonText += ']'.repeat(openBrackets - closeBrackets);
          }
        }

        // Try parsing again
        try {
          analysisData = JSON.parse(jsonText);
        } catch (secondError) {
          console.log('Second JSON parse attempt failed:', secondError.message);
          console.log('Falling back to text analysis...');
          throw new Error('Unable to parse JSON response');
        }
      }

      // Validate and normalize the response with enhanced structure
      return {
        matchScore: Math.max(0, Math.min(100, parseInt(analysisData.matchScore) || 0)),
        recommendation: this.normalizeRecommendation(analysisData.recommendation),
        keyPoints: Array.isArray(analysisData.keyPoints) ? analysisData.keyPoints.slice(0, 6) : [],
        reasoning: analysisData.reasoning || 'Analysis completed',
        
        // Enhanced analytics fields
        actualTopics: Array.isArray(analysisData.actualTopics) ? analysisData.actualTopics.slice(0, 5) : [],
        skillLevel: this.normalizeSkillLevel(analysisData.skillLevel),
        timeToComplete: analysisData.timeToComplete || 'Time estimate not available',
        alternativeLearning: analysisData.alternativeLearning || 'Alternative learning opportunities not identified',
        relatedSkills: Array.isArray(analysisData.relatedSkills) ? analysisData.relatedSkills.slice(0, 5) : [],
        prerequisites: analysisData.prerequisites || 'No specific prerequisites identified',
        nextSteps: analysisData.nextSteps || 'Next learning steps not specified',
        
        // Enhanced timestamps with detailed analysis
        timestamps: Array.isArray(analysisData.timestamps) ?
          analysisData.timestamps.slice(0, 10).map(ts => ({
            time: ts.time || '0:00',
            topic: ts.topic || 'Topic not specified',
            description: ts.description || 'Content description not available',
            relevance: this.normalizeRelevance(ts.relevance),
            learningValue: ts.learningValue || 'Learning value not specified',
            connectionToGoal: ts.connectionToGoal || 'Connection to goal not specified',
            actionable: ts.actionable || 'Actionable insight not available',
            skipRecommendation: this.normalizeSkipRecommendation(ts.skipRecommendation)
          })) : [],
        
        // Legacy fields for backward compatibility
        insights: this.generateInsights(analysisData),
        relevantTimestamps: Array.isArray(analysisData.timestamps) ?
          analysisData.timestamps.filter(ts => ts.relevance === 'HIGH').slice(0, 3) : [],
        difficultyLevel: this.normalizeSkillLevel(analysisData.skillLevel),
        estimatedLearningTime: analysisData.timeToComplete || 'Time estimate not available',
        
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('JSON parsing failed:', error.message);
      if (typeof jsonText !== 'undefined') {
        console.error('Problematic JSON text:', jsonText.substring(0, 200) + '...');
      } else {
        console.error('jsonText is undefined - no JSON was extracted');
      }
      console.error('Full AI response:', analysisText.substring(0, 500) + '...');
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
   * Normalizes skill level values (alias for difficulty level)
   * @param {string} skillLevel - Raw skill level
   * @returns {string} - Normalized skill level
   */
  normalizeSkillLevel(skillLevel) {
    return this.normalizeDifficultyLevel(skillLevel);
  }

  /**
   * Normalizes relevance values for timestamps
   * @param {string} relevance - Raw relevance level
   * @returns {string} - Normalized relevance level
   */
  normalizeRelevance(relevance) {
    const validLevels = ['HIGH', 'MEDIUM', 'LOW'];
    const normalized = relevance?.toUpperCase();
    return validLevels.includes(normalized) ? normalized : 'MEDIUM';
  }

  /**
   * Normalizes skip recommendation values
   * @param {string} skipRec - Raw skip recommendation
   * @returns {string} - Normalized skip recommendation
   */
  normalizeSkipRecommendation(skipRec) {
    const validRecs = ['MUST_WATCH', 'RECOMMENDED', 'OPTIONAL', 'SKIP'];
    const normalized = skipRec?.toUpperCase();
    return validRecs.includes(normalized) ? normalized : 'RECOMMENDED';
  }

  /**
   * Generates insights from analysis data
   * @param {object} analysisData - Raw analysis data
   * @returns {array} - Generated insights
   */
  generateInsights(analysisData) {
    const insights = [];
    
    if (analysisData.alternativeLearning) {
      insights.push(`Alternative learning opportunity: ${analysisData.alternativeLearning}`);
    }
    
    if (analysisData.actualTopics && Array.isArray(analysisData.actualTopics)) {
      insights.push(`Main topics covered: ${analysisData.actualTopics.join(', ')}`);
    }
    
    if (analysisData.relatedSkills && Array.isArray(analysisData.relatedSkills)) {
      insights.push(`Related skills you can develop: ${analysisData.relatedSkills.join(', ')}`);
    }
    
    if (analysisData.nextSteps) {
      insights.push(`Recommended next steps: ${analysisData.nextSteps}`);
    }
    
    if (analysisData.prerequisites) {
      insights.push(`Prerequisites needed: ${analysisData.prerequisites}`);
    }
    
    return insights.slice(0, 5); // Limit to 5 insights
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
   * Gets simplified analysis when complex JSON parsing fails
   * @param {string} transcript - Video transcript
   * @param {string} learningIntention - Learning intention
   * @param {string} aiResponse - Raw AI response
   * @returns {object} - Simplified analysis
   */
  async getSimplifiedAnalysis(transcript, learningIntention, aiResponse) {
    try {
      const simplePrompt = `Analyze this video transcript for learning relevance. Respond with ONLY a JSON object:

Learning Goal: "${learningIntention}"
Transcript: "${transcript.substring(0, 2000)}"

{
  "matchScore": [0-100 number],
  "recommendation": "RECOMMENDED or NOT_RECOMMENDED",
  "keyPoints": ["point 1", "point 2", "point 3"],
  "reasoning": "brief explanation"
}`;

      const simpleResponse = await this.ollama.chat({
        model: this.model,
        messages: [
          {
            role: 'user',
            content: simplePrompt
          }
        ],
        options: {
          temperature: 0.1,
          num_predict: 300
        }
      });

      const simpleJson = simpleResponse.message.content.trim();
      const jsonMatch = simpleJson.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        return {
          matchScore: Math.max(0, Math.min(100, parseInt(data.matchScore) || 50)),
          recommendation: data.recommendation === 'RECOMMENDED' ? 'RECOMMENDED' : 'NOT_RECOMMENDED',
          keyPoints: Array.isArray(data.keyPoints) ? data.keyPoints.slice(0, 3) : ['Analysis completed'],
          reasoning: data.reasoning || 'Basic relevance analysis completed',
          
          // Enhanced analytics with fallback values
          actualTopics: Array.isArray(data.actualTopics) ? data.actualTopics : ['Topics not identified'],
          skillLevel: data.skillLevel || 'INTERMEDIATE',
          timeToComplete: data.timeToComplete || 'Time estimate not available',
          alternativeLearning: data.alternativeLearning || 'Alternative learning opportunities not identified',
          relatedSkills: Array.isArray(data.relatedSkills) ? data.relatedSkills : ['Skills assessment not available'],
          prerequisites: data.prerequisites || 'Prerequisites not specified',
          nextSteps: data.nextSteps || 'Next steps not specified',
          timestamps: Array.isArray(data.timestamps) ? data.timestamps : [],
          
          // Legacy fields for backward compatibility
          insights: this.generateInsights(data),
          relevantTimestamps: [],
          difficultyLevel: data.skillLevel || 'INTERMEDIATE',
          estimatedLearningTime: data.timeToComplete || 'Manual review recommended',
          
          generatedAt: new Date().toISOString()
        };
      }
    } catch (error) {
      console.log('Simplified analysis also failed:', error.message);
    }

    // Ultimate fallback
    return this.fallbackAnalysis(aiResponse);
  }

  /**
   * Completes incomplete JSON by adding missing closing brackets and braces
   * @param {string} jsonText - Incomplete JSON text
   * @returns {string} - Completed JSON text
   */
  completeIncompleteJson(jsonText) {
    console.log('Attempting to complete incomplete JSON...');
    let completed = jsonText.trim();
    
    // Handle the specific case where response is cut off mid-sentence
    // Look for incomplete strings and truncate to last complete element
    if (completed.includes('"description":') && !completed.endsWith('}')) {
      console.log('Detected incomplete timestamp object, attempting to fix...');
      
      // Find the last complete timestamp object
      const timestampMatches = [...completed.matchAll(/\{"time":[^}]+\}/g)];
      if (timestampMatches.length > 0) {
        const lastCompleteTimestamp = timestampMatches[timestampMatches.length - 1];
        const endIndex = lastCompleteTimestamp.index + lastCompleteTimestamp[0].length;
        
        // Truncate to last complete timestamp and close the array
        completed = completed.substring(0, endIndex) + ']}';
        console.log('Truncated to last complete timestamp');
      }
    }
    
    // Count open and close brackets/braces
    const openBraces = (completed.match(/\{/g) || []).length;
    const closeBraces = (completed.match(/\}/g) || []).length;
    const openBrackets = (completed.match(/\[/g) || []).length;
    const closeBrackets = (completed.match(/\]/g) || []).length;
    
    console.log(`Braces: ${openBraces} open, ${closeBraces} close`);
    console.log(`Brackets: ${openBrackets} open, ${closeBrackets} close`);
    
    // If we have an incomplete array, close it
    if (openBrackets > closeBrackets) {
      const missingBrackets = openBrackets - closeBrackets;
      completed += ']'.repeat(missingBrackets);
      console.log(`Added ${missingBrackets} closing brackets`);
    }
    
    // Close any remaining open braces
    if (openBraces > closeBraces) {
      const missingBraces = openBraces - closeBraces;
      completed += '}'.repeat(missingBraces);
      console.log(`Added ${missingBraces} closing braces`);
    }
    
    console.log('JSON completion attempted');
    return completed;
  }

  /**
   * Fixes common JSON formatting issues
   * @param {string} jsonText - Raw JSON text
   * @returns {string} - Cleaned JSON text
   */
  fixCommonJsonIssues(jsonText) {
    console.log('Starting JSON cleanup...');
    let cleaned = jsonText;

    // Fix trailing commas in arrays and objects
    const beforeTrailing = cleaned.length;
    cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');
    if (cleaned.length !== beforeTrailing) {
      console.log('Fixed trailing commas');
    }

    // Fix missing commas between array elements
    const beforeArrayCommas = cleaned.length;
    cleaned = cleaned.replace(/"\s*\n\s*"/g, '",\n    "');
    if (cleaned.length !== beforeArrayCommas) {
      console.log('Fixed missing array commas');
    }

    // Fix missing commas between object properties
    const beforeObjectCommas = cleaned.length;
    cleaned = cleaned.replace(/"\s*\n\s*"/g, '",\n    "');
    if (cleaned.length !== beforeObjectCommas) {
      console.log('Fixed missing object commas');
    }

    // Remove any non-JSON content before the opening brace
    const firstBrace = cleaned.indexOf('{');
    if (firstBrace > 0) {
      console.log(`Removing ${firstBrace} characters before first brace`);
      cleaned = cleaned.substring(firstBrace);
    }

    // Remove any non-JSON content after the closing brace
    const lastBrace = cleaned.lastIndexOf('}');
    if (lastBrace >= 0 && lastBrace < cleaned.length - 1) {
      const removedChars = cleaned.length - lastBrace - 1;
      console.log(`Removing ${removedChars} characters after last brace`);
      cleaned = cleaned.substring(0, lastBrace + 1);
    }

    console.log('JSON cleanup completed');
    return cleaned;
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