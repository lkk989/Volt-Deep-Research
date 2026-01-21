import { Sidebar } from './_components/sidebar'

export default function DashboardLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <div className="flex h-screen bg-background">
            <Sidebar />
            <main className="flex-1 overflow-hidden">{children}</main>
        </div>
    )
}
