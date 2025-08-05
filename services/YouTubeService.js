const { Innertube } = require('youtubei.js');

class YouTubeService {

  async extractTranscript(videoUrl) {
    try {
      const videoId = this.extractVideoId(videoUrl);
      if (!videoId) {
        throw new Error('Invalid YouTube URL format');
      }

      // Initialize YouTube client
      console.log(`   Connecting to YouTube API for video: ${videoId}`);
      const youtube = await Innertube.create();
      
      console.log(`   Fetching video information...`);
      const info = await youtube.getInfo(videoId);
      
      console.log(`   Video title: "${info.basic_info?.title || 'Unknown'}"`);
      console.log(`   Duration: ${info.basic_info?.duration?.text || 'Unknown'}`);

      // Check if captions are available
      if (!info.captions) {
        throw new Error('No transcript available for this video. The video may not have captions enabled or may be private.');
      }

      console.log(`   Captions detected, extracting transcript...`);
      // Get transcript
      const transcriptData = await info.getTranscript();

      // Extract transcript segments
      if (!transcriptData.transcript ||
        !transcriptData.transcript.content ||
        !transcriptData.transcript.content.body ||
        !transcriptData.transcript.content.body.initial_segments) {
        throw new Error('No transcript segments found for this video.');
      }

      const segments = transcriptData.transcript.content.body.initial_segments;

      if (!segments || segments.length === 0) {
        throw new Error('No transcript content available for this video.');
      }

      // Combine all transcript segments into a single string
      const transcript = segments
        .map(segment => segment.snippet.text)
        .join(' ')
        .replace(/\s+/g, ' ') // Clean up multiple spaces
        .trim();

      if (!transcript || transcript.length === 0) {
        throw new Error('Transcript content is empty for this video.');
      }

      return transcript;
    } catch (error) {
      if (error.message.includes('Video unavailable') || error.message.includes('Private video')) {
        throw new Error('Video is unavailable or private');
      } else if (error.message.includes('Invalid YouTube URL')) {
        throw error;
      } else if (error.message.includes('No transcript available') ||
        error.message.includes('No transcript segments') ||
        error.message.includes('No transcript content') ||
        error.message.includes('Transcript content is empty')) {
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


}

module.exports = YouTubeService;