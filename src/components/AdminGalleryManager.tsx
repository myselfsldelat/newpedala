import React, { useState, useEffect } from 'react';
import { supabaseOperations } from '@/integrations/supabase/client-custom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { toast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { Edit, Trash, Image, Plus, Camera, RefreshCw, Loader2, Upload, Link, Users } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import MediaUploadManager from './MediaUploadManager';
import MediaLinkUploader from './MediaLinkUploader';
import AdminUserManager from './AdminUserManager';
import { GalleryItem } from '@/integrations/supabase/custom-types';

interface GalleryItemFormData {
  title: string;
  image: string;
  description: string;
  motivation: string;
  personal_message: string;
}

const AdminGalleryManager: React.FC = () => {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const form = useForm<GalleryItemFormData>({
    defaultValues: {
      title: '',
      image: '',
      description: '',
      motivation: '',
      personal_message: '',
    },
  });

  useEffect(() => {
    fetchGalleryItems();
  }, []);

  useEffect(() => {
    if (selectedItem && isEditModalOpen) {
      form.reset({
        title: selectedItem.title,
        image: selectedItem.image,
        description: selectedItem.description || '',
        motivation: selectedItem.motivation || '',
        personal_message: selectedItem.personal_message || '',
      });
    }
  }, [selectedItem, isEditModalOpen, form]);

  const fetchGalleryItems = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabaseOperations.getGalleryItems();
      
      if (error) throw error;
      
      setItems(data || []);
    } catch (error: any) {
      console.error('Error fetching gallery items:', error);
      setError(error.message || 'Erro ao carregar imagens da galeria');
      toast({
        title: 'Erro ao carregar imagens',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshGallery = async () => {
    setIsRefreshing(true);
    try {
      await fetchGalleryItems();
      toast({
        title: 'Galeria atualizada',
        description: 'As imagens foram atualizadas com sucesso.',
      });
    } catch (error) {
      // Erros já são tratados em fetchGalleryItems
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleEditItem = async (data: GalleryItemFormData) => {
    if (!selectedItem) return;
    
    try {
      const { error } = await supabaseOperations.updateGalleryItem(String(selectedItem.id), {
        title: data.title,
        image: data.image,
        description: data.description,
        motivation: data.motivation,
        personal_message: data.personal_message,
      });
      
      if (error) throw error;
      
      toast({
        title: 'Item atualizado',
        description: 'O item foi atualizado com sucesso.',
      });
      
      setIsEditModalOpen(false);
      fetchGalleryItems();
    } catch (error: any) {
      console.error('Error updating gallery item:', error);
      toast({
        title: 'Erro ao atualizar item',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDeleteItem = async () => {
    if (!selectedItem) return;
    
    try {
      const { error } = await supabaseOperations.deleteGalleryItem(String(selectedItem.id));
      
      if (error) throw error;
      
      toast({
        title: 'Item excluído',
        description: 'O item foi excluído com sucesso.',
      });
      
      setIsDeleteModalOpen(false);
      fetchGalleryItems();
    } catch (error: any) {
      console.error('Error deleting gallery item:', error);
      toast({
        title: 'Erro ao excluir item',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const renderMediaPreview = (item: GalleryItem) => {
    const isVideo = item.media_type === 'video' || 
                   item.image.includes('.mp4') || 
                   item.image.includes('video');
    
    if (isVideo) {
      return (
        <video 
          src={item.image} 
          className="w-full h-full object-cover"
          muted
          onError={(e) => {
            (e.target as HTMLVideoElement).style.display = 'none';
          }}
        />
      );
    }
    
    return (
      <img 
        src={item.image} 
        alt={item.title} 
        className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
        onError={(e) => {
          (e.target as HTMLImageElement).src = '/placeholder.svg';
        }}
      />
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 my-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Camera className="h-8 w-8 text-event-orange" />
          <h2 className="text-3xl font-bold text-event-dark">Painel Administrativo</h2>
        </div>
        <Button 
          onClick={refreshGallery}
          variant="outline"
          disabled={isRefreshing}
          className="flex items-center gap-2 hover:bg-gray-50"
        >
          {isRefreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Atualizar
        </Button>
      </div>

      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="upload" className="flex items-center gap-2 py-3">
            <Upload className="h-4 w-4" />
            Upload de Arquivos
          </TabsTrigger>
          <TabsTrigger value="links" className="flex items-center gap-2 py-3">
            <Link className="h-4 w-4" />
            Adicionar por Link
          </TabsTrigger>
          <TabsTrigger value="manage" className="flex items-center gap-2 py-3">
            <Image className="h-4 w-4" />
            Gerenciar Galeria ({items.length})
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2 py-3">
            <Users className="h-4 w-4" />
            Usuários Admin
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="mt-6">
          <MediaUploadManager />
        </TabsContent>

        <TabsContent value="links" className="mt-6">
          <MediaLinkUploader />
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          <AdminUserManager />
        </TabsContent>

        <TabsContent value="manage" className="mt-6">
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertTitle>Erro ao carregar itens</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {loading ? (
            <div className="flex flex-col justify-center items-center py-16">
              <Loader2 className="w-12 h-12 text-event-orange animate-spin mb-4" />
              <div className="text-lg text-gray-600">Carregando galeria...</div>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <Image className="h-20 w-20 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">Nenhum item encontrado</h3>
              <p className="text-gray-500 mb-6">Comece adicionando fotos e vídeos à sua galeria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {items.map((item) => (
                <div key={String(item.id)} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="h-48 overflow-hidden bg-gray-100 relative">
                    {renderMediaPreview(item)}
                    
                    {item.is_external_link && (
                      <div className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 rounded text-xs">
                        Link
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-2 text-gray-800 line-clamp-1">{item.title}</h3>
                    <p className="text-gray-600 text-sm line-clamp-2 h-10 mb-3">
                      {item.description || 'Sem descrição'}
                    </p>
                    
                    {item.personal_message && (
                      <div className="mb-3 p-2 bg-blue-50 border-l-4 border-blue-500 rounded">
                        <p className="text-sm text-blue-700 italic">
                          "{item.personal_message}"
                        </p>
                      </div>
                    )}
                    
                    <div className="text-xs text-gray-500 mb-3">
                      Adicionado em: {new Date(item.created_at).toLocaleDateString('pt-BR')}
                    </div>
                    
                    <div className="flex justify-between gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedItem(item);
                          setIsEditModalOpen(true);
                        }}
                        className="flex-1 hover:bg-blue-50 hover:border-blue-300"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedItem(item);
                          setIsDeleteModalOpen(true);
                        }}
                        className="flex-1 hover:bg-red-50 hover:border-red-300 text-red-600"
                      >
                        <Trash className="h-4 w-4 mr-1" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Item da Galeria</DialogTitle>
            <DialogDescription>
              Modifique as informações do item selecionado da galeria.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleEditItem)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título</FormLabel>
                    <FormControl>
                      <Input placeholder="Título do item" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="image"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL da Mídia</FormLabel>
                    <FormControl>
                      <Input placeholder="https://exemplo.com/media.jpg" {...field} />
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
                      <Textarea placeholder="Descrição do item" rows={3} {...field} />
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
                      <Textarea placeholder="Mensagem inspiradora" rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="personal_message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mensagem Pessoal</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Mensagem pessoal para este item" rows={4} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" className="bg-event-blue hover:bg-blue-600">
                  Salvar Alterações
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Esta ação não pode ser desfeita. O item será permanentemente removido da galeria.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-gray-700">
              Tem certeza que deseja excluir <strong>"{selectedItem?.title}"</strong>?
            </p>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteItem}
            >
              Excluir Permanentemente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminGalleryManager;
