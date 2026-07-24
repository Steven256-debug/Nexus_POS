import { getUnits } from '@/app/actions/inventory';
import UnitsClient from './units-client';

export const dynamic = 'force-dynamic';

export default async function UnitsPage() {
  const units = await getUnits();

  return (
    <div className="space-y-8 animate-in fade-in max-w-7xl mx-auto pb-12">
      <UnitsClient initialUnits={units} />
    </div>
  );
}
