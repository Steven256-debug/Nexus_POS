import { getCategories } from '@/app/actions/inventory';
import CategoriesClient from './categories-client';

export const dynamic = 'force-dynamic';

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="space-y-8 animate-in fade-in max-w-7xl mx-auto pb-12">
      <CategoriesClient initialCategories={categories} />
    </div>
  );
}
