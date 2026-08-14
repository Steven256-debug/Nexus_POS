import { useState } from 'react';
import { Search, Plus, Layers, Tag, Star } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import type { CartItem, ProductWithRelations } from '@/types';

export function ProductCatalog({
  products,
  cart,
  searchTerm,
  setSearchTerm,
  addToCart,
  onAddProductOpen,
}: {
  products: ProductWithRelations[];
  cart: CartItem[];
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  addToCart: (product: ProductWithRelations) => void;
  onAddProductOpen: () => void;
}) {
  const [activeTab, setActiveTab] = useState<'categories' | 'brands' | 'featured'>('categories');
  const [selectedCategory] = useState<string>('ALL');
  const [selectedBrand] = useState<string>('ALL');

  const categoriesList = Array.from(new Set(products.map(p => p.category?.name || 'General'))).filter(Boolean);
  const brandsList = Array.from(new Set(products.map(p => p.brand?.name || 'Unbranded'))).filter(Boolean);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    if (activeTab === 'featured') return p.isFeatured;
    if (activeTab === 'brands') {
      const bName = p.brand?.name || 'Unbranded';
      return selectedBrand === 'ALL' || bName === selectedBrand;
    }
    const cName = p.category?.name || 'General';
    return selectedCategory === 'ALL' || cName === selectedCategory;
  });

  const handleBarcodeSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      const exactMatches = products.filter(p =>
        p.sku.toLowerCase() === searchTerm.toLowerCase() ||
        p.barcode?.toLowerCase() === searchTerm.toLowerCase()
      );
      if (exactMatches.length === 1) {
        addToCart(exactMatches[0]);
        setSearchTerm('');
      } else {
        toast.error(`Barcode not found: ${searchTerm}`);
        setSearchTerm('');
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-card text-card-foreground rounded-3xl border border-border shadow-sm overflow-hidden">
      {/* Search & Tabs Header */}
      <div className="p-5 border-b border-border space-y-4 bg-muted/30">
        <div className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Enter Product name / SKU / Scan bar code..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              onKeyDown={handleBarcodeSearch}
              className="pl-12 h-13 text-base rounded-2xl bg-card border-border shadow-sm focus-visible:ring-blue-500"
            />
          </div>
          <Button
            onClick={onAddProductOpen}
            className="h-13 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold flex items-center gap-1 shrink-0"
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button onClick={() => setActiveTab('categories')} className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${activeTab === 'categories' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'bg-card border border-border text-muted-foreground hover:bg-muted'}`}>
            <Layers className="w-4 h-4" />
            <span>Category ({categoriesList.length})</span>
          </button>
          <button onClick={() => setActiveTab('brands')} className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${activeTab === 'brands' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'bg-card border border-border text-muted-foreground hover:bg-muted'}`}>
            <Tag className="w-4 h-4" />
            <span>Brands ({brandsList.length})</span>
          </button>
          <button onClick={() => setActiveTab('featured')} className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${activeTab === 'featured' ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20' : 'bg-card border border-border text-muted-foreground hover:bg-muted'}`}>
            <Star className="w-4 h-4 fill-current" />
            <span>Featured Products</span>
          </button>
        </div>
      </div>

      {/* Product Grid */}
      <div className="flex-1 p-5 overflow-y-auto bg-muted/20">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredProducts.map(product => {
            const inCart = cart.find(c => c.id === product.id)?.quantity || 0;
            const available = product.stockQuantity - inCart;
            const isOutOfStock = available <= 0;
            const unitName = product.unit?.shortName || 'Pc(s)';

            return (
              <div
                key={product.id}
                onClick={() => !isOutOfStock && addToCart(product)}
                className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between cursor-pointer ${
                  isOutOfStock
                    ? 'border-red-200 bg-red-500/5 opacity-60 cursor-not-allowed'
                    : 'border-border bg-card hover:border-blue-500 hover:shadow-lg active:scale-95'
                }`}
              >
                <div className="space-y-2 mb-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                      ({product.sku})
                    </span>
                    {product.isFeatured && (
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    )}
                  </div>
                  <h3 className="font-extrabold text-foreground text-sm leading-tight line-clamp-2">
                    {product.name}
                  </h3>
                </div>

                <div className="pt-3 border-t border-border/60 space-y-1.5">
                  <p className="font-black text-lg text-blue-600">
                    GH₵{Number(product.pricePerUnit).toFixed(2)}
                  </p>
                  <div className="text-[11px] font-bold">
                    <span className={isOutOfStock ? "text-red-500" : "text-emerald-600"}>
                      {available.toFixed(0)} {unitName} in stock
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredProducts.length === 0 && (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-muted-foreground space-y-2">
              <Search className="w-10 h-10 opacity-30" />
              <p className="font-bold text-base">No matching products found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
