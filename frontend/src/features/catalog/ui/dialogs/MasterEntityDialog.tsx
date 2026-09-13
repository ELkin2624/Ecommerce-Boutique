import { useState, useEffect } from 'react';
import { Dialog } from '@/shared/ui/Dialog';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import type { MasterEntityType } from '../../model/types';

interface MasterEntityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: MasterEntityType | null;
  editingItem: any | null;
  onSubmit: (payload: any) => Promise<any>;
}

export function MasterEntityDialog({
  open,
  onOpenChange,
  type,
  editingItem,
  onSubmit,
}: MasterEntityDialogProps) {
  const [formData, setFormData] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = Boolean(editingItem);

  useEffect(() => {
    if (open) {
      if (editingItem) {
        setFormData({ ...editingItem });
      } else {
        setFormData({});
      }
    }
  }, [open, editingItem]);

  if (!type) return null;

  const titles: Record<MasterEntityType, { singular: string; desc: string }> = {
    categories: {
      singular: 'Categoría',
      desc: 'Clasificación principal de prendas para navegación y filtros',
    },
    seasons: {
      singular: 'Temporada',
      desc: 'Período o ciclo de moda (ej. Verano 2026)',
    },
    collections: {
      singular: 'Colección',
      desc: 'Línea de diseño temática para prendas de catálogo',
    },
    suppliers: {
      singular: 'Proveedor',
      desc: 'Fabricante textil o distribuidor mayorista',
    },
  };

  const current = titles[type];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let cleanPayload: Record<string, any> = {};

      if (type === 'categories') {
        cleanPayload = {
          name: formData.name?.trim(),
          slug: formData.slug?.trim() || undefined,
        };
      } else if (type === 'seasons') {
        cleanPayload = {
          name: formData.name?.trim(),
          startDate: formData.startDate ? formData.startDate.split('T')[0] : undefined,
          endDate: formData.endDate ? formData.endDate.split('T')[0] : undefined,
        };
      } else if (type === 'collections') {
        cleanPayload = {
          name: formData.name?.trim(),
          description: formData.description?.trim() || undefined,
        };
      } else if (type === 'suppliers') {
        cleanPayload = {
          name: formData.name?.trim(),
          contactEmail: formData.contactEmail?.trim() || undefined,
          phone: formData.phone?.trim() || undefined,
          address: formData.address?.trim() || undefined,
        };
      }

      await onSubmit(cleanPayload);
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? `Editar ${current.singular}` : `Nueva ${current.singular}`}
      description={current.desc}
      className="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label={`Nombre de ${current.singular} *`}
          placeholder={`Ej. ${
            type === 'categories'
              ? 'Vestidos de Noche'
              : type === 'seasons'
              ? 'Otoño 2026'
              : type === 'collections'
              ? 'Cápsula Seda Real'
              : 'Textiles del Valle'
          }`}
          required
          value={formData.name || ''}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />

        {type === 'categories' && (
          <Input
            label="Slug / Identificador URL (opcional)"
            placeholder="ej. vestidos-de-noche"
            value={formData.slug || ''}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
          />
        )}

        {type === 'seasons' && (
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Fecha de Inicio"
              type="date"
              value={formData.startDate ? formData.startDate.split('T')[0] : ''}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            />
            <Input
              label="Fecha de Cierre"
              type="date"
              value={formData.endDate ? formData.endDate.split('T')[0] : ''}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            />
          </div>
        )}

        {type === 'collections' && (
          <Input
            label="Descripción del Concepto"
            placeholder="Breve reseña del concepto o temática de diseño..."
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        )}

        {type === 'suppliers' && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Email de Contacto"
                type="email"
                placeholder="pedidos@proveedor.com"
                value={formData.contactEmail || ''}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
              />
              <Input
                label="Teléfono / WhatsApp"
                placeholder="+591 70000000"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <Input
              label="Dirección de Fábrica / Depósito"
              placeholder="Av. Industrial #400, La Paz"
              value={formData.address || ''}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {isEditing ? 'Guardar Cambios' : 'Crear Registro'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
