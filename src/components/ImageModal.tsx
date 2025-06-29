
import React, { useEffect, useState } from 'react';
import { supabaseCustom } from '@/integrations/supabase/client-custom';
import { GalleryItem as GalleryItemType } from '@/data/gallery';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { X, ChevronLeft, ChevronRight, Heart, MessageCircle, Send, Quote } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Comment {
  id: string;
  author_name: string;
  content: string;
  created_at: string;
  is_approved: boolean;
}

interface ImageModalProps {
  item?: GalleryItemType;
  isOpen: boolean;
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
  hasNext: boolean;
  hasPrevious: boolean;
}

const ImageModal: React.FC<ImageModalProps> = ({
  item,
  isOpen,
  onClose,
  onNext,
  onPrevious,
  hasNext,
  hasPrevious,
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState({ author: '', content: '' });
  const [loadingComments, setLoadingComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    if (item && isOpen) {
      fetchComments();
    }
  }, [item, isOpen]);

  const fetchComments = async () => {
    if (!item) return;
    
    setLoadingComments(true);
    try {
      const { data, error } = await (supabaseCustom as any)
        .from('comments')
        .select('*')
        .eq('gallery_item_id', String(item.id))
        .eq('is_approved', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!item || !newComment.author.trim() || !newComment.content.trim()) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha seu nome e comentário.',
        variant: 'destructive',
      });
      return;
    }

    setSubmittingComment(true);
    try {
      const { error } = await (supabaseCustom as any).from('comments').insert({
        gallery_item_id: String(item.id),
        author_name: newComment.author.trim(),
        content: newComment.content.trim(),
        is_approved: false,
      });
      
      if (error) throw error;
      
      setNewComment({ author: '', content: '' });
      toast({
        title: 'Comentário enviado!',
        description: 'Seu comentário será revisado antes de aparecer na galeria.',
      });
    } catch (error: any) {
      console.error('Error submitting comment:', error);
      toast({
        title: 'Erro ao enviar comentário',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSubmittingComment(false);
    }
  };

  const renderMedia = () => {
    if (!item) return null;

    const isVideo = item.media_type === 'video' || 
                   item.image.includes('.mp4') || 
                   item.image.includes('video');

    if (isVideo) {
      return (
        <video 
          src={item.image} 
          controls 
          className="w-full max-h-[70vh] object-contain rounded-lg"
          autoPlay={false}
        >
          Seu navegador não suporta reprodução de vídeo.
        </video>
      );
    }

    return (
      <img 
        src={item.image} 
        alt={item.title} 
        className="w-full max-h-[70vh] object-contain rounded-lg"
      />
    );
  };

  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden p-0">
        <div className="flex h-full">
          {/* Media Section */}
          <div className="flex-1 relative bg-black flex items-center justify-center">
            {renderMedia()}
            
            {/* Navigation Controls */}
            <Button
              variant="outline"
              size="icon"
              className="absolute top-4 right-4 bg-white/90 hover:bg-white"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>

            {hasPrevious && (
              <Button
                variant="outline"
                size="icon"
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white"
                onClick={onPrevious}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}

            {hasNext && (
              <Button
                variant="outline"
                size="icon"
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white"
                onClick={onNext}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}

            {item.is_external_link && (
              <Badge className="absolute top-4 left-4 bg-blue-500">
                Link Externo
              </Badge>
            )}
          </div>

          {/* Info Section */}
          <div className="w-96 bg-white flex flex-col max-h-[95vh]">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{item.title}</h2>
              {item.description && (
                <p className="text-gray-600 mb-4">{item.description}</p>
              )}
              
              {item.personal_message && (
                <Card className="mb-4 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Quote className="h-5 w-5 text-blue-500 mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-blue-800 font-medium italic">
                          {item.personal_message}
                        </p>
                        <p className="text-blue-600 text-sm mt-2">
                          — Mensagem especial do Bike Night Amazonas
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {item.motivation && (
                <Card className="mb-4 bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Heart className="h-5 w-5 text-orange-500 mt-1 flex-shrink-0" />
                      <p className="text-orange-800 font-medium">{item.motivation}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Comments Section */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="p-4 border-b">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-gray-600" />
                  <h3 className="font-semibold text-gray-900">
                    Comentários ({comments.length})
                  </h3>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loadingComments ? (
                  <p className="text-center text-gray-500">Carregando comentários...</p>
                ) : comments.length === 0 ? (
                  <p className="text-center text-gray-500">
                    Seja o primeiro a comentar!
                  </p>
                ) : (
                  comments.map((comment) => (
                    <Card key={comment.id} className="border-gray-200">
                      <CardContent className="p-3">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium text-gray-900">
                            {comment.author_name}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(comment.created_at).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        <p className="text-gray-700 text-sm">{comment.content}</p>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>

              {/* Add Comment Form */}
              <div className="p-4 border-t bg-gray-50">
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Seu nome"
                    value={newComment.author}
                    onChange={(e) => setNewComment({ ...newComment, author: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Textarea
                    placeholder="Escreva seu comentário..."
                    value={newComment.content}
                    onChange={(e) => setNewComment({ ...newComment, content: e.target.value })}
                    rows={3}
                    className="resize-none text-sm"
                  />
                  <Button
                    onClick={handleSubmitComment}
                    disabled={submittingComment || !newComment.author.trim() || !newComment.content.trim()}
                    className="w-full bg-event-orange hover:bg-orange-600"
                    size="sm"
                  >
                    {submittingComment ? (
                      'Enviando...'
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Enviar Comentário
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImageModal;
