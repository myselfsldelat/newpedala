
import React, { useState, useEffect } from 'react';
import { supabaseOperations } from '@/integrations/supabase/client-custom';
import { useAuth } from './AuthProvider';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertCircle, MessageSquare, Check, X, Trash } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Comment } from '@/integrations/supabase/custom-types';

interface CommentWithGallery extends Comment {
  gallery_title?: string;
  gallery_image?: string;
}

const AdminCommentsView: React.FC = () => {
  const [comments, setComments] = useState<CommentWithGallery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState('pending');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedComment, setSelectedComment] = useState<CommentWithGallery | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const { isAdmin } = useAuth();
  
  const PAGE_SIZE = 10;

  useEffect(() => {
    const fetchComments = async () => {
      try {
        let isPending = tab === 'pending';
        
        const { data, error, count } = await supabaseOperations.getComments(!isPending, page, PAGE_SIZE);
        
        if (error) throw error;
        
        // Format the results
        const formattedComments: CommentWithGallery[] = data?.map((comment: any) => {
          const { gallery_title, gallery_image, ...rest } = comment;
          return {
            ...rest,
            gallery_title: typeof gallery_title === 'object' ? gallery_title?.title : null,
            gallery_image: typeof gallery_image === 'object' ? gallery_image?.image : null
          };
        }) || [];
        
        setComments(formattedComments);
        
        if (count !== null) {
          setTotalPages(Math.ceil(count / PAGE_SIZE));
        }
      } catch (error: any) {
        setError(error.message || 'Erro ao carregar comentários');
      } finally {
        setLoading(false);
      }
    };
    
    if (isAdmin) {
      fetchComments();
    }
  }, [isAdmin, tab, page]);

  const handleApproveComment = async (commentId: string) => {
    try {
      const { error } = await supabaseOperations.updateComment(commentId, { is_approved: true });
      
      if (error) throw error;
      
      toast({
        title: 'Comentário aprovado',
        description: 'O comentário foi aprovado e está disponível para visualização'
      });
      
      setComments(comments.filter(c => c.id !== commentId));
    } catch (error: any) {
      toast({
        title: 'Erro ao aprovar comentário',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleRejectComment = async (commentId: string) => {
    try {
      const { error } = await supabaseOperations.deleteComment(commentId);
      
      if (error) throw error;
      
      toast({
        title: 'Comentário rejeitado',
        description: 'O comentário foi excluído com sucesso'
      });
      
      setComments(comments.filter(c => c.id !== commentId));
    } catch (error: any) {
      toast({
        title: 'Erro ao rejeitar comentário',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const openViewDialog = (comment: CommentWithGallery) => {
    setSelectedComment(comment);
    setIsViewDialogOpen(true);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <MessageSquare className="h-8 w-8 text-event-orange" />
        <h1 className="text-3xl font-bold text-event-dark">
          Gerenciar Comentários
        </h1>
      </div>
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <div className="flex justify-between items-center mb-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="pending" onClick={() => { setTab('pending'); setPage(1); }} className="flex items-center gap-2">
              <Badge className="bg-amber-500 text-white">Pendentes</Badge>
              Aguardando
            </TabsTrigger>
            <TabsTrigger value="approved" onClick={() => { setTab('approved'); setPage(1); }} className="flex items-center gap-2">
              <Badge className="bg-green-500 text-white">Aprovados</Badge>
              Publicados
            </TabsTrigger>
          </TabsList>
        </div>
        
        <Card className="p-0 overflow-hidden">
          {loading ? (
            <div className="text-center py-16">
              <div className="text-lg text-gray-600">Carregando comentários...</div>
            </div>
          ) : (
            <TabsContent value={tab} className="mt-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold">Data</TableHead>
                    <TableHead className="font-semibold">Autor</TableHead>
                    <TableHead className="font-semibold">Imagem</TableHead>
                    <TableHead className="font-semibold">Comentário</TableHead>
                    <TableHead className="text-right font-semibold">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {comments.map((comment) => (
                    <TableRow key={comment.id} className="hover:bg-gray-50">
                      <TableCell className="whitespace-nowrap">
                        <div className="font-medium">
                          {new Date(comment.created_at).toLocaleDateString('pt-BR')}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: ptBR })}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{comment.author_name}</TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">{comment.gallery_title || 'Sem título'}</span>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="truncate text-sm">{comment.content}</div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline" 
                            size="sm"
                            onClick={() => openViewDialog(comment)}
                          >
                            Ver
                          </Button>
                          
                          {tab === 'pending' ? (
                            <>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="bg-green-50 text-green-600 border-green-200 hover:bg-green-100"
                                onClick={() => handleApproveComment(comment.id)}
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Aprovar
                              </Button>
                              
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                                onClick={() => handleRejectComment(comment.id)}
                              >
                                <X className="h-4 w-4 mr-1" />
                                Rejeitar
                              </Button>
                            </>
                          ) : (
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => handleRejectComment(comment.id)}
                            >
                              <Trash className="h-4 w-4 mr-1" />
                              Excluir
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  
                  {comments.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        <div className="text-gray-500">
                          {tab === 'pending' 
                            ? 'Não há comentários pendentes de aprovação.' 
                            : 'Não há comentários aprovados.'}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              
              {totalPages > 1 && (
                <div className="p-4 border-t">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => setPage(Math.max(1, page - 1))}
                          className={page <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                      
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum = page;
                        if (page <= 3) {
                          pageNum = i + 1;
                        } else if (page >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = page - 2 + i;
                        }
                        
                        if (pageNum > 0 && pageNum <= totalPages) {
                          return (
                            <PaginationItem key={i}>
                              <PaginationLink 
                                onClick={() => setPage(pageNum)}
                                isActive={page === pageNum}
                              >
                                {pageNum}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        }
                        return null;
                      })}
                      
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => setPage(Math.min(totalPages, page + 1))}
                          className={page >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </TabsContent>
          )}
        </Card>
      </Tabs>
      
      {/* View Comment Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Visualizar Comentário</DialogTitle>
            <DialogDescription>
              Detalhes completos do comentário selecionado.
            </DialogDescription>
          </DialogHeader>
          
          {selectedComment && (
            <div className="space-y-6">
              <div className="flex space-x-4 items-start">
                <div className="w-1/3">
                  <img 
                    src={selectedComment.gallery_image || '/placeholder.svg'} 
                    alt={selectedComment.gallery_title || 'Imagem da galeria'} 
                    className="w-full h-auto rounded-lg border"
                  />
                  <p className="text-sm text-gray-500 mt-2 text-center">
                    {selectedComment.gallery_title || 'Sem título'}
                  </p>
                </div>
                
                <div className="w-2/3 space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Autor</h3>
                    <p className="text-base font-medium">{selectedComment.author_name}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Data</h3>
                    <p className="text-base">
                      {new Date(selectedComment.created_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>
                    <Badge className={selectedComment.is_approved ? "bg-green-500" : "bg-amber-500"}>
                      {selectedComment.is_approved ? 'Aprovado' : 'Pendente'}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Comentário</h3>
                <div className="bg-gray-50 p-4 rounded-md border">
                  <p className="text-gray-800">{selectedComment.content}</p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 mt-6">
            {selectedComment && !selectedComment.is_approved ? (
              <>
                <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                  Fechar
                </Button>
                <Button 
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    handleApproveComment(selectedComment.id);
                    setIsViewDialogOpen(false);
                  }}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Aprovar
                </Button>
                <Button 
                  variant="destructive"
                  onClick={() => {
                    handleRejectComment(selectedComment.id);
                    setIsViewDialogOpen(false);
                  }}
                >
                  <X className="h-4 w-4 mr-2" />
                  Rejeitar
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                  Fechar
                </Button>
                <Button 
                  variant="destructive"
                  onClick={() => {
                    selectedComment && handleRejectComment(selectedComment.id);
                    setIsViewDialogOpen(false);
                  }}
                >
                  Excluir
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCommentsView;
