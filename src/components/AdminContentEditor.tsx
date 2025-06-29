
import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseOperations } from '@/integrations/supabase/client-custom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast as sonnerToast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';

const contentSchema = z.object({
  history_title: z.string().min(1, 'Título é obrigatório'),
  history_subtitle: z.string().min(1, 'Subtítulo é obrigatório'),
  history_event_title: z.string().min(1, 'Título do evento é obrigatório'),
  history_main_title: z.string().min(1, 'Título principal é obrigatório'),
  history_p1: z.string().min(1, 'Parágrafo 1 é obrigatório'),
  history_p2: z.string().min(1, 'Parágrafo 2 é obrigatório'),
  history_p3: z.string().min(1, 'Parágrafo 3 é obrigatório'),
});

type ContentFormData = z.infer<typeof contentSchema>;

const AdminContentEditor: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: contentData, isLoading, isError, error } = useQuery({
    queryKey: ['site_content'],
    queryFn: async () => {
      const { data, error } = await supabaseOperations.getSiteContent();
      if (error) throw new Error(error.message);

      // Transform array to object for form
      return data.reduce((acc, item) => {
        acc[item.key] = item.content;
        return acc;
      }, {} as Record<string, string>);
    },
  });

  const {
    control,
    handleSubmit,
    formState: { isDirty, isSubmitting },
    reset,
  } = useForm<ContentFormData>({
    resolver: zodResolver(contentSchema),
    values: contentData as ContentFormData,
  });

  React.useEffect(() => {
    if (contentData) {
      reset(contentData as ContentFormData);
    }
  }, [contentData, reset]);

  const mutation = useMutation({
    mutationFn: (newContent: ContentFormData) => {
      const updates = Object.entries(newContent).map(([key, content]) => ({
        key,
        content,
      }));
      return supabaseOperations.updateSiteContent(updates);
    },
    onSuccess: () => {
      sonnerToast.success('Conteúdo salvo com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['site_content'] });
    },
    onError: (error: any) => {
      sonnerToast.error('Erro ao salvar conteúdo.', {
        description: error.message,
      });
    },
  });

  const onSubmit = (data: ContentFormData) => {
    mutation.mutate(data);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-4 w-3/4" />
        </CardHeader>
        <CardContent className="space-y-6">
          {[...Array(7)].map((_, i) => (
            <div className="space-y-2" key={i}>
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
          <Skeleton className="h-10 w-24" />
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Ocorreu um Erro</AlertTitle>
          <AlertDescription>
            Não foi possível carregar o conteúdo para edição: {error?.message}
          </AlertDescription>
        </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Editor de Conteúdo do Site</CardTitle>
        <CardDescription>
          Altere os textos da seção "Nossa História" aqui. As alterações serão refletidas na página inicial.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Field control={control} name="history_title" label="Título Principal da Seção" />
          <Field control={control} name="history_subtitle" label="Subtítulo da Seção" component="textarea" />
          <Field control={control} name="history_event_title" label="Título do Evento (Ex: 2013 - O Início)" />
          <Field control={control} name="history_main_title" label="Título da História (Ex: Como Tudo Começou)" />
          <Field control={control} name="history_p1" label="Primeiro Parágrafo" component="textarea" />
          <Field control={control} name="history_p2" label="Segundo Parágrafo" component="textarea" />
          <Field control={control} name="history_p3" label="Terceiro Parágrafo" component="textarea" />
          
          <Button type="submit" disabled={!isDirty || isSubmitting}>
            {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

// Helper component for form fields
const Field = ({ control, name, label, component = 'input' }: { control: any; name: keyof ContentFormData; label: string; component?: 'input' | 'textarea' }) => {
  const Component = component === 'input' ? Input : Textarea;
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <div className="space-y-2">
          <Label htmlFor={name}>{label}</Label>
          <Component id={name} {...field} />
          {fieldState.error && <p className="text-sm text-red-600">{fieldState.error.message}</p>}
        </div>
      )}
    />
  );
}

export default AdminContentEditor;
