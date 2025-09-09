import { useRef, useState } from "react";
import { Camera, CameraOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CameraShame() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [ativo, setAtivo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const iniciarCamera = async () => {
    try {
      setError(null);
      console.log('🎥 Iniciando câmera...');
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });

      console.log('🎥 Stream obtido:', mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        
        // Forçar reprodução imediatamente
        await videoRef.current.play();
        setAtivo(true);
        
        console.log('🎥 Câmera ativada e reproduzindo com sucesso!');
      }
    } catch (err: any) {
      console.error("Erro ao iniciar câmera:", err);
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
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

  const pararCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setAtivo(false);
      console.log('🎥 Câmera parada');
    }
  };

  return (
    <div 
      className="rounded-2xl shadow-xl p-4 border border-border text-white relative"
      style={{ backgroundColor: '#000515' }}
      data-testid="camera-shame"
    >
      {/* Header do componente */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold flex items-center">
          <Camera className="w-5 h-5 mr-2" />
          Câmera da Vergonha
        </h2>
        
        {ativo && (
          <Button
            onClick={pararCamera}
            variant="outline"
            size="sm"
            className="bg-transparent border-white/20 text-white hover:bg-white/10"
            data-testid="camera-stop-button"
          >
            <CameraOff className="w-4 h-4 mr-2" />
            Parar
          </Button>
        )}
      </div>

      {/* Área do vídeo */}
      <div className="aspect-video bg-gray-900 rounded-xl flex items-center justify-center overflow-hidden">
        {ativo ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover rounded-xl"
            data-testid="camera-video"
          />
        ) : error ? (
          <div className="text-center p-6">
            <p className="text-red-400 text-sm mb-4">{error}</p>
            <Button
              onClick={iniciarCamera}
              size="sm"
              className="bg-red-600 hover:bg-red-700"
              data-testid="retry-camera-button"
            >
              Tentar Novamente
            </Button>
          </div>
        ) : (
          <div className="text-center p-6">
            <Camera className="w-12 h-12 text-gray-400 mb-3 mx-auto" />
            <p className="text-gray-400 text-sm mb-4">
              Clique abaixo para ativar sua câmera
            </p>
            <Button
              onClick={iniciarCamera}
              className="bg-red-600 hover:bg-red-700 font-semibold"
              data-testid="activate-camera-button"
            >
              Ativar Câmera
            </Button>
          </div>
        )}
      </div>

      {/* Mensagem motivacional */}
      {ativo && (
        <div className="mt-3 text-center">
          <p className="text-white/90 text-sm font-medium">
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