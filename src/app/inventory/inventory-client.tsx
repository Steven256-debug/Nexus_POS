'use client';

import { useState } from 'react';
import { Plus, Search, AlertCircle, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import ProductFormModal from './product-form-modal';
import { deleteProduct, importProductsBatch } from '@/app/actions/inventory';
import { useRef } from 'react';

export default function InventoryClient({ initialProducts }: { initialProducts: any[] }) {
  const [products, setProducts] = useState(initialProducts);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleCsvImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(l => l.trim().length > 0);
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      const newProducts = [];
      for (let i = 1; i < lines.length; i++) {
        // Handle basic CSV splitting (doesn't support commas inside quotes for MVP)
        const values = lines[i].split(',').map(v => v.trim());
        const product: any = {};
        headers.forEach((h, index) => {
          if (h === 'price' || h === 'priceperunit') product.pricePerUnit = values[index];
          else if (h === 'stock' || h === 'stockquantity') product.stockQuantity = values[index];
          else if (h === 'alert' || h === 'minstockalert') product.minStockAlert = values[index];
          else if (h === 'imageurl' || h === 'image') product.imageUrl = values[index];
          else product[h] = values[index];
        });
        
        if (product.name && product.sku && product.category) {
          newProducts.push({
            name: product.name,
            sku: product.sku,
            category: product.category.toUpperCase(),
            pricePerUnit: Number(product.pricePerUnit || 0),
            stockQuantity: Number(product.stockQuantity || 0),
            minStockAlert: Number(product.minStockAlert || 5),
            imageUrl: product.imageUrl || null
          });
        }
      }

      if (newProducts.length > 0) {
        await importProductsBatch(newProducts);
        window.location.reload();
      } else {
        alert("No valid products found in CSV. Make sure headers are: name, sku, category, price, stock");
      }
    } catch (err) {
      console.error(err);
      alert("Error importing CSV");
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      await deleteProduct(id);
      setProducts(products.filter(p => p.id !== id));
    }
  };

  const categories = ['ALL', 'DOORS', 'TEXTILES', 'BUILDING_MATERIALS'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full xl:w-auto">
          <div className="relative w-full sm:w-80 flex-shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <Input 
              placeholder="Search by name or SKU..." 
              className="pl-10 bg-white border-zinc-200 shadow-sm rounded-xl focus-visible:ring-blue-500 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex bg-zinc-200/50 p-1 rounded-xl shadow-inner border border-zinc-200 w-full sm:w-auto overflow-x-auto scrollbar-hide">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`whitespace-nowrap px-4 py-2 text-sm rounded-lg font-medium transition-all duration-200 ${categoryFilter === cat ? 'bg-white shadow-sm text-blue-600' : 'text-zinc-600 hover:text-zinc-900'}`}
              >
                {cat.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2 w-full xl:w-auto mt-2 xl:mt-0">
          <input 
            type="file" 
            accept=".csv" 
            ref={fileInputRef} 
            className="hidden" 
            onChange={handleCsvImport} 
          />
          <Button 
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            disabled={isImporting}
            className="flex-1 sm:flex-none bg-white hover:bg-zinc-50 border-zinc-200 text-zinc-700 shadow-sm rounded-xl h-12 sm:h-10"
          >
            <Plus className="w-4 h-4 mr-2" /> {isImporting ? 'Importing...' : 'Import CSV'}
          </Button>
          <Button 
            onClick={() => { setEditingProduct(null); setIsModalOpen(true); }}
            className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 rounded-xl h-12 sm:h-10"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Product
          </Button>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto pb-4 sm:pb-0">
          <Table className="min-w-[800px]">
            <TableHeader className="bg-zinc-50/80 backdrop-blur-sm">
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>Product Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.map((product) => (
              <TableRow key={product.id} className="group hover:bg-zinc-50/50 transition-colors">
                <TableCell className="font-mono text-xs text-zinc-500">{product.sku}</TableCell>
                <TableCell className="font-medium text-zinc-900">{product.name}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className="bg-zinc-100 text-zinc-700 font-medium">
                    {product.category.replace('_', ' ')}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-medium">${product.pricePerUnit.toFixed(2)}</TableCell>
                <TableCell className="text-right font-medium">
                  {product.stockQuantity}
                </TableCell>
                <TableCell>
                  {product.stockQuantity <= product.minStockAlert ? (
                    <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-100 flex items-center w-max gap-1">
                      <AlertCircle className="w-3 h-3" /> Low Stock
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">
                      In Stock
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="hover:bg-blue-50 rounded-lg" onClick={() => { setEditingProduct(product); setIsModalOpen(true); }}>
                      <Edit className="w-4 h-4 text-blue-600" />
                    </Button>
                    <Button variant="ghost" size="icon" className="hover:bg-red-50 rounded-lg" onClick={() => handleDelete(product.id)}>
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filteredProducts.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-16 text-zinc-500">
                  <div className="flex flex-col items-center gap-2">
                    <Search className="w-8 h-8 text-zinc-300" />
                    <p>No products found matching your filters.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        </div>
      </div>

      <ProductFormModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        product={editingProduct} 
        onSaved={(savedProduct: any) => {
          if (editingProduct) {
            setProducts(products.map(p => p.id === savedProduct.id ? savedProduct : p));
          } else {
            setProducts([savedProduct, ...products]);
          }
          setIsModalOpen(false);
        }}
      />
    </div>
  );
}
