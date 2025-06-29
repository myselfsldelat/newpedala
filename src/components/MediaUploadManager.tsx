
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  Image as ImageIcon, 
  Video, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Camera
} from 'lucide-react';
import useMediaUpload from '@/hooks/useMediaUpload';
import { cn } from '@/lib/utils';

const MediaUploadManager: React.FC = () => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [metadata, setMetadata] = useState({
    title: '',
    description: '',
    motivation: ''
  });
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { uploading, uploadProgress, processFiles, uploadToSupabase } = useMediaUpload();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFiles = (files: FileList) => {
    const processedFiles = processFiles(files);
    setSelectedFiles(prev => [...prev, ...processedFiles.map(pf => pf.file)]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    
    if (!metadata.title.trim()) {
      return;
    }

    const mediaFiles = processFiles(selectedFiles as any);
    const success = await uploadToSupabase(mediaFiles, metadata);
    
    if (success) {
      setSelectedFiles([]);
      setMetadata({ title: '', description: '', motivation: '' });
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <ImageIcon className="h-6 w-6 text-blue-500" />;
    } else if (file.type.startsWith('video/')) {
      return <Video className="h-6 w-6 text-purple-500" />;
    }
    return <Upload className="h-6 w-6 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-6 w-6 text-event-orange" />
            Upload de Mídia - Galeria Histórica
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Upload Area */}
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all",
              dragActive 
                ? "border-event-orange bg-orange-50" 
                : "border-gray-300 hover:border-event-orange hover:bg-gray-50"
            )}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={openFileDialog}
          >
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-700 mb-2">
              Arraste arquivos aqui ou clique para selecionar
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Suporte: PNG, JPEG (imagens) e MP4 (vídeos)
            </p>
            <p className="text-xs text-gray-400">
              Tamanho máximo: 50MB por arquivo
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/png,image/jpeg,image/jpg,video/mp4"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
            className="hidden"
          />

          {/* Selected Files */}
          {selectedFiles.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Arquivos Selecionados</h3>
              <div className="space-y-2">
                {selectedFiles.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {getFileIcon(file)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metadata Form */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Informações do Conteúdo</h3>
            
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={metadata.title}
                  onChange={(e) => setMetadata(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Título para a galeria"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={metadata.description}
                  onChange={(e) => setMetadata(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descrição do conteúdo..."
                  className="mt-1 min-h-[80px]"
                />
              </div>
              
              <div>
                <Label htmlFor="motivation">Mensagem Motivacional</Label>
                <Textarea
                  id="motivation"
                  value={metadata.motivation}
                  onChange={(e) => setMetadata(prev => ({ ...prev, motivation: e.target.value }))}
                  placeholder="Mensagem inspiradora sobre este momento..."
                  className="mt-1 min-h-[80px]"
                />
              </div>
            </div>
          </div>

          {/* Upload Progress */}
          {uploadProgress.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-medium">Progresso do Upload</h3>
              {uploadProgress.map((progress) => (
                <div key={progress.fileName} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="truncate flex-1">{progress.fileName}</span>
                    <div className="flex items-center gap-2">
                      {progress.status === 'uploading' && (
                        <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                      )}
                      {progress.status === 'success' && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                      {progress.status === 'error' && (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  </div>
                  <Progress value={progress.progress} className="w-full" />
                </div>
              ))}
            </div>
          )}

          {/* Upload Button */}
          <Button
            onClick={handleUpload}
            disabled={uploading || selectedFiles.length === 0 || !metadata.title.trim()}
            className="w-full bg-event-green hover:bg-green-600"
            size="lg"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Enviar {selectedFiles.length > 0 ? `${selectedFiles.length} arquivo(s)` : ''}
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default MediaUploadManager;
