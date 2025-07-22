const { YoutubeTranscript } = require('youtube-transcript');

class YouTubeService {
  
  async extractTranscript(videoUrl) {
    try {
      const videoId = this.extractVideoId(videoUrl);
      if (!videoId) {
        throw new Error('Invalid YouTube URL format');
      }

      // Try to fetch transcript with different language options
      let transcriptArray = null;
      const languageOptions = ['en', 'en-US', 'auto'];

      for (const lang of languageOptions) {
        try {
          transcriptArray = await YoutubeTranscript.fetchTranscript(videoId, {
            lang: lang,
            country: 'US'
          });
          if (transcriptArray && transcriptArray.length > 0) {
            break;
          }
        } catch (langError) {
          // Continue to next language option
          continue;
        }
      }

      // If still no transcript, try without language specification
      if (!transcriptArray || transcriptArray.length === 0) {
        transcriptArray = await YoutubeTranscript.fetchTranscript(videoId);
      }

      if (!transcriptArray || transcriptArray.length === 0) {
        
        if (process.env.NODE_ENV === 'development' || process.env.MOCK_TRANSCRIPTS === 'true') {
          return this.getMockTranscript(videoId);
        }
        throw new Error('No transcript available for this video. The video may not have captions enabled or may be private.');
      }

      // Combine all transcript segments into a single string
      const transcript = transcriptArray
        .map(item => item.text)
        .join(' ')
        .replace(/\s+/g, ' ') // Clean up multiple spaces
        .trim();

      return transcript;
    } catch (error) {
      if (error.message.includes('Transcript is disabled')) {
        throw new Error('Transcript is disabled for this video');
      } else if (error.message.includes('Video unavailable')) {
        throw new Error('Video is unavailable or private');
      } else if (error.message.includes('Invalid YouTube URL')) {
        throw error;
      } else if (error.message.includes('No transcript available')) {
        throw error;
      } else {
        throw new Error(`Failed to extract transcript: ${error.message}`);
      }
    }
  }

  /**
   * Validates if a URL is a valid YouTube URL
   */
  validateYouTubeUrl(url) {
    if (!url || typeof url !== 'string') {
      return false;
    }

    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    return youtubeRegex.test(url);
  }

  /**
   * Extracts video ID from YouTube URL
   * @param {string} url - The YouTube URL
   * @returns {string|null} - The video ID or null if invalid
   */
  extractVideoId(url) {
    if (!this.validateYouTubeUrl(url)) {
      return null;
    }

    const regexPatterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/
    ];

    for (const pattern of regexPatterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  }

  /**
   * Gets basic video metadata from URL (for future enhancement)
   * @param {string} videoUrl - The YouTube video URL
   * @returns {Promise<object>} - Basic video metadata
   */
  async getVideoMetadata(videoUrl) {
    const videoId = this.extractVideoId(videoUrl);
    if (!videoId) {
      throw new Error('Invalid YouTube URL format');
    }

    // For now, return basic info. This can be enhanced with YouTube API later
    return {
      videoId,
      url: videoUrl,
      extractedAt: new Date().toISOString()
    };
  }

  /**
   * Returns a mock transcript for development/testing purposes
   
   */
  getMockTranscript(videoId) {
    const mockTranscripts = {
      'dQw4w9WgXcQ': 'This is a classic music video featuring Rick Astley performing Never Gonna Give You Up. The video includes dancing, singing, and has become an internet meme known as Rickrolling. The song talks about commitment and never letting someone down.',
      'default': `This is a mock transcript for video ${videoId}. In a real scenario, this would contain the actual spoken content from the YouTube video. The transcript would include all the dialogue, narration, and spoken words that appear in the video. This mock content is being used for development and testing purposes when actual transcripts are not available. The content would typically be much longer and contain the actual educational or entertainment content from the video.`
    };

    return mockTranscripts[videoId] || mockTranscripts['default'];
  }
}

module.exports = YouTubeService;