'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createProduct, updateProduct } from '@/app/actions/inventory';

const CATEGORY_METADATA = {
  DOORS: ['Dimensions', 'Material/Finish'],
  TEXTILES: ['Unit of Measure', 'Pattern/Color'],
  BUILDING_MATERIALS: ['Weight/Volume', 'Brand']
};

export default function ProductFormModal({ isOpen, onClose, product, onSaved }: any) {
  const [formData, setFormData] = useState({
    name: '', sku: '', category: '', pricePerUnit: 0, stockQuantity: 0, minStockAlert: 5, imageUrl: ''
  });
  const [metadata, setMetadata] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name, sku: product.sku, category: product.category, 
        pricePerUnit: product.pricePerUnit, stockQuantity: product.stockQuantity, minStockAlert: product.minStockAlert,
        imageUrl: product.imageUrl || ''
      });
      setPreviewUrl(product.imageUrl || '');
      setImageFile(null);
      const meta: Record<string, string> = {};
      product.metadata?.forEach((m: any) => meta[m.key] = m.value);
      setMetadata(meta);
    } else {
      setFormData({ name: '', sku: '', category: '', pricePerUnit: 0, stockQuantity: 0, minStockAlert: 5, imageUrl: '' });
      setPreviewUrl('');
      setImageFile(null);
      setMetadata({});
    }
  }, [product, isOpen]);

  const handleMetadataChange = (key: string, value: string) => {
    setMetadata(prev => ({ ...prev, [key]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      let finalImageUrl = formData.imageUrl;
      if (imageFile) {
        const uploadData = new FormData();
        uploadData.append('file', imageFile);
        const res = await fetch('/api/upload', { method: 'POST', body: uploadData });
        if (res.ok) {
          const json = await res.json();
          finalImageUrl = json.url;
        }
      }

      const metaArray = Object.entries(metadata).map(([key, value]) => ({ key, value }));
      let saved;
      if (product) {
        saved = await updateProduct(product.id, {
          ...formData,
          pricePerUnit: Number(formData.pricePerUnit),
          stockQuantity: Number(formData.stockQuantity),
          minStockAlert: Number(formData.minStockAlert),
          imageUrl: finalImageUrl
        }, metaArray);
      } else {
        saved = await createProduct({
          ...formData,
          pricePerUnit: Number(formData.pricePerUnit),
          stockQuantity: Number(formData.stockQuantity),
          minStockAlert: Number(formData.minStockAlert),
          imageUrl: finalImageUrl
        }, metaArray);
      }
      onSaved(saved);
    } catch (err) {
      console.error(err);
      alert('Error saving product');
    } finally {
      setIsSaving(false);
    }
  };

  const currentMetaFields = CATEGORY_METADATA[formData.category as keyof typeof CATEGORY_METADATA] || [];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md bg-card text-card-foreground rounded-2xl w-[95vw] max-h-[90vh] overflow-y-auto sm:w-full p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{product ? 'Edit Product' : 'Add New Product'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="flex items-center gap-4">
            {previewUrl && (
              <img src={previewUrl} alt="Preview" className="w-16 h-16 object-cover rounded-lg border border-border" />
            )}
            <div className="flex-1 space-y-2">
              <Label>Product Image</Label>
              <Input type="file" accept="image/*" onChange={handleImageChange} className="rounded-lg" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Product Name</Label>
            <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="rounded-lg" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>SKU</Label>
              <Input required value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} className="rounded-lg" />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={formData.category} onValueChange={v => setFormData({...formData, category: v})}>
                <SelectTrigger className="rounded-lg"><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="DOORS">Doors</SelectItem>
                  <SelectItem value="TEXTILES">Textiles</SelectItem>
                  <SelectItem value="BUILDING_MATERIALS">Building Materials</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Price ($)</Label>
              <Input type="number" step="0.01" required value={formData.pricePerUnit} onChange={e => setFormData({...formData, pricePerUnit: Number(e.target.value)})} className="rounded-lg" />
            </div>
            <div className="space-y-2">
              <Label>Stock</Label>
              <Input type="number" required value={formData.stockQuantity} onChange={e => setFormData({...formData, stockQuantity: Number(e.target.value)})} className="rounded-lg" />
            </div>
            <div className="space-y-2">
              <Label>Alert At</Label>
              <Input type="number" required value={formData.minStockAlert} onChange={e => setFormData({...formData, minStockAlert: Number(e.target.value)})} className="rounded-lg" />
            </div>
          </div>

          {currentMetaFields.length > 0 && (
            <div className="p-4 bg-muted/50 rounded-xl border border-border space-y-4 shadow-inner">
              <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider">Category Details</h4>
              {currentMetaFields.map(field => (
                <div key={field} className="space-y-2">
                  <Label>{field}</Label>
                  <Input 
                    value={metadata[field] || ''} 
                    onChange={e => handleMetadataChange(field, e.target.value)} 
                    placeholder={`Enter ${field.toLowerCase()}...`}
                    className="bg-card text-card-foreground rounded-lg"
                  />
                </div>
              ))}
            </div>
          )}

          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-lg">Cancel</Button>
            <Button type="submit" disabled={isSaving || !formData.category} className="rounded-lg bg-blue-600 hover:bg-blue-700 shadow-md">
              {isSaving ? 'Saving...' : 'Save Product'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
