import { AdminLayoutClient } from './layout-client';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Auth is handled by middleware - see src/middleware.ts
  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
