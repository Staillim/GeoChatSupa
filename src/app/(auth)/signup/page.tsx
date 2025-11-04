'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signUp } from '@/lib/auth-provider';
import { createUser } from '@/hooks/use-postgres-data';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSignUp = async () => {
    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Las contraseñas no coinciden",
        description: "Por favor, verifica que ambas contraseñas sean iguales.",
      });
      return;
    }
    
    if (!name) {
      toast({
        variant: "destructive",
        title: "El nombre es requerido",
        description: "Por favor, introduce tu nombre completo.",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Crear usuario en el sistema de autenticación
      const authResult = await signUp(email, password, name);
      
      if (authResult.success && authResult.user) {
        // Crear usuario en PostgreSQL
        const dbResult = await createUser({
          id: authResult.user.uid,
          name: name,
          email: email,
          avatar: null,
          is_online: true
        });
        
        if (dbResult.success) {
          toast({
            title: "¡Cuenta creada!",
            description: "Tu cuenta ha sido creada exitosamente.",
          });
          router.push('/map');
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Error al crear el perfil de usuario.",
          });
        }
      } else {
        toast({
          variant: "destructive",
          title: "Error al crear cuenta",
          description: authResult.error || "Hubo un problema al crear tu cuenta.",
        });
      }
    } catch (error) {
      console.error('Error en signup:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Ocurrió un error inesperado.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Crear Cuenta</CardTitle>
        <CardDescription>
          Introduce tu información para crear una cuenta
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="first-name">Nombre Completo</Label>
            <Input 
              id="first-name" 
              placeholder="Max Robinson" 
              required 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Correo Electrónico</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input 
              id="password" 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="confirm-password">Confirmar Contraseña</Label>
            <Input 
              id="confirm-password" 
              type="password" 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <Button 
            type="button" 
            className="w-full" 
            onClick={handleSignUp}
            disabled={isLoading}
          >
            {isLoading ? "Creando cuenta..." : "Crear una cuenta"}
          </Button>
        </div>
        <div className="mt-4 text-center text-sm">
          ¿Ya tienes una cuenta?{' '}
          <Link href="/login" className="underline text-accent-foreground font-medium" style={{color: 'hsl(var(--accent))'}}>
            Iniciar Sesión
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
