"use client";

import type React from "react";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { usePackets } from "@/context/packet-context";
import { useToast } from "@/hooks/use-toast";
import { useSession } from "next-auth/react";

// Create a context to share the dialog state
import { createContext, useContext } from "react";

interface PacketDialogContextType {
  openDialog: () => void;
}

const PacketDialogContext = createContext<PacketDialogContextType | undefined>(
  undefined
);

export function usePacketDialog() {
  const context = useContext(PacketDialogContext);
  if (context === undefined) {
    throw new Error(
      "usePacketDialog must be used within a PacketDialogProvider"
    );
  }
  return context;
}

export function PacketDialogProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    ip: "",
    domain: "",
    port: "", // Added port field
  });
  const [formErrors, setFormErrors] = useState<{
    ip?: string;
    domain?: string;
    port?: string;
    general?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addPacket, allPackets } = usePackets();
  const { toast } = useToast();

  const openDialog = useCallback(() => {
    setOpen(true);
    // Reset form state when opening
    setFormData({ ip: "", domain: "", port: "" });
    setFormErrors({});
  }, []);

  const validateForm = () => {
    const errors: {
      ip?: string;
      domain?: string;
      port?: string;
    } = {};
    let isValid = true;

    // Client-side validation for IPs and domains
    if (allPackets && allPackets.length > 0) {
      // Check if IP exists for another user
      const ipExistsForOtherUser = allPackets.some(
        (packet) =>
          packet.ip.toLowerCase() === formData.ip.toLowerCase() &&
          packet.userId !== session?.user?.id
      );

      // Check if domain exists for any user
      const domainExists = allPackets.some(
        (packet) =>
          packet.domain.toLowerCase() === formData.domain.toLowerCase()
      );

      if (ipExistsForOtherUser) {
        errors.ip = "This IP address is already being tracked by another user";
        isValid = false;
      }

      if (domainExists) {
        errors.domain = "This domain is already being tracked in the system";
        isValid = false;
      }
    }

    // Basic format validation
    const ipPattern = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
    if (formData.ip && !ipPattern.test(formData.ip)) {
      errors.ip = "Please enter a valid IP address (e.g., 192.168.1.1)";
      isValid = false;
    }

    // Port validation
    if (formData.port) {
      const portNum = Number.parseInt(formData.port, 10);
      if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
        errors.port = "Please enter a valid port number (1-65535)";
        isValid = false;
      }
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when user types
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await addPacket({
        ip: formData.ip,
        domain: formData.domain,
        port: formData.port ? Number.parseInt(formData.port, 10) : undefined,
      });

      // Reset form and close dialog
      setFormData({ ip: "", domain: "", port: "" });
      setFormErrors({});
      setOpen(false);

      toast({
        title: "Packet added",
        description: "The packet has been added successfully.",
      });
    } catch (error: any) {
      // Handle server-side validation errors
      if (error.status === 409) {
        try {
          const errorData = await error.json();
          if (errorData.field === "ip") {
            setFormErrors((prev) => ({ ...prev, ip: errorData.message }));
          } else if (errorData.field === "domain") {
            setFormErrors((prev) => ({ ...prev, domain: errorData.message }));
          } else {
            setFormErrors((prev) => ({ ...prev, general: errorData.message }));
          }
        } catch (e) {
          setFormErrors((prev) => ({
            ...prev,
            general: "This packet already exists in the system",
          }));
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to add packet. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PacketDialogContext.Provider value={{ openDialog }}>
      {children}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Server's Address</DialogTitle>
            <DialogDescription>
              Enter the details for the new server you want to track.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            {formErrors.general && (
              <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md mb-4">
                {formErrors.general}
              </div>
            )}

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="ip" className="text-right">
                  IP Address
                </Label>
                <div className="col-span-3 space-y-1">
                  <Input
                    id="ip"
                    name="ip"
                    placeholder="192.168.1.1"
                    value={formData.ip}
                    onChange={handleChange}
                    className={formErrors.ip ? "border-destructive" : ""}
                    required
                  />
                  {formErrors.ip && (
                    <p className="text-destructive text-xs">{formErrors.ip}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="domain" className="text-right">
                  Domain Name
                </Label>
                <div className="col-span-3 space-y-1">
                  <Input
                    id="domain"
                    name="domain"
                    placeholder="example.com"
                    value={formData.domain}
                    onChange={handleChange}
                    className={formErrors.domain ? "border-destructive" : ""}
                    required
                  />
                  {formErrors.domain && (
                    <p className="text-destructive text-xs">
                      {formErrors.domain}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="port" className="text-right">
                  Port
                </Label>
                <div className="col-span-3 space-y-1">
                  <Input
                    id="port"
                    name="port"
                    type="number"
                    placeholder="80"
                    min="1"
                    max="65535"
                    value={formData.port}
                    onChange={handleChange}
                    className={formErrors.port ? "border-destructive" : ""}
                  />
                  {formErrors.port && (
                    <p className="text-destructive text-xs">
                      {formErrors.port}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Adding..." : "Add Server"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PacketDialogContext.Provider>
  );
}

// The button component that uses the dialog context
export function NewPacketButton() {
  const { openDialog } = usePacketDialog();

  return (
    <Button onClick={openDialog} className="flex items-center gap-1">
      <Plus className="h-4 w-4" />
      New
    </Button>
  );
}
