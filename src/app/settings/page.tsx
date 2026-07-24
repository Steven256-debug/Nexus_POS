import { prisma } from '@/lib/prisma';
import { getSettings } from '@/app/actions/system-settings';
import SettingsClient from './settings-client';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const location = await prisma.businessLocation.findFirst();
  const settings = await getSettings();

  return (
    <div className="space-y-8 animate-in fade-in max-w-7xl mx-auto pb-12">
      <div>
        <h1 className="text-4xl font-black tracking-tight text-foreground">System & Branch Settings</h1>
        <p className="text-muted-foreground text-lg">Configure business parameters, locations, and system access.</p>
      </div>
      <SettingsClient initialLocation={location} initialSettings={settings} />
    </div>
  );
}
