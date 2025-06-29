
import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GalleryErrorProps {
  error: string;
  onRetry: () => void;
}

const GalleryError: React.FC<GalleryErrorProps> = ({ error, onRetry }) => {
  return (
    <div className="flex flex-col justify-center items-center py-12">
      <div className="bg-red-50 border border-red-200 rounded-lg p-8 max-w-md mx-auto text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-red-700 mb-2">
          Erro ao Carregar Galeria
        </h3>
        <p className="text-red-600 mb-6 text-sm leading-relaxed">
          {error}
        </p>
        <Button 
          onClick={onRetry}
          className="bg-event-orange hover:bg-orange-600 text-white px-6 py-2 rounded-md transition-colors"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Tentar Novamente
        </Button>
        <p className="text-xs text-gray-500 mt-4">
          Se o problema persistir, entre em contato com o administrador.
        </p>
      </div>
    </div>
  );
};

export default GalleryError;
