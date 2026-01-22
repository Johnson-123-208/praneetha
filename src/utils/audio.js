// Audio utilities for PCM handling and audio processing

export class AudioProcessor {
  constructor(inputSampleRate = 16000, outputSampleRate = 24000) {
    this.inputSampleRate = inputSampleRate;
    this.outputSampleRate = outputSampleRate;
    this.audioContext = null;
    this.audioBuffer = null;
    this.nextStartTime = 0;
  }

  async initialize() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: this.outputSampleRate,
      });
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
    }
  }

  // Convert Base64 to PCM array buffer
  base64ToPCM(base64) {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  // Convert PCM array buffer to Base64
  pcmToBase64(pcmBuffer) {
    const bytes = new Uint8Array(pcmBuffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  // Calculate RMS volume for visualization
  calculateRMS(audioBuffer) {
    if (!audioBuffer || audioBuffer.length === 0) return 0;
    
    let sum = 0;
    const data = new Int16Array(audioBuffer);
    for (let i = 0; i < data.length; i++) {
      const sample = data[i] / 32768.0;
      sum += sample * sample;
    }
    const rms = Math.sqrt(sum / data.length);
    return Math.min(rms * 2, 1); // Normalize to 0-1
  }

  // Play audio from PCM data
  async playPCM(pcmData, sampleRate = 24000) {
    if (!this.audioContext) {
      await this.initialize();
    }

    try {
      const audioBuffer = typeof pcmData === 'string' 
        ? this.base64ToPCM(pcmData)
        : pcmData;

      // Convert to Int16Array
      const int16Array = new Int16Array(audioBuffer);
      
      // Convert to Float32Array for Web Audio API
      const float32Array = new Float32Array(int16Array.length);
      for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] / 32768.0;
      }

      // Create AudioBuffer
      const buffer = this.audioContext.createBuffer(1, float32Array.length, sampleRate);
      buffer.getChannelData(0).set(float32Array);

      // Play with gapless scheduling
      const source = this.audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(this.audioContext.destination);

      const currentTime = this.audioContext.currentTime;
      const startTime = Math.max(currentTime, this.nextStartTime);
      source.start(startTime);
      this.nextStartTime = startTime + buffer.duration;

      return new Promise((resolve) => {
        source.onended = () => resolve();
      });
    } catch (error) {
      console.error('Error playing PCM audio:', error);
    }
  }

  // Get user microphone stream
  async getUserMedia() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: this.inputSampleRate,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      return stream;
    } catch (error) {
      console.error('Error accessing microphone:', error);
      throw error;
    }
  }

  // Convert MediaStream to PCM chunks
  async streamToPCM(mediaStream, onChunk) {
    const audioContext = new AudioContext({ sampleRate: this.inputSampleRate });
    const source = audioContext.createMediaStreamSource(mediaStream);
    const processor = audioContext.createScriptProcessor(4096, 1, 1);

    processor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      // Convert Float32 to Int16 PCM
      const pcmData = new Int16Array(inputData.length);
      for (let i = 0; i < inputData.length; i++) {
        const s = Math.max(-1, Math.min(1, inputData[i]));
        pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
      }
      onChunk(pcmData.buffer);
    };

    source.connect(processor);
    processor.connect(audioContext.destination);

    return () => {
      processor.disconnect();
      source.disconnect();
      audioContext.close();
    };
  }
}