"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export default function RoastMe() {
  const [phase, setPhase] = useState<"idle"|"capturing"|"analyzing"|"result">("idle");
  const [roast, setRoast] = useState("");
  const [imageData, setImageData] = useState<string|null>(null);
  const [speaking, setSpeaking] = useState(false);
  const streamRef = useRef<MediaStream|null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const load = () => window.speechSynthesis.getVoices();
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = load;
      load();
    }
    return () => { window.speechSynthesis?.cancel(); };
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = mediaStream;
      if (videoRef.current) videoRef.current.srcObject = mediaStream;
      setPhase("capturing");
    } catch {
      alert("Camera access needed! Please allow camera permissions.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  const captureAndRoast = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const w = video.videoWidth || 640;
    const h = video.videoHeight || 480;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;
    ctx.save();
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, w, h);
    ctx.restore();
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    const base64 = dataUrl.split(",")[1];
    setImageData(dataUrl);
    setPhase("analyzing");
    stopCamera();
    try {
      const response = await fetch("/api/roast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64 }),
      });
      const data = await response.json();
      const roastText = data.roast || "You broke my AI. Even my circuits couldn't handle your vibe.";
      setRoast(roastText);
      setPhase("result");
      setTimeout(() => speakRoast(roastText), 500);
    } catch {
      setRoast("Even AI refuses to process whatever is happening here. That says a lot.");
      setPhase("result");
    }
  }, [stopCamera]);

  const speakRoast = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.88; utter.pitch = 1.05; utter.volume = 1;
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v =>
      v.name.includes("Samantha") || v.name.includes("Google US English") ||
      v.name.includes("Karen") || (v.lang === "en-US" && v.localService)
    ) || voices.find(v => v.lang?.startsWith("en"));
    if (preferred) utter.voice = preferred;
    utter.onstart = () => setSpeaking(true);
    utter.onend = () => setSpeaking(false);
    utter.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utter);
  };

  const reset = () => {
    window.speechSynthesis?.cancel();
    setSpeaking(false); setRoast(""); setImageData(null);
    stopCamera(); setPhase("idle");
  };

  return (
    <main className="root">
      <canvas ref={canvasRef} style={{ display: "none" }} />
      <Particles />
      <div className="container">
        <header className="header">
          <span className="flame">🔥</span>
          <h1 className="title">ROAST ME</h1>
          <p className="subtitle">AI-POWERED SAVAGE MODE</p>
        </header>

        {phase === "idle" && (
          <div className="card fade-in">
            <div className="badge">⚠️ NOT FOR THE SENSITIVE</div>
            <p className="desc">Point the camera at your friend.<br />AI analyzes their entire existence<br />and destroys them in 3 sentences.</p>
            <button className="btn" onClick={startCamera}>📸 START ROASTING</button>
            <p className="fine">*Results may cause emotional damage. Use responsibly.</p>
          </div>
        )}

        {phase === "capturing" && (
          <div className="camera-wrap fade-in">
            <div className="frame">
              <div className="corner tl" /><div className="corner tr" />
              <div className="corner bl" /><div className="corner br" />
              <video ref={videoRef} autoPlay playsInline muted className="video" />
              <div className="scan-line" />
              <div className="target-label">🎯 TARGET ACQUIRED</div>
            </div>
            <button className="btn btn-red" onClick={captureAndRoast}>🔥 ROAST THEM</button>
            <button className="cancel-btn" onClick={() => { stopCamera(); setPhase("idle"); }}>Cancel</button>
          </div>
        )}

        {phase === "analyzing" && (
          <div className="card fade-in">
            {imageData && <img src={imageData} alt="target" className="preview-dim" />}
            <div className="load-wrap">
              <div className="spinner" />
              <p className="load-text">AI is judging your entire personality...</p>
              <div className="dots">
                <span className="dot" style={{ animationDelay: "0s" }} />
                <span className="dot" style={{ animationDelay: "0.2s" }} />
                <span className="dot" style={{ animationDelay: "0.4s" }} />
              </div>
            </div>
          </div>
        )}

        {phase === "result" && (
          <div className="card fade-in">
            {imageData && <img src={imageData} alt="roasted" className="preview-full" />}
            <div className="roast-box">
              <div className="roast-label">🎤 THE VERDICT</div>
              <p className="roast-text">{roast}</p>
              {speaking && <div className="speak-badge">🔊 <span className="speak-pulse">READING ALOUD...</span></div>}
            </div>
            <div className="btn-row">
              <button className="outline-btn" onClick={() => speakRoast(roast)} disabled={speaking}>🔊 REPLAY</button>
              <button className="btn" onClick={reset}>🔥 ROAST AGAIN</button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function Particles() {
  const colors = ["#ff4500", "#ff6a00", "#ff0000", "#ffaa00"];
  return (
    <div className="particles">
      {[...Array(14)].map((_, i) => (
        <div key={i} className="particle" style={{
          width: 5 + (i % 5), height: 5 + (i % 5),
          background: colors[i % 4],
          left: `${(i / 14) * 100}%`,
          animationDuration: `${3.5 + (i % 4)}s`,
          animationDelay: `${(i % 5) * 0.7}s`,
        }} />
      ))}
    </div>
  );
}
