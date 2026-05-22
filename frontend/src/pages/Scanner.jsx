import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { QrCode, Camera, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Scanner() {
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const scannerRef = useRef(null);
  const activeRef = useRef(false);

  // Cleanup on unmount
  useEffect(() => {
    return () => { stopScanner(); };
  }, []);

  // Inicia o scanner DEPOIS que o div 'qr-reader' foi renderizado no DOM
  useEffect(() => {
    if (scanning && !activeRef.current) {
      initScanner();
    }
  }, [scanning]);

  async function initScanner() {
    try {
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;
      activeRef.current = true;

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (text) => handleScan(text),
        () => {}
      );
    } catch (err) {
      console.error('Erro câmera:', err);
      // Tenta câmera frontal como fallback
      try {
        await scannerRef.current.start(
          { facingMode: 'user' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (text) => handleScan(text),
          () => {}
        );
      } catch {
        setError(
          'Não foi possível acessar a câmera. Verifique se o navegador tem permissão e se você está acessando via HTTPS.'
        );
        setScanning(false);
        activeRef.current = false;
        scannerRef.current = null;
      }
    }
  }

  async function stopScanner() {
    if (scannerRef.current && activeRef.current) {
      try {
        await scannerRef.current.stop();
      } catch {}
      scannerRef.current = null;
      activeRef.current = false;
    }
    setScanning(false);
  }

  function handleScan(text) {
    stopScanner();
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

      <div className="card overflow-hidden">
        {/* div sempre renderizado — o scanner precisa que ele exista no DOM */}
        <div id="qr-reader" className={scanning ? 'w-full' : 'hidden'} />

        {scanning && (
          <div className="p-3 flex justify-center">
            <button onClick={stopScanner} className="btn-secondary text-sm">
              Cancelar
            </button>
          </div>
        )}

        {!scanning && (
          <div className="p-8 flex flex-col items-center gap-4 text-center">
            <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center">
              <QrCode size={40} className="text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-gray-800">Câmera desligada</p>
              <p className="text-sm text-gray-500 mt-1">Clique no botão abaixo para iniciar</p>
            </div>
            <button
              onClick={() => { setError(''); setScanning(true); }}
              className="btn-primary gap-2"
            >
              <Camera size={18} />
              Iniciar Câmera
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium mb-1">{error}</p>
            <p className="text-red-500">Dicas:</p>
            <ul className="list-disc list-inside space-y-0.5 text-red-500">
              <li>Use HTTPS (não HTTP)</li>
              <li>Clique em "Permitir" quando o browser pedir acesso à câmera</li>
              <li>No celular: Configurações → Navegador → Permissões → Câmera</li>
            </ul>
          </div>
        </div>
      )}

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
