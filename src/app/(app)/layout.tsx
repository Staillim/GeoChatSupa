'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Map,
  MessageCircle,
  User as UserIcon,
} from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Logo } from '@/components/logo';
import { UserNav } from '@/components/user-nav';
import { NotificationBanner } from '@/components/notification-banner';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import React, { useEffect } from 'react';
import { useUser } from '@/hooks/use-postgres-user';
import { SharedLocationProvider } from '@/hooks/use-shared-location-store';

const navItems = [
  { href: '/map', icon: Map, label: 'Mapa' },
  { href: '/chat', icon: MessageCircle, label: 'Chat' },
  { href: '/profile', icon: UserIcon, label: 'Perfil' },
];

function BottomNavBar({
    pathname
}: {
    pathname: string
}) {
    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card md:hidden">
            <div className="flex h-16 items-center justify-around">
                {navItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "flex flex-col items-center gap-1 p-2 text-sm font-medium transition-colors",
                            pathname.startsWith(item.href)
                                ? "text-primary"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <item.icon className="h-6 w-6" />
                    </Link>
                ))}
            </div>
        </nav>
    );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const [isMounted, setIsMounted] = React.useState(false);
  
  const isChatPage = pathname.startsWith('/chat/');
  const showHeader = !isChatPage;

  const { user, isUserLoading } = useUser();
  const router = useRouter();

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    console.log("AppLayout - Estado del usuario:", { user, isUserLoading, pathname });
    if (!isUserLoading && !user) {
      console.log("AppLayout - Redirigiendo a login");
      router.push('/login');
    } else if (!isUserLoading && user) {
      console.log("AppLayout - Usuario autenticado:", user.email);
      // Si el usuario está en la raíz de la app, redirigir al mapa
      if (pathname === '/') {
        router.push('/map');
      }
    }
  }, [isUserLoading, user, router, pathname]);

  if (isUserLoading || !user) {
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
        </div>
    );
  }

  if (!isMounted) {
    return null;
  }

  return (
    <SharedLocationProvider>
      <SidebarProvider defaultOpen={false}>
        {!isMobile && (
          <Sidebar collapsible="icon">
            <SidebarHeader>
              {/* Logo is now in the main header */}
            </SidebarHeader>
            <SidebarContent>
              <SidebarMenu>
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <Link href={item.href}>
                      <SidebarMenuButton
                        isActive={pathname.startsWith(item.href)}
                        tooltip={{ children: item.label }}
                      >
                        <item.icon />
                        <span className="sr-only">{item.label}</span>
                      </SidebarMenuButton>
                    </Link>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarContent>
          </Sidebar>
        )}
        <SidebarInset>
          {showHeader && (
            <header className="flex h-14 items-center justify-between gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6">
              <div className="flex items-center gap-4">
                <Logo />
              </div>
              <UserNav />
            </header>
          )}
          <main className={cn(
            "flex flex-col overflow-hidden",
            showHeader ? "h-[calc(100vh-56px)] lg:h-[calc(100vh-60px)]" : "h-screen",
            isMobile && !isChatPage && 'pb-16'
          )}>{children}</main>
          {isMobile && !isChatPage && <BottomNavBar pathname={pathname} />}
        </SidebarInset>
        
        {/* Banner flotante para solicitar permisos de notificaciones */}
        <NotificationBanner />
      </SidebarProvider>
    </SharedLocationProvider>
  );
}
