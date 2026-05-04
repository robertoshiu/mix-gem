import { Header } from '@/components/layout/header';
import { MesNavBar } from '@/components/mes/MesNavBar';

export default function MesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-[var(--smartfactory-bg-base)]">
      <Header />
      <MesNavBar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
