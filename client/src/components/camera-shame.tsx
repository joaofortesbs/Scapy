import React, { useRef, useState, useEffect } from "react";
import { HelpCircle } from "lucide-react";

interface CameraShameProps {
  autoActivate?: boolean;
}

export default function CameraShame({ autoActivate = false }: CameraShameProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [ativo, setAtivo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    // Auto-ativação da câmera se autoActivate for true
    if (autoActivate && !ativo) {
      console.log("🎥 Auto-ativando câmera na página de Pânico...");
      // Pequeno delay para garantir que o componente foi montado completamente
      const autoActivateTimer = setTimeout(() => {
        startCamera();
      }, 500);
      
      return () => clearTimeout(autoActivateTimer);
    }

    return () => {
      // cleanup on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    };
  }, [autoActivate]);

  useEffect(() => {
    return () => {
      // cleanup on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    };
  }, []);

  const startCamera = async () => {
    setErro(null);
    if (typeof navigator === "undefined" || !navigator.mediaDevices) {
      setErro("Navegador não suporta navigator.mediaDevices");
      return;
    }

    try {
      // 1) tentar constraint com facingMode
      let stream = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false
        });
      } catch (innerErr) {
        console.warn("facingMode falhou, tentando fallback:", innerErr);
        // 2) fallback simples
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      console.log("Stream obtido:", stream);
      console.log("Stream tracks:", stream.getTracks().map(t => ({ 
        kind: t.kind, 
        enabled: t.enabled, 
        readyState: t.readyState,
        label: t.label
      })));
      
      streamRef.current = stream;
      
      // Primeiro, marcar como ativo para mostrar o elemento video
      setAtivo(true);
      
      // Aguardar o próximo ciclo para garantir que o DOM foi atualizado
      setTimeout(async () => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.muted = true;
          videoRef.current.playsInline = true;
          
          console.log("Video element:", videoRef.current);
          console.log("SrcObject attached:", videoRef.current.srcObject === stream);
          
          try {
            await videoRef.current.play();
            console.log("video play ok");
          } catch (playErr) {
            console.warn("Erro no play():", playErr);
            setErro("Autoplay bloqueado — clique no vídeo para ativar.");
          }
        } else {
          console.error("videoRef.current ainda é null após setTimeout");
          setErro("Erro ao conectar com a câmera. Tente novamente.");
        }
      }, 100);

      // 4) checar estado do track
      const vt = stream.getVideoTracks()[0];
      console.log("VideoTrack readyState, enabled, muted:", vt.readyState, vt.enabled, vt.muted);
    } catch (err: any) {
      console.error("Falha ao iniciar câmera:", err);
      setErro(err?.name ? `${err.name}: ${err.message}` : String(err));
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      try { 
        videoRef.current.srcObject = null; 
      } catch(e) {
        console.error("Erro ao limpar srcObject:", e);
      }
    }
    setAtivo(false);
    setErro(null);
  };

  // Handler para tentar play novamente se autoplay foi bloqueado
  const handleVideoClick = async () => {
    if (videoRef.current && erro?.includes("Autoplay")) {
      try {
        await videoRef.current.play();
        setErro(null);
        console.log("Play manual funcionou!");
      } catch (e) {
        console.error("Play manual falhou:", e);
      }
    }
  };

  return (
    <div className="camera-card border border-border rounded-2xl p-4 bg-black text-white" style={{ backgroundColor: '#000515' }}>
      <div 
        className="video-wrap" 
        style={{ 
          width: "100%", 
          height: 300, 
          background: "#111", 
          borderRadius: 12, 
          overflow: "hidden",
          border: "2px solid rgba(255,255,255,0.1)"
        }}
      >
        {ativo ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            onClick={handleVideoClick}
            style={{ 
              width: "100%", 
              height: "100%", 
              objectFit: "cover", 
              display: "block"
            }}
            onLoadedMetadata={() => {
              console.log("Video metadata loaded");
            }}
            onCanPlay={() => {
              console.log("Video can play");
            }}
            onPlaying={() => {
              console.log("Video is playing!");
            }}
          />
        ) : (
          <div style={{ 
            width: "100%", 
            height: "100%", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            color: "#8892a6",
            flexDirection: "column"
          }}>
            <div className="text-center">
              <div className="text-5xl mb-3">📷</div>
              <p className="text-sm">Clique abaixo para ativar sua câmera</p>
            </div>
          </div>
        )}
      </div>

      <div className="controls mt-3">
        <button 
          onClick={() => {
            alert("Esta é a Câmera da Vergonha. Ela foi projetada para te ajudar a manter o controle durante momentos de tentação. Ver seu próprio reflexo pode ser um lembrete poderoso dos seus objetivos e valores.");
          }}
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
        >
          <HelpCircle className="w-4 h-4" />
          Ajuda
        </button>
      </div>

      {erro && (
        <div className="mt-2 p-2 bg-red-900/20 border border-red-500/30 rounded">
          <p className="text-sm text-red-400">{erro}</p>
          {erro.includes("permissão") && (
            <p className="text-xs text-red-300 mt-1">
              💡 Dica: Clique no ícone de cadeado na barra de endereços e permita o acesso à câmera.
            </p>
          )}
        </div>
      )}
    </div>
  );
}