import { prisma } from '@/lib/prisma';
import GroupsClient from './groups-client';

export const dynamic = 'force-dynamic';

export default async function GroupsPage() {
  const groups = await prisma.customerGroup.findMany({
    include: { customers: true },
    orderBy: { name: 'asc' }
  });

  return (
    <div className="space-y-8 animate-in fade-in max-w-7xl mx-auto pb-12">
      <GroupsClient initialGroups={groups} />
    </div>
  );
}
