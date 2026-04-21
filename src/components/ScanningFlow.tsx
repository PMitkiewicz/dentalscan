"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { Camera, CheckCircle2 } from "lucide-react";
import MessageSidebar from "./MessagingSidebar";

export default function ScanningFlow() {
  const videoRef = useRef<HTMLVideoElement>(null);

  const [camReady, setCamReady] = useState(false);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [stability, setStability] = useState<"bad" | "ok" | "good">("bad");

  const hasSubmitted = useRef(false);

  const VIEWS = [
    { label: "Front View", instruction: "Smile and look straight at the camera." },
    { label: "Left View", instruction: "Turn your head to the left." },
    { label: "Right View", instruction: "Turn your head to the right." },
    { label: "Upper Teeth", instruction: "Tilt your head back and open wide." },
    { label: "Lower Teeth", instruction: "Tilt your head down and open wide." },
  ];

  // ✅ notify once when scan completes
  useEffect(() => {
    if (currentStep !== 5) return;
    if (hasSubmitted.current) return;

    hasSubmitted.current = true;

    async function submitScan() {
      try {
        const res = await fetch("/api/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: "test-user-123",
            title: "Scan Completed",
            message: "Your dental scan is ready for review.",
            scanId: "test-scan-1",
          }),
        });

        const data = await res.json();
        console.log("Notification created:", data);
      } catch (err) {
        console.error("Notification failed:", err);
      }
    }

    submitScan();
  }, [currentStep]);

  // 🎥 Camera
  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setCamReady(true);
        }
      } catch (err) {
        console.error("Camera error:", err);
      }
    }

    startCamera();
  }, []);

  // 🧠 Stability
  useEffect(() => {
    function handleMotion(event: DeviceMotionEvent) {
      const acc = event.accelerationIncludingGravity;
      if (!acc) return;

      const movement =
        Math.abs(acc.x || 0) +
        Math.abs(acc.y || 0) +
        Math.abs(acc.z || 0);

      if (movement > 20) setStability("bad");
      else if (movement > 10) setStability("ok");
      else setStability("good");
    }

    window.addEventListener("devicemotion", handleMotion);
    return () => window.removeEventListener("devicemotion", handleMotion);
  }, []);

  const handleCapture = useCallback(() => {
    if (stability !== "good") return;

    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    const image = canvas.toDataURL("image/jpeg");

    setCapturedImages((prev) => [...prev, image]);
    setCurrentStep((prev) => prev + 1);
  }, [stability]);

  const getFeedback = () => {
    if (!camReady) return "Starting camera...";
    if (stability === "bad") return "Hold still and center your face";
    if (stability === "ok") return "Almost there...";
    return "Perfect — capture now";
  };

  return (
    <div className="flex bg-black min-h-screen text-white">

      {/* LEFT: SCAN */}
      <div className="flex flex-col items-center flex-1">

        <div className="p-4 w-full bg-zinc-900 border-b border-zinc-800 flex justify-between">
          <h1 className="font-bold text-blue-400">DentalScan AI</h1>
          <span className="text-xs text-zinc-500">
            Step {currentStep + 1}/5
          </span>
        </div>

        <div className="relative w-full max-w-md aspect-[3/4] bg-zinc-950 flex items-center justify-center overflow-hidden">

          {currentStep < 5 ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover grayscale opacity-80"
              />

              <div className="absolute inset-0 bg-black/30 pointer-events-none" />

              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div
                  className={`
                    w-[60vw] max-w-[260px] aspect-square rounded-full border-[6px]
                    ${
                      stability === "good"
                        ? "border-green-400"
                        : stability === "ok"
                        ? "border-yellow-300"
                        : "border-red-500"
                    }
                  `}
                />
              </div>

              <div className="absolute bottom-10 left-0 right-0 text-center p-4">
                <p className="text-sm font-medium">
                  {VIEWS[currentStep].instruction}
                </p>
                <p className="text-xs text-zinc-400 mt-2">
                  {getFeedback()}
                </p>
              </div>
            </>
          ) : (
            <div className="text-center p-10">
              <CheckCircle2 className="text-green-500 mx-auto mb-4" size={48} />
              <h2 className="text-xl font-bold">Scan Complete</h2>
              <p className="text-zinc-400">Uploading results...</p>
            </div>
          )}
        </div>

        <div className="p-10">
          {currentStep < 5 && (
            <button
              onClick={handleCapture}
              disabled={stability !== "good"}
              className={`w-20 h-20 rounded-full border-4 flex items-center justify-center ${
                stability === "good"
                  ? "border-white"
                  : "border-zinc-600 opacity-50"
              }`}
            >
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                <Camera className="text-black" />
              </div>
            </button>
          )}
        </div>

      </div>

      {/* RIGHT: SIDEBAR */}
      <div className="w-80 border-l border-zinc-800">
        <MessageSidebar patientId="test-thread-123" />
      </div>

    </div>
  );
}