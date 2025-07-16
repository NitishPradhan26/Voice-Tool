import { useEffect, useRef } from "react";

type MicWaveformProps = {
  isRecording: boolean;
};

export default function MicWaveform({ isRecording }: MicWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationId = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;

    async function start() {
      if (!isRecording) return;

      // 1. Get microphone stream
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // 2. Set up Web Audio API nodes
      const audioCtx = new window.AudioContext();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      sourceRef.current = source;
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      dataArrayRef.current = dataArray;

      // 3. Animation loop
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");

      function draw() {
        if (!ctx || !analyserRef.current || !dataArrayRef.current) return;

        analyserRef.current.getByteTimeDomainData(dataArrayRef.current);

        ctx.clearRect(0, 0, canvas!.width, canvas!.height);

        ctx.lineWidth = 2;
        ctx.strokeStyle = "#3B82F6"; // Blue

        ctx.beginPath();
        const sliceWidth = canvas!.width / bufferLength;
        let x = 0;

        // Calculate average audio level to detect if there's actual audio input
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += Math.abs(dataArrayRef.current[i] - 128);
        }
        const averageLevel = sum / bufferLength;
        const isAudioDetected = averageLevel > 0.5; // Threshold for audio detection

        // Generate time-based animation for default vibration
        const time = Date.now() * 0.003; // Slower animation

        for (let i = 0; i < bufferLength; i++) {
          let v = dataArrayRef.current[i] / 128.0;
          
          // If no significant audio is detected, add gentle default vibration
          if (!isAudioDetected) {
            // Create subtle sine wave variations for different parts of the waveform
            const wavePhase = (i / bufferLength) * Math.PI * 2;
            const baseVibration = 0.98 + Math.sin(time + wavePhase) * 0.02; // Very subtle base vibration
            const secondaryVibration = Math.sin(time * 1.5 + wavePhase * 0.5) * 0.015; // Secondary wave
            v = baseVibration + secondaryVibration;
          }
          
          const y = (v * canvas!.height) / 2;
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }
        ctx.lineTo(canvas!.width, canvas!.height / 2);
        ctx.stroke();

        animationId.current = requestAnimationFrame(draw);
      }

      draw();
    }

    if (isRecording) {
      start();
    }

    // Cleanup
    return () => {
      if (animationId.current) cancelAnimationFrame(animationId.current);
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isRecording]);

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 shadow-lg border border-blue-100">
      <canvas
        ref={canvasRef}
        width={300}
        height={60}
        className="rounded-lg bg-white shadow-sm"
        style={{ display: isRecording ? "block" : "none" }}
      />
    </div>
  );
}