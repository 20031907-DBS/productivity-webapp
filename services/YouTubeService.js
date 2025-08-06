const { Innertube } = require('youtubei.js');
const AudioTranscriptionService = require('./AudioTranscriptionService');

class YouTubeService {
  constructor() {
    this.audioTranscriptionService = new AudioTranscriptionService();
  }

  async extractTranscript(videoUrl) {
    try {
      const videoId = this.extractVideoId(videoUrl);
      if (!videoId) {
        throw new Error('Invalid YouTube URL format');
      }

      console.log(`Extracting transcript using local AI for video: ${videoId}`);
      
      // Use local transcription service instead of YouTube captions
      const transcriptionResult = await this.audioTranscriptionService.transcribeFromYouTube(videoUrl);
      
      if (!transcriptionResult.transcript || transcriptionResult.transcript.length === 0) {
        throw new Error('Failed to generate transcript from video audio');
      }

      console.log(`Local transcription completed: ${transcriptionResult.segments.length} segments, ${transcriptionResult.language} language`);
      
      return transcriptionResult.transcript;
      
    } catch (error) {
      if (error.message.includes('Invalid YouTube URL')) {
        throw error;
      } else if (error.message.includes('Transcription failed')) {
        throw new Error(`Failed to transcribe video: ${error.message}`);
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
   * Gets video metadata using YouTube API
   * @param {string} videoUrl - The YouTube video URL
   * @returns {Promise<object>} - Video metadata
   */
  async getVideoMetadata(videoUrl) {
    const videoId = this.extractVideoId(videoUrl);
    if (!videoId) {
      throw new Error('Invalid YouTube URL format');
    }

    try {
      console.log(`Fetching metadata for video: ${videoId}`);
      const youtube = await Innertube.create();
      const info = await youtube.getInfo(videoId);
      
      return {
        videoId,
        url: videoUrl,
        title: info.basic_info?.title || 'Unknown Title',
        duration: info.basic_info?.duration?.text || null,
        channelName: info.basic_info?.channel?.name || null,
        viewCount: info.basic_info?.view_count || null,
        extractedAt: new Date().toISOString()
      };
    } catch (error) {
      console.log(`Failed to fetch metadata, using fallback: ${error.message}`);
      // Fallback to basic info if metadata extraction fails
      return {
        videoId,
        url: videoUrl,
        title: 'Video Title Not Available',
        duration: null,
        channelName: null,
        extractedAt: new Date().toISOString()
      };
    }
  }


}

module.exports = YouTubeService;