import { useEffect, useState } from 'react';
import { RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface UpdateBannerProps {
  onUpdate: () => void;
  onDismiss: () => void;
}

export function UpdateBanner({ onUpdate, onDismiss }: UpdateBannerProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animación de entrada suave
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleUpdate = () => {
    setIsVisible(false);
    setTimeout(onUpdate, 300); // Esperar a que termine la animación
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 300); // Esperar a que termine la animación
  };

  return (
    <div
      className={`fixed bottom-4 right-4 z-[9999] transition-all duration-300 ease-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
      style={{ maxWidth: '400px' }}
    >
      <Card className="overflow-hidden border-2 border-primary-500 shadow-2xl">
        <div className="bg-gradient-to-r from-primary-600 to-primary-500 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1">
              <div className="bg-white/20 p-2 rounded-full mt-0.5">
                <RefreshCw className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold text-base mb-1">
                  Nueva versión disponible
                </h3>
                <p className="text-white/90 text-sm leading-relaxed">
                  Hemos mejorado tu experiencia. Actualiza ahora para disfrutar de las últimas mejoras.
                </p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="text-white/80 hover:text-white transition-colors p-1 hover:bg-white/10 rounded"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-4 flex gap-2">
            <Button
              onClick={handleUpdate}
              className="flex-1 bg-white text-primary-600 hover:bg-white/90 font-semibold shadow-md"
              size="sm"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar ahora
            </Button>
            <Button
              onClick={handleDismiss}
              variant="ghost"
              className="text-white hover:bg-white/10"
              size="sm"
            >
              Más tarde
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
