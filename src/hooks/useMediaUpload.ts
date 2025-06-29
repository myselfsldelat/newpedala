
import { useState } from 'react';
import { supabaseCustom } from '@/integrations/supabase/client-custom';
import { useToast } from '@/hooks/use-toast';

interface MediaFile {
  file: File;
  type: 'image' | 'video';
  preview: string;
}

interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'uploading' | 'success' | 'error';
}

const useMediaUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const { toast } = useToast();

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    const allowedImageTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    const allowedVideoTypes = ['video/mp4'];
    const maxSize = 50 * 1024 * 1024; // 50MB

    if (file.size > maxSize) {
      return { valid: false, error: 'Arquivo muito grande. Máximo 50MB.' };
    }

    if (!allowedImageTypes.includes(file.type) && !allowedVideoTypes.includes(file.type)) {
      return { valid: false, error: 'Formato não suportado. Use PNG, JPEG ou MP4.' };
    }

    return { valid: true };
  };

  const processFiles = (files: FileList): MediaFile[] => {
    const processedFiles: MediaFile[] = [];

    Array.from(files).forEach(file => {
      const validation = validateFile(file);
      
      if (!validation.valid) {
        toast({
          title: 'Arquivo inválido',
          description: `${file.name}: ${validation.error}`,
          variant: 'destructive',
        });
        return;
      }

      const type = file.type.startsWith('image/') ? 'image' : 'video';
      const preview = URL.createObjectURL(file);

      processedFiles.push({
        file,
        type,
        preview
      });
    });

    return processedFiles;
  };

  const uploadToSupabase = async (mediaFiles: MediaFile[], metadata: { title: string; description: string; motivation: string }) => {
    setUploading(true);
    const successfulUploads: string[] = [];

    try {
      console.log('Starting upload process for', mediaFiles.length, 'files');

      for (const mediaFile of mediaFiles) {
        const fileName = `${Date.now()}-${mediaFile.file.name}`;
        
        // Update progress
        setUploadProgress(prev => [
          ...prev.filter(p => p.fileName !== mediaFile.file.name),
          { fileName: mediaFile.file.name, progress: 0, status: 'uploading' }
        ]);

        try {
          // Convert file to base64 data URL
          const reader = new FileReader();
          const fileDataPromise = new Promise<string>((resolve, reject) => {
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
            reader.readAsDataURL(mediaFile.file);
          });

          const fileData = await fileDataPromise;

          // Progress update to 50%
          setUploadProgress(prev => 
            prev.map(p => 
              p.fileName === mediaFile.file.name 
                ? { ...p, progress: 50 }
                : p
            )
          );

          // Insert into gallery_items table
          const { error } = await (supabaseCustom as any)
            .from('gallery_items')
            .insert({
              title: `${metadata.title} - ${mediaFile.file.name}`,
              image: fileData,
              description: metadata.description,
              motivation: metadata.motivation,
            });

          if (error) {
            console.error('Error inserting to database:', error);
            throw error;
          }

          console.log('Successfully uploaded:', mediaFile.file.name);

          // Update progress to success
          setUploadProgress(prev => 
            prev.map(p => 
              p.fileName === mediaFile.file.name 
                ? { ...p, progress: 100, status: 'success' as const }
                : p
            )
          );

          successfulUploads.push(mediaFile.file.name);
        } catch (fileError: any) {
          console.error('Error uploading file:', mediaFile.file.name, fileError);
          
          // Update progress to error for this specific file
          setUploadProgress(prev => 
            prev.map(p => 
              p.fileName === mediaFile.file.name 
                ? { ...p, status: 'error' as const }
                : p
            )
          );

          toast({
            title: 'Erro no upload',
            description: `Falha ao enviar ${mediaFile.file.name}: ${fileError.message}`,
            variant: 'destructive',
          });
        }
      }

      if (successfulUploads.length > 0) {
        toast({
          title: 'Upload concluído',
          description: `${successfulUploads.length} arquivo(s) enviado(s) com sucesso.`,
        });
      }

      return successfulUploads.length > 0;
    } catch (error: any) {
      console.error('General upload error:', error);
      
      toast({
        title: 'Erro no upload',
        description: 'Erro geral ao enviar arquivos. Tente novamente.',
        variant: 'destructive',
      });

      return false;
    } finally {
      setUploading(false);
      // Clear progress after 3 seconds
      setTimeout(() => setUploadProgress([]), 3000);
    }
  };

  return {
    uploading,
    uploadProgress,
    validateFile,
    processFiles,
    uploadToSupabase
  };
};

export default useMediaUpload;
