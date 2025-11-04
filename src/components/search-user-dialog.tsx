"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Search, AlertCircle } from "lucide-react";
import { UserCard } from "./user-card";
import { useSearchUserByPin } from "@/hooks/use-search-user-postgres";

interface SearchUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Dialog for searching users by their PIN code.
 * Allows users to find other users and send chat requests.
 */
export function SearchUserDialog({ open, onOpenChange }: SearchUserDialogProps) {
  const [pin, setPin] = useState("");
  const { user, loading, error, searchByPin } = useSearchUserByPin();

  const handleSearch = async () => {
    if (pin.trim().length !== 6) {
      return;
    }
    await searchByPin(pin.trim());
  };

  const handleClose = () => {
    setPin("");
    onOpenChange(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && pin.trim().length === 6) {
      handleSearch();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Buscar Usuario por PIN</DialogTitle>
          <DialogDescription>
            Ingresa el código PIN de 6 dígitos del usuario que deseas agregar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="flex gap-2">
            <Input
              placeholder="Ej: 123456"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
              onKeyPress={handleKeyPress}
              maxLength={6}
              className="flex-1"
              disabled={loading}
            />
            <Button
              onClick={handleSearch}
              disabled={loading || pin.length !== 6}
              size="icon"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* User Not Found Message */}
          {!loading && !error && pin.length === 6 && !user && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No se encontró ningún usuario con el PIN: {pin}
              </AlertDescription>
            </Alert>
          )}

          {/* User Result */}
          {user && (
            <div className="pt-2">
              <UserCard user={user} onRequestSent={handleClose} />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
