import { useEffect, useRef, useState } from "react";
import { Camera, CameraOff, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CameraShame() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const startCamera = async () => {
    try {
      setError(null);
      setPermissionDenied(false);
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: "user", // Câmera frontal
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setIsActive(true);
        
        console.log('🎥 Stream conectado ao elemento video');
        
        // Aguardar o metadata ser carregado antes de reproduzir
        videoRef.current.onloadedmetadata = async () => {
          try {
            console.log('🎥 Metadata carregado, iniciando reprodução');
            await videoRef.current!.play();
            console.log('🎥 Vídeo reproduzindo com sucesso!');
          } catch (playErr) {
            console.warn('Auto-play blocked, video needs user interaction:', playErr);
            // Tentar reproduzir na próxima interação do usuário
            const playOnClick = () => {
              videoRef.current?.play();
              document.removeEventListener('click', playOnClick);
            };
            document.addEventListener('click', playOnClick);
          }
        };
      }
    } catch (err: any) {
      console.error("Erro ao acessar a câmera:", err);
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionDenied(true);
        setError("Permissão da câmera negada. Permita o acesso à câmera para usar esta funcionalidade.");
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError("Nenhuma câmera encontrada no dispositivo.");
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setError("Câmera está sendo usada por outro aplicativo.");
      } else {
        setError("Erro ao acessar a câmera. Verifique se há uma câmera disponível.");
      }
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsActive(false);
    }
  };

  useEffect(() => {
    // Cleanup na desmontagem do componente
    return () => {
      stopCamera();
    };
  }, []);

  // Debug effect para verificar estado do stream
  useEffect(() => {
    if (stream && videoRef.current) {
      console.log('🎥 Stream ativo:', stream.getTracks().map(t => ({ kind: t.kind, enabled: t.enabled, readyState: t.readyState })));
      
      // Verificar se o elemento video tem o stream correto
      console.log('🎥 Video element srcObject:', videoRef.current.srcObject === stream ? 'OK' : 'PROBLEMA');
      
      // Force refresh do video element se necessário
      if (videoRef.current.srcObject !== stream) {
        videoRef.current.srcObject = stream;
      }
    }
  }, [stream, isActive]);

  return (
    <div 
      className="rounded-2xl shadow-lg p-4 border border-border"
      style={{ backgroundColor: '#000515' }}
      data-testid="camera-shame"
    >
      {/* Header do componente */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white flex items-center">
          <Camera className="w-5 h-5 mr-2" />
          Câmera da Vergonha
        </h2>
        
        <Button
          onClick={isActive ? stopCamera : startCamera}
          variant="outline"
          size="sm"
          className="bg-transparent border-white/20 text-white hover:bg-white/10"
          data-testid="camera-toggle-button"
        >
          {isActive ? (
            <>
              <CameraOff className="w-4 h-4 mr-2" />
              Parar
            </>
          ) : (
            <>
              <Camera className="w-4 h-4 mr-2" />
              Ativar
            </>
          )}
        </Button>
      </div>

      {/* Área do vídeo */}
      <div className="relative aspect-video bg-black/20 rounded-xl overflow-hidden border border-border/20">
        {!isActive && !error ? (
          // Estado inativo
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <Camera className="w-12 h-12 text-white/40 mb-3" />
            <p className="text-white/60 text-sm mb-4">
              Ative a câmera para se lembrar do seu propósito
            </p>
            <Button
              onClick={startCamera}
              size="sm"
              className="bg-primary hover:bg-primary/90"
              data-testid="activate-camera-button"
            >
              Ativar Câmera
            </Button>
          </div>
        ) : error ? (
          // Estado de erro
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <AlertTriangle className="w-12 h-12 text-red-400 mb-3" />
            <p className="text-red-400 text-sm mb-4">
              {error}
            </p>
            {permissionDenied && (
              <div className="text-xs text-white/60 text-center">
                <p>Para permitir o acesso à câmera:</p>
                <p>• Clique no ícone da câmera na barra de endereços</p>
                <p>• Selecione "Permitir" para este site</p>
              </div>
            )}
            <Button
              onClick={startCamera}
              size="sm"
              variant="outline"
              className="bg-transparent border-white/20 text-white hover:bg-white/10 mt-2"
              data-testid="retry-camera-button"
            >
              Tentar Novamente
            </Button>
          </div>
        ) : (
          // Stream de vídeo ativo
          <video
            ref={videoRef}
            autoPlay={true}
            playsInline={true}
            muted={true}
            controls={false}
            className="w-full h-full object-cover"
            data-testid="camera-video"
            onLoadedMetadata={() => {
              console.log('🎥 Vídeo carregado com sucesso - metadata ready');
            }}
            onCanPlay={() => {
              console.log('🎥 Vídeo pronto para reprodução');
            }}
            onPlaying={() => {
              console.log('🎥 Vídeo está reproduzindo!');
            }}
            onError={(e) => {
              console.error('Erro no elemento video:', e);
              setError('Erro na reprodução do vídeo');
            }}
          />
        )}
      </div>

      {/* Mensagem motivacional */}
      {isActive && (
        <div className="mt-3 text-center">
          <p className="text-white/80 text-sm font-medium">
            Lembre-se: Você é mais forte que seus impulsos
          </p>
          <p className="text-white/60 text-xs mt-1">
            Esta é a pessoa que você quer proteger
          </p>
        </div>
      )}
    </div>
  );
}