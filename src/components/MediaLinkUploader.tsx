
import React, { useState } from 'react';
import { supabaseCustom } from '@/integrations/supabase/client-custom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { Link, Image, Video, Plus, Eye, AlertCircle } from 'lucide-react';

interface MediaLinkFormData {
  title: string;
  mediaUrl: string;
  description: string;
  motivation: string;
  personalMessage: string;
}

const MediaLinkUploader: React.FC = () => {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'unknown'>('unknown');

  const form = useForm<MediaLinkFormData>({
    defaultValues: {
      title: '',
      mediaUrl: '',
      description: '',
      motivation: '',
      personalMessage: '',
    },
  });

  const detectMediaType = (url: string): 'image' | 'video' | 'unknown' => {
    const imageExtensions = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i;
    const videoExtensions = /\.(mp4|avi|mov|wmv|flv|webm|mkv|m4v)$/i;
    
    if (imageExtensions.test(url)) return 'image';
    if (videoExtensions.test(url)) return 'video';
    
    // Check for common video hosting patterns
    if (url.includes('youtube.com') || url.includes('youtu.be') || 
        url.includes('vimeo.com') || url.includes('dailymotion.com')) {
      return 'video';
    }
    
    return 'unknown';
  };

  const handleUrlChange = (url: string) => {
    form.setValue('mediaUrl', url);
    if (url) {
      setPreviewUrl(url);
      setMediaType(detectMediaType(url));
    } else {
      setPreviewUrl('');
      setMediaType('unknown');
    }
  };

  const validateUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (data: MediaLinkFormData) => {
    if (!validateUrl(data.mediaUrl)) {
      toast({
        title: 'URL inválida',
        description: 'Por favor, insira uma URL válida.',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    
    try {
      const { error } = await (supabaseCustom as any).from('gallery_items').insert([
        {
          title: data.title,
          image: data.mediaUrl,
          description: data.description,
          motivation: data.motivation,
          personal_message: data.personalMessage,
          media_type: mediaType,
          is_external_link: true,
        },
      ]);
      
      if (error) throw error;
      
      toast({
        title: 'Mídia adicionada com sucesso!',
        description: `${mediaType === 'video' ? 'Vídeo' : 'Imagem'} foi adicionada à galeria.`,
      });
      
      form.reset();
      setPreviewUrl('');
      setMediaType('unknown');
    } catch (error: any) {
      console.error('Error adding media:', error);
      toast({
        title: 'Erro ao adicionar mídia',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const renderPreview = () => {
    if (!previewUrl) return null;

    return (
      <Card className="mt-4">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-event-orange" />
            <CardTitle className="text-lg">Pré-visualização</CardTitle>
            <Badge variant={mediaType === 'video' ? 'default' : 'secondary'}>
              {mediaType === 'video' ? 'Vídeo' : mediaType === 'image' ? 'Imagem' : 'Desconhecido'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {mediaType === 'image' ? (
            <img 
              src={previewUrl} 
              alt="Preview" 
              className="w-full max-w-md h-auto rounded-lg border shadow-sm"
              onError={() => {
                toast({
                  title: 'Erro ao carregar imagem',
                  description: 'Verifique se a URL está correta e acessível.',
                  variant: 'destructive',
                });
              }}
            />
          ) : mediaType === 'video' ? (
            <video 
              src={previewUrl} 
              controls 
              className="w-full max-w-md h-auto rounded-lg border shadow-sm"
              onError={() => {
                toast({
                  title: 'Erro ao carregar vídeo',
                  description: 'Verifique se a URL está correta e acessível.',
                  variant: 'destructive',
                });
              }}
            >
              Seu navegador não suporta reprodução de vídeo.
            </video>
          ) : (
            <div className="flex items-center gap-2 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <p className="text-amber-800">
                Tipo de mídia não reconhecido. Verifique se a URL está correta.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Link className="h-6 w-6 text-event-orange" />
          <CardTitle>Adicionar Mídia via Link</CardTitle>
        </div>
        <p className="text-sm text-gray-600">
          Adicione fotos e vídeos à galeria usando URLs diretas
        </p>
      </CardHeader>
      
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="mediaUrl"
              rules={{ 
                required: 'URL da mídia é obrigatória',
                validate: (value) => validateUrl(value) || 'URL inválida'
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Link className="h-4 w-4" />
                    URL da Mídia
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://exemplo.com/imagem.jpg ou https://exemplo.com/video.mp4"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        handleUrlChange(e.target.value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {renderPreview()}
            
            <FormField
              control={form.control}
              name="title"
              rules={{ required: 'Título é obrigatório' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Aventura no Rio Amazonas" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descreva o momento capturado nesta mídia..."
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="motivation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mensagem Motivacional</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Uma mensagem inspiradora para os ciclistas..."
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="personalMessage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mensagem Pessoal</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Uma mensagem especial que aparecerá junto com esta mídia na galeria..."
                      rows={4}
                      {...field} 
                    />
                  </FormControl>
                  <p className="text-sm text-gray-500">
                    Esta mensagem será exibida quando os usuários visualizarem este item na galeria.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button 
              type="submit" 
              disabled={uploading || !previewUrl || mediaType === 'unknown'}
              className="w-full bg-event-green hover:bg-green-600"
            >
              {uploading ? (
                'Adicionando...'
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar à Galeria
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default MediaLinkUploader;
