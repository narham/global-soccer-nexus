import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const formSchema = z.object({
  full_name: z.string().min(1, "Nama lengkap wajib diisi"),
  phone: z.string().optional(),
  role: z.enum(["admin_federasi", "admin_klub", "panitia", "wasit"]),
  club_id: z.string().optional(),
});

interface UserFormDialogProps {
  user: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function UserFormDialog({
  user,
  open,
  onOpenChange,
  onSuccess,
}: UserFormDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: "",
      phone: "",
      role: "panitia",
      club_id: "",
    },
  });

  const selectedRole = form.watch("role");

  const { data: clubs } = useQuery({
    queryKey: ["clubs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clubs")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        full_name: user.full_name || "",
        phone: user.phone || "",
        role: user.user_role?.role || "panitia",
        club_id: user.user_role?.club_id || "",
      });
    } else {
      form.reset({
        full_name: "",
        phone: "",
        role: "panitia",
        club_id: "",
      });
    }
  }, [user, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: values.full_name,
          phone: values.phone,
        })
        .eq("id", user.id);

      if (profileError) throw profileError;

      // Check if user already has a role
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (existingRole) {
        // Update existing role
        const { error: roleError } = await supabase
          .from("user_roles")
          .update({
            role: values.role,
            club_id: values.role === "admin_klub" ? values.club_id : null,
          })
          .eq("user_id", user.id);

        if (roleError) throw roleError;
      } else {
        // Insert new role
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({
            user_id: user.id,
            role: values.role,
            club_id: values.role === "admin_klub" ? values.club_id : null,
          });

        if (roleError) throw roleError;
      }

      toast({
        title: "Berhasil",
        description: "Data pengguna berhasil diperbarui",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal",
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Pengguna</DialogTitle>
          <DialogDescription>
            Perbarui informasi dan role pengguna
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Lengkap</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>No. Telepon</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="admin_federasi">Admin Federasi</SelectItem>
                      <SelectItem value="admin_klub">Admin Klub</SelectItem>
                      <SelectItem value="panitia">Panitia</SelectItem>
                      <SelectItem value="wasit">Wasit</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedRole === "admin_klub" && (
              <FormField
                control={form.control}
                name="club_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Klub</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih klub" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clubs?.map((club) => (
                          <SelectItem key={club.id} value={club.id}>
                            {club.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
