const { spawn } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const ytdl = require('@distube/ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');

// Set ffmpeg path to the static binary
ffmpeg.setFfmpegPath(ffmpegStatic);

class AudioTranscriptionService {
  constructor() {
    this.tempDir = path.join(__dirname, '../temp');
    this.ensureTempDir();
    
    // Faster-whisper model options
    this.modelSize = process.env.WHISPER_MODEL || 'base'; // tiny, base, small, medium, large-v2, large-v3
    this.device = process.env.WHISPER_DEVICE || 'cpu'; // cpu, cuda
    this.computeType = process.env.WHISPER_COMPUTE_TYPE || 'int8'; // int8, float16, float32
  }

  async ensureTempDir() {
    await fs.ensureDir(this.tempDir);
  }

  /**
   * Downloads audio from YouTube video and transcribes it using faster-whisper
   * @param {string} videoUrl - YouTube video URL
   * @returns {Promise<object>} - Transcription with timestamps
   */
  async transcribeFromYouTube(videoUrl) {
    let audioPath = null;
    let wavPath = null;

    try {
      console.log(`Starting transcription for video: ${videoUrl}`);
      
      // Step 1: Download audio
      audioPath = await this.downloadAudio(videoUrl);
      console.log(`Audio downloaded successfully`);
      
      // Step 2: Convert to WAV format (faster-whisper works best with WAV)
      wavPath = await this.convertToWav(audioPath);
      console.log(`Audio converted to WAV format`);
      
      // Step 3: Transcribe with faster-whisper
      const transcription = await this.transcribeWithFasterWhisper(wavPath);
      console.log(`Transcription completed successfully`);
      
      return transcription;
      
    } catch (error) {
      console.error('Transcription failed:', error.message);
      throw new Error(`Transcription failed: ${error.message}`);
    } finally {
      // Cleanup temp files
      if (audioPath) await fs.remove(audioPath).catch(() => {});
      if (wavPath) await fs.remove(wavPath).catch(() => {});
    }
  }

  /**
   * Downloads audio from YouTube video
   * @param {string} videoUrl - YouTube video URL
   * @returns {Promise<string>} - Path to downloaded audio file
   */
  async downloadAudio(videoUrl) {
    return new Promise((resolve, reject) => {
      const videoId = ytdl.getVideoID(videoUrl);
      const audioPath = path.join(this.tempDir, `${videoId}.webm`);
      
      const stream = ytdl(videoUrl, {
        quality: 'highestaudio',
        filter: 'audioonly',
      });

      stream.pipe(fs.createWriteStream(audioPath));
      
      stream.on('end', () => resolve(audioPath));
      stream.on('error', reject);
    });
  }

  /**
   * Converts audio file to WAV format
   * @param {string} inputPath - Input audio file path
   * @returns {Promise<string>} - Path to WAV file
   */
  async convertToWav(inputPath) {
    return new Promise((resolve, reject) => {
      const outputPath = inputPath.replace(path.extname(inputPath), '.wav');
      
      ffmpeg(inputPath)
        .toFormat('wav')
        .audioFrequency(16000) // 16kHz is optimal for Whisper
        .audioChannels(1) // Mono
        .on('end', () => resolve(outputPath))
        .on('error', reject)
        .save(outputPath);
    });
  }

  /**
   * Transcribes audio using faster-whisper Python library
   * @param {string} audioPath - Path to audio file
   * @returns {Promise<object>} - Transcription with timestamps
   */
  async transcribeWithFasterWhisper(audioPath) {
    return new Promise((resolve, reject) => {
      // Create Python script for faster-whisper
      const pythonScript = this.generatePythonScript(audioPath);
      const scriptPath = path.join(this.tempDir, 'transcribe.py');
      
      fs.writeFileSync(scriptPath, pythonScript);
      
      console.log(`Running faster-whisper with model: ${this.modelSize}`);
      
      const pythonProcess = spawn('python', [scriptPath], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      pythonProcess.on('close', (code) => {
        // Cleanup Python script
        fs.remove(scriptPath).catch(() => {});
        
        if (code !== 0) {
          reject(new Error(`Python process failed: ${stderr}`));
          return;
        }

        try {
          const result = JSON.parse(stdout);
          resolve(this.formatTranscription(result));
        } catch (error) {
          reject(new Error(`Failed to parse transcription result: ${error.message}`));
        }
      });

      pythonProcess.on('error', (error) => {
        reject(new Error(`Failed to start Python process: ${error.message}`));
      });
    });
  }

  /**
   * Generates Python script for faster-whisper transcription
   * @param {string} audioPath - Path to audio file
   * @returns {string} - Python script content
   */
  generatePythonScript(audioPath) {
    return `
import json
import sys
from faster_whisper import WhisperModel

try:
    # Initialize model
    model = WhisperModel("${this.modelSize}", device="${this.device}", compute_type="${this.computeType}")
    
    # Transcribe
    segments, info = model.transcribe("${audioPath.replace(/\\/g, '/')}", beam_size=5)
    
    # Format results
    result = {
        "language": info.language,
        "language_probability": info.language_probability,
        "duration": info.duration,
        "segments": []
    }
    
    for segment in segments:
        result["segments"].append({
            "id": segment.id,
            "start": segment.start,
            "end": segment.end,
            "text": segment.text.strip(),
            "words": [
                {
                    "start": word.start,
                    "end": word.end,
                    "word": word.word,
                    "probability": word.probability
                } for word in segment.words
            ] if hasattr(segment, 'words') and segment.words else []
        })
    
    print(json.dumps(result))
    
except Exception as e:
    print(f"Error: {str(e)}", file=sys.stderr)
    sys.exit(1)
`;
  }

  /**
   * Formats transcription result for consistency with existing code
   * @param {object} rawResult - Raw faster-whisper result
   * @returns {object} - Formatted transcription
   */
  formatTranscription(rawResult) {
    const segments = rawResult.segments || [];
    
    // Create full transcript with timestamps
    const transcript = segments.map(segment => {
      const startTime = this.formatTimestamp(segment.start);
      const endTime = this.formatTimestamp(segment.end);
      return `[${startTime} - ${endTime}] ${segment.text}`;
    }).join('\n');

    return {
      transcript,
      language: rawResult.language,
      languageProbability: rawResult.language_probability,
      duration: rawResult.duration,
      segments: segments.map(segment => ({
        id: segment.id,
        start: segment.start,
        end: segment.end,
        text: segment.text,
        timestamp: this.formatTimestamp(segment.start),
        words: segment.words || []
      })),
      generatedAt: new Date().toISOString(),
      model: this.modelSize,
      device: this.device
    };
  }

  /**
   * Formats seconds to MM:SS format
   * @param {number} seconds - Time in seconds
   * @returns {string} - Formatted timestamp
   */
  formatTimestamp(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  /**
   * Transcribes local audio file
   * @param {string} audioPath - Path to local audio file
   * @returns {Promise<object>} - Transcription with timestamps
   */
  async transcribeLocalFile(audioPath) {
    let wavPath = null;
    
    try {
      // Convert to WAV if needed
      if (!audioPath.endsWith('.wav')) {
        wavPath = await this.convertToWav(audioPath);
        audioPath = wavPath;
      }
      
      const transcription = await this.transcribeWithFasterWhisper(audioPath);
      return transcription;
      
    } finally {
      if (wavPath) await fs.remove(wavPath).catch(() => {});
    }
  }


}

module.exports = AudioTranscriptionService;