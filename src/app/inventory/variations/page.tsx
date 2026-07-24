import { getVariations } from '@/app/actions/variations';
import VariationsClient from './variations-client';

export const dynamic = 'force-dynamic';

export default async function VariationsPage() {
  const variations = await getVariations();

  return <VariationsClient initialVariations={variations} />;
}
