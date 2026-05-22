import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { QrCode, Camera, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Scanner() {
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [cameras, setCameras] = useState([]);
  const scannerRef = useRef(null);
  const activeRef = useRef(false);

  useEffect(() => {
    Html5Qrcode.getCameras()
      .then(setCameras)
      .catch(() => setError('Não foi possível acessar as câmeras. Verifique as permissões.'));
    return () => stopScanner();
  }, []);

  async function startScanner(cameraId) {
    if (activeRef.current) return;
    setError('');
    setScanning(true);

    const scanner = new Html5Qrcode('qr-reader');
    scannerRef.current = scanner;
    activeRef.current = true;

    try {
      await scanner.start(
        cameraId || { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (text) => {
          handleScan(text);
        },
        () => {}
      );
    } catch (err) {
      setError('Erro ao iniciar câmera. Verifique as permissões do navegador.');
      setScanning(false);
      activeRef.current = false;
    }
  }

  async function stopScanner() {
    if (scannerRef.current && activeRef.current) {
      try {
        await scannerRef.current.stop();
      } catch {}
      activeRef.current = false;
    }
    setScanning(false);
  }

  function handleScan(text) {
    stopScanner();
    // Extract equipment ID from URL or use raw value
    const match = text.match(/\/equipamento\/(\d+)/);
    if (match) {
      navigate(`/equipamento/${match[1]}`);
    } else if (/^\d+$/.test(text.trim())) {
      navigate(`/equipamento/${text.trim()}`);
    } else {
      toast.error('QR Code não reconhecido. Escaneie um QR Code de equipamento.');
    }
  }

  return (
    <div className="p-4 max-w-md mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Escanear QR Code</h1>
        <p className="text-sm text-gray-500 mt-1">Aponte a câmera para o QR Code do equipamento</p>
      </div>

      {/* Scanner area */}
      <div className="card overflow-hidden">
        {!scanning ? (
          <div className="p-8 flex flex-col items-center gap-4 text-center">
            <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center">
              <QrCode size={40} className="text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-gray-800">Câmera desligada</p>
              <p className="text-sm text-gray-500 mt-1">Clique no botão abaixo para iniciar</p>
            </div>
            <button
              onClick={() => startScanner(cameras.find(c => c.label.toLowerCase().includes('back'))?.id)}
              className="btn-primary gap-2"
            >
              <Camera size={18} />
              Iniciar Câmera
            </button>
          </div>
        ) : (
          <div className="relative">
            <div id="qr-reader" className="w-full" />
            <div className="p-3 flex justify-center">
              <button onClick={stopScanner} className="btn-secondary text-sm">
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Camera selector if multiple cameras */}
      {cameras.length > 1 && !scanning && (
        <div className="card p-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Selecionar câmera:</p>
          <div className="space-y-2">
            {cameras.map((cam) => (
              <button
                key={cam.id}
                onClick={() => startScanner(cam.id)}
                className="w-full text-left px-3 py-2 rounded-lg bg-gray-50 hover:bg-blue-50 text-sm text-gray-700 hover:text-blue-700 transition-colors"
              >
                {cam.label || `Câmera ${cam.id}`}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="card p-4 space-y-2">
        <p className="text-sm font-semibold text-gray-700">Como usar:</p>
        <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
          <li>Clique em "Iniciar Câmera"</li>
          <li>Permita o acesso à câmera quando solicitado</li>
          <li>Aponte para o QR Code do equipamento</li>
          <li>O sistema abre automaticamente a página do equipamento</li>
          <li>Escolha "Retirar" ou "Devolver"</li>
        </ol>
      </div>
    </div>
  );
}
