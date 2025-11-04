'use client';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useParams } from 'next/navigation';
import { useConversations } from '@/hooks/use-postgres-data';
import { useUser } from '@/hooks/use-postgres-user';
import { Skeleton } from '@/components/ui/skeleton';
import { SearchUserFab } from '@/components/search-user-fab';
import { PendingRequestsSection } from '@/components/pending-requests-section';

interface ConversationItemProps {
    conv: any;
    isActive: boolean;
    currentUserId: string;
    participants: any[];
}

function ConversationItem({ conv, isActive, currentUserId, participants }: ConversationItemProps) {
    const otherParticipant = participants.find((p: any) => p.id !== currentUserId);
    
    const displayName = otherParticipant?.name || otherParticipant?.email?.split('@')[0] || 'Usuario';
    const photoURL = otherParticipant?.avatar || null;
    const initials = displayName.charAt(0).toUpperCase();

    // Estados de la conversación
    const isPending = conv.status === 'pending';
    const isCreator = conv.createdBy === currentUserId;
    const unreadCount = conv.unreadCount?.[currentUserId] || 0;
    const hasUnread = unreadCount > 0;

    // Gradientes aleatorios para cada conversación - tema azul
    const gradients = [
        'from-sky-400/10 to-blue-500/10',
        'from-cyan-400/10 to-sky-500/10',
        'from-blue-400/10 to-indigo-500/10',
        'from-sky-300/10 to-cyan-500/10',
        'from-blue-300/10 to-sky-600/10',
    ];
    const gradientIndex = Math.abs(conv.id.charCodeAt(0)) % gradients.length;
    const gradient = gradients[gradientIndex];

    return (
        <Link
            key={conv.id}
            href={`/chat/${conv.id}`}
            className={cn(
                "flex flex-col items-start gap-2 rounded-xl border p-3 text-left text-sm relative group overflow-hidden",
                "shimmer-effect hover-lift card-hover-effect",
                "bg-gradient-to-br transition-all duration-500",
                gradient,
                "animate-in fade-in slide-in-from-left-2 duration-300",
                isActive && "bg-sky-100/80 dark:bg-sky-900/40 ring-2 ring-sky-400 dark:ring-sky-500 shadow-lg shadow-sky-300/30 dark:shadow-sky-800/50 border-sky-300 dark:border-sky-700",
                isPending && "border-amber-300 bg-gradient-to-br from-amber-50/80 to-orange-50/80 dark:border-amber-800 dark:from-amber-950/40 dark:to-orange-950/40",
                hasUnread && !isActive && "border-sky-400/50 dark:border-sky-500/50 ring-2 ring-sky-300/40 dark:ring-sky-600/40 bg-gradient-to-br from-sky-100/60 to-blue-100/40 dark:from-sky-950/40 dark:to-blue-950/40"
            )}
        >
            {/* 🌟 Orbes flotantes de fondo - colores azules */}
            <div className="absolute -top-4 -left-4 w-24 h-24 bg-sky-400/20 dark:bg-sky-500/30 rounded-full blur-3xl opacity-0 group-hover:opacity-70 transition-opacity duration-500 floating-orb" />
            <div className="absolute -bottom-4 -right-4 w-28 h-28 bg-blue-400/15 dark:bg-blue-500/25 rounded-full blur-3xl opacity-0 group-hover:opacity-70 transition-opacity duration-700 floating-orb" style={{ animationDelay: '1s' }} />
            
            {/* Indicador de mensajes no leídos */}
            {hasUnread && !isActive && (
                <div className="absolute top-2 right-2 animate-in zoom-in duration-200 z-10">
                    <div className="relative">
                        <Badge variant="destructive" className="h-5 min-w-[20px] px-1.5 flex items-center justify-center text-xs font-bold animate-pulse-glow shadow-lg shadow-sky-500/50 bg-gradient-to-br from-sky-500 to-blue-600 border-0">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </Badge>
                    </div>
                </div>
            )}
            
            <div className="flex w-full items-center gap-3 relative z-10">
                <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-sky-400/40 to-blue-500/40 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <Avatar className="transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 relative z-10 ring-2 ring-white dark:ring-slate-800 shadow-lg shadow-sky-300/30 dark:shadow-sky-800/30">
                        <AvatarImage src={photoURL || ''} alt={displayName} />
                        <AvatarFallback className="bg-gradient-to-br from-sky-400 to-blue-500 text-white font-bold">{initials}</AvatarFallback>
                    </Avatar>
                    {/* Indicador de punto con animación mejorada - color azul */}
                    {hasUnread && !isActive && (
                        <div className="absolute -top-0.5 -right-0.5 z-20">
                            <div className="relative h-3 w-3 bg-sky-500 rounded-full border-2 border-white dark:border-slate-800 animate-pulse-glow">
                                <div className="absolute inset-0 bg-sky-400 rounded-full animate-ping" />
                            </div>
                        </div>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="font-semibold flex items-center gap-2">
                        <span className="truncate group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors duration-300">{displayName}</span>
                        {isPending && (
                            <Badge variant="outline" className="text-xs bg-gradient-to-r from-amber-100 to-orange-100 text-amber-900 border-amber-300 dark:from-amber-950 dark:to-orange-950 dark:text-amber-200 dark:border-amber-800 shadow-sm">
                                {isCreator ? 'Pendiente' : 'Nueva'}
                            </Badge>
                        )}
                    </div>
                    <p className={cn(
                        "text-xs truncate transition-all duration-300",
                        hasUnread && !isActive ? "text-sky-700 dark:text-sky-300 font-semibold" : "text-muted-foreground group-hover:text-sky-600 dark:group-hover:text-sky-400"
                    )}>
                        {isPending 
                            ? (isCreator ? 'Esperando aceptación...' : '¡Nueva solicitud de chat!')
                            : (conv.lastMessage || 'Sin mensajes')
                        }
                    </p>
                </div>
                {!isPending && hasUnread && !isActive && (
                    <div className="flex-shrink-0">
                        {/* Badge ya está en la esquina superior derecha */}
                    </div>
                )}
            </div>
        </Link>
    );
}

function ConversationList() {
    const params = useParams();
    const { user } = useUser();
    const { conversations, isLoading } = useConversations(user?.uid, 'active');
    const activeConversationId = params.slug?.[0];

    if (isLoading) {
        return (
            <ScrollArea className="h-full">
                <div className="flex flex-col gap-2 p-4 pt-0">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-3 rounded-lg border p-3">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-3 w-32" />
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        );
    }

    if (!conversations || conversations.length === 0) {
        return (
            <div className="flex h-full items-center justify-center p-4">
                <div className="text-center text-muted-foreground">
                    <p>No tienes conversaciones aún</p>
                    <p className="text-sm mt-2">Ve al mapa para conectar con otros usuarios</p>
                </div>
            </div>
        );
    }

    return (
        <ScrollArea className="h-full">
            <div className="flex flex-col gap-2 p-4 pt-0">
            {conversations.map((conv: any) => {
                const isActive = activeConversationId === conv.id;
                
                return (
                    <ConversationItem 
                        key={conv.id}
                        conv={conv}
                        isActive={isActive}
                        currentUserId={user?.uid || ''}
                        participants={conv.participantsData || []}
                    />
                );
            })}
            </div>
      </ScrollArea>
    )
}


export default function ChatLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams();
  const slug = params.slug as string[] | undefined;

  return (
    <div className="grid h-full w-full min-h-0 md:grid-cols-[280px_1fr] relative">
      <div className={cn("border-r border-sky-200 dark:border-sky-900 bg-gradient-to-b from-white to-sky-50/30 dark:from-slate-900 dark:to-sky-950/30", slug && slug.length > 0 ? "hidden md:block" : "block")}>
        <div className="flex h-full max-h-screen flex-col gap-2">
            <div className="flex h-14 items-center border-b border-sky-200 dark:border-sky-900 px-4 lg:h-[60px] lg:px-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                <h2 className="font-semibold text-lg bg-gradient-to-r from-sky-600 to-blue-600 dark:from-sky-400 dark:to-blue-400 bg-clip-text text-transparent">Conversaciones</h2>
            </div>
            {/* Sección de solicitudes pendientes */}
            <PendingRequestsSection />
            <ConversationList/>
        </div>
      </div>
      <div className={cn("flex-col h-full min-h-0", slug && slug.length > 0 ? "flex" : "hidden md:flex")}>
        {children}
      </div>
      
      {/* Floating Action Button for searching users - only show when not in a chat */}
      {(!slug || slug.length === 0) && <SearchUserFab />}
    </div>
  )
}
