import { Sidebar } from './_components/sidebar'
import { SidebarProvider } from '@/components/ui/base/sidebar'

export default function DashboardLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <SidebarProvider>
            <div className="flex h-screen w-full bg-background">
                <Sidebar />
                <main className="flex-1 overflow-hidden">{children}</main>
            </div>
        </SidebarProvider>
    )
}
