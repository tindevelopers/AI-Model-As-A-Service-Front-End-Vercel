import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'System Health | AI Model Service',
};

export default function HealthPage() {
  return (
    <div className="p-10">
      <h1 className="text-3xl font-bold">System Health</h1>
      <p className="mt-4 text-gray-600">This section is under construction.</p>
    </div>
  );
}
