'use client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUser } from '@/hooks/use-postgres-user';
import { useUserData } from '@/hooks/use-postgres-data';
import { Skeleton } from '@/components/ui/skeleton';
import { useState, useRef, useEffect } from 'react';
import { RefreshCw, Copy, Check, Camera, Upload, Loader2 } from 'lucide-react';
import { ImageCropDialog } from '@/components/image-crop-dialog';
import { readFile, isValidImage } from '@/lib/image-utils';
import { useToast } from '@/hooks/use-toast';
import { LocationSharingRequests } from '@/components/location-sharing-requests';
import { NotificationPermissionCard } from '@/components/notification-permission-card';
import { putData } from '@/lib/api-client';

export default function ProfilePage() {
    const { user, userProfile, isUserLoading } = useUser();
    const { mutate } = useUserData(user?.uid || null); // Para refrescar datos
    const [isRegeneratingPin, setIsRegeneratingPin] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [isCropDialogOpen, setIsCropDialogOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const { toast } = useToast();
    
    // Estados para edición de perfil
    const [editedDisplayName, setEditedDisplayName] = useState('');
    const [editedBio, setEditedBio] = useState('');
    const [isSavingProfile, setIsSavingProfile] = useState(false);

    // Sincronizar valores iniciales cuando se carga el perfil
    useEffect(() => {
        if (userProfile || user) {
            const currentDisplayName = userProfile?.displayName || user?.displayName || user?.email?.split('@')[0] || 'Usuario';
            const currentBio = userProfile?.bio || '';
            setEditedDisplayName(currentDisplayName);
            setEditedBio(currentBio);
        }
    }, [userProfile, user]);

    // Debug logs
    console.log('=== Profile Page Debug ===');
    console.log('User UID:', user?.uid);
    console.log('User Email:', user?.email);
    console.log('User DisplayName:', user?.displayName);
    console.log('User Profile (raw):', userProfile);
    console.log('User Profile exists?:', userProfile !== null && userProfile !== undefined);
    if (userProfile) {
        console.log('User Profile keys:', Object.keys(userProfile));
        console.log('PIN value:', userProfile.pin);
        console.log('PIN type:', typeof userProfile.pin);
    }
    console.log('Is Loading:', isUserLoading);
    console.log('========================');

    const regeneratePin = async () => {
        if (!user) return;
        
        setIsRegeneratingPin(true);
        try {
            const newPin = Math.floor(100000 + Math.random() * 900000).toString();
            
            await putData(`/api/users/${user.uid}`, {
                pin: newPin
            });
            
            console.log('✅ PIN regenerado:', newPin);
            toast({
                title: '✅ PIN actualizado',
                description: `Tu nuevo PIN es: ${newPin}`,
            });
        } catch (error) {
            console.error('❌ Error al regenerar PIN:', error);
            toast({
                title: 'Error',
                description: 'No se pudo regenerar el PIN',
                variant: 'destructive',
            });
        } finally {
            setIsRegeneratingPin(false);
        }
    };

    const copyPinToClipboard = async () => {
        if (pin && pin !== 'No disponible') {
            try {
                await navigator.clipboard.writeText(pin);
                setIsCopied(true);
                setTimeout(() => setIsCopied(false), 2000);
            } catch (error) {
                console.error('Error al copiar PIN:', error);
                alert('Error al copiar el PIN');
            }
        }
    };

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validar el archivo
        if (!isValidImage(file)) {
            toast({
                title: 'Archivo inválido',
                description: 'Por favor selecciona una imagen JPG, PNG o WebP menor a 10MB',
                variant: 'destructive',
            });
            return;
        }

        try {
            const imageDataUrl = await readFile(file);
            setImageSrc(imageDataUrl);
            setIsCropDialogOpen(true);
        } catch (error) {
            console.error('Error al leer el archivo:', error);
            toast({
                title: 'Error',
                description: 'No se pudo leer la imagen',
                variant: 'destructive',
            });
        }

        // Limpiar el input para permitir seleccionar el mismo archivo de nuevo
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleCropComplete = async (croppedImageBase64: string) => {
        if (!user) return;

        setIsUpdating(true);
        try {
            await putData(`/api/users/${user.uid}`, {
                avatar: croppedImageBase64
            });
            
            // Refrescar los datos del usuario inmediatamente
            await mutate();
            
            toast({
                title: '✅ Foto actualizada',
                description: 'Tu foto de perfil se ha actualizado correctamente',
            });
        } catch (error) {
            console.error('Error al actualizar foto:', error);
            toast({
                title: 'Error',
                description: 'No se pudo actualizar la foto de perfil',
                variant: 'destructive',
            });
        } finally {
            setIsUpdating(false);
        }
    };

    const openFileDialog = () => {
        fileInputRef.current?.click();
    };

    const handleSaveProfile = async () => {
        if (!user) return;

        setIsSavingProfile(true);
        try {
            await putData(`/api/users/${user.uid}`, {
                name: editedDisplayName.trim(),
                bio: editedBio.trim(),
            });

            // Refrescar los datos del usuario inmediatamente
            await mutate();

            toast({
                title: '✅ Perfil actualizado',
                description: 'Tus cambios se han guardado correctamente',
            });
        } catch (error) {
            console.error('Error al actualizar perfil:', error);
            toast({
                title: 'Error',
                description: 'No se pudo actualizar el perfil',
                variant: 'destructive',
            });
        } finally {
            setIsSavingProfile(false);
        }
    };

    if (isUserLoading) {
        return (
            <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Mi Perfil</h2>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>Detalles del Perfil</CardTitle>
                        <CardDescription>
                            Cargando tu información...
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center gap-4">
                            <Skeleton className="h-20 w-20 rounded-full" />
                            <Skeleton className="h-10 w-32" />
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                        <Skeleton className="h-10 w-full" />
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Mi Perfil</h2>
                </div>
                <Card>
                    <CardContent className="p-8 text-center">
                        <p>No se pudo cargar la información del usuario.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const displayName = userProfile?.name || user.displayName || user.email?.split('@')[0] || 'Usuario';
    const email = user.email || '';
    const bio = userProfile?.bio || '';
    const pin = userProfile?.pin || 'No disponible';

    return (
        <div className="h-full w-full overflow-y-auto custom-scrollbar">
            <div className="space-y-4 p-4 md:p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-sky-600 to-blue-600 dark:from-sky-400 dark:to-blue-400 bg-clip-text text-transparent">Mi Perfil</h2>
                </div>
                
                {/* Card de permisos de notificaciones */}
                <NotificationPermissionCard />
                
                {/* Solicitudes de ubicación compartida */}
                <LocationSharingRequests />
                
                <Card className="border-2 border-sky-200 dark:border-sky-800 shadow-lg shimmer-effect">
                    <CardHeader>
                        <CardTitle className="text-sky-700 dark:text-sky-300">Detalles del Perfil</CardTitle>
                        <CardDescription>
                            Actualiza tu información personal y tu foto.
                        </CardDescription>
                    </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="relative group">
                            <Avatar className="h-24 w-24 ring-4 ring-sky-200 dark:ring-sky-700 shadow-lg shadow-sky-300/50 dark:shadow-sky-800/50 transition-all duration-300 group-hover:scale-105">
                                <AvatarImage src={userProfile?.avatar || user.photoURL || ''} alt={displayName} />
                                <AvatarFallback className="text-3xl bg-gradient-to-br from-sky-400 to-blue-500 text-white font-bold">
                                    {displayName.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            {isUpdating && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                                    <div className="animate-spin h-8 w-8 border-4 border-white border-t-transparent rounded-full" />
                                </div>
                            )}
                            <button
                                onClick={openFileDialog}
                                disabled={isUpdating}
                                className="absolute bottom-0 right-0 p-2 bg-gradient-to-br from-sky-400 to-blue-500 hover:from-sky-500 hover:to-blue-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Cambiar foto"
                            >
                                <Camera className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="flex flex-col gap-2">
                            <Button
                                variant="outline"
                                onClick={openFileDialog}
                                disabled={isUpdating}
                                className="hover:bg-sky-50 dark:hover:bg-sky-950 hover:border-sky-400 dark:hover:border-sky-600 transition-all duration-300"
                            >
                                <Upload className="h-4 w-4 mr-2" />
                                {isUpdating ? 'Actualizando...' : 'Cambiar Foto'}
                            </Button>
                            <p className="text-xs text-muted-foreground">
                                JPG, PNG o WebP (máx. 10MB)
                            </p>
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/jpg,image/webp"
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Nombre Completo</Label>
                            <Input 
                                id="name" 
                                value={editedDisplayName} 
                                onChange={(e) => setEditedDisplayName(e.target.value)}
                                placeholder="Tu nombre"
                                className="border-sky-200 dark:border-sky-800 focus:border-sky-400 dark:focus:border-sky-500"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email">Correo Electrónico</Label>
                            <Input id="email" type="email" value={email} disabled />
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="pin">PIN de Usuario</Label>
                        <div className="flex gap-2">
                            <Input id="pin" value={pin} disabled className="font-mono text-lg flex-1" />
                            <Button 
                                variant="outline" 
                                size="icon"
                                onClick={copyPinToClipboard}
                                disabled={pin === 'No disponible'}
                                title="Copiar PIN"
                            >
                                {isCopied ? (
                                    <Check className="h-4 w-4 text-green-600" />
                                ) : (
                                    <Copy className="h-4 w-4" />
                                )}
                            </Button>
                            <Button 
                                variant="outline" 
                                size="icon"
                                onClick={regeneratePin}
                                disabled={isRegeneratingPin}
                                title="Regenerar PIN"
                            >
                                <RefreshCw className={`h-4 w-4 ${isRegeneratingPin ? 'animate-spin' : ''}`} />
                            </Button>
                        </div>
                        <p className="text-sm text-muted-foreground">Este es tu PIN único para conectar con otros usuarios</p>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="bio">Biografía</Label>
                        <Input 
                            id="bio" 
                            placeholder="Cuéntanos un poco sobre ti" 
                            value={editedBio} 
                            onChange={(e) => setEditedBio(e.target.value)}
                            className="border-sky-200 dark:border-sky-800 focus:border-sky-400 dark:focus:border-sky-500"
                        />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button 
                        onClick={handleSaveProfile}
                        disabled={isSavingProfile}
                        className="bg-gradient-to-br from-sky-400 via-blue-500 to-sky-600 hover:from-sky-500 hover:via-blue-600 hover:to-sky-700 text-white shadow-lg shadow-sky-400/50 hover:shadow-xl hover:shadow-sky-500/60 transition-all duration-300"
                    >
                        {isSavingProfile ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Guardando...
                            </>
                        ) : (
                            'Guardar Cambios'
                        )}
                    </Button>
                </CardFooter>
            </Card>

            {/* Diálogo de recorte de imagen */}
            <ImageCropDialog
                imageSrc={imageSrc}
                open={isCropDialogOpen}
                onClose={() => {
                    setIsCropDialogOpen(false);
                    setImageSrc(null);
                }}
                onCropComplete={handleCropComplete}
            />
            </div>
        </div>
    );
}
