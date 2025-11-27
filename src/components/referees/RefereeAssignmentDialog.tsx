import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  referee_id: z.string().min(1, "Pilih wasit"),
  role: z.string().min(1, "Pilih peran"),
  notes: z.string().optional(),
});

interface RefereeAssignmentDialogProps {
  open: boolean;
  matchId: string;
  existingOfficials: any[];
  onClose: (saved: boolean) => void;
}

export function RefereeAssignmentDialog({
  open,
  matchId,
  existingOfficials,
  onClose,
}: RefereeAssignmentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [referees, setReferees] = useState<any[]>([]);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      referee_id: "",
      role: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (open) {
      fetchReferees();
      form.reset({
        referee_id: "",
        role: "",
        notes: "",
      });
    }
  }, [open, form]);

  const fetchReferees = async () => {
    try {
      const { data, error } = await supabase
        .from("referees")
        .select("*")
        .eq("status", "active")
        .order("full_name");

      if (error) throw error;
      setReferees(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal memuat data wasit",
        description: error.message,
      });
    }
  };

  const getAvailableRoles = () => {
    const allRoles = [
      { value: "referee", label: "Wasit Utama" },
      { value: "assistant_1", label: "Asisten Wasit 1" },
      { value: "assistant_2", label: "Asisten Wasit 2" },
      { value: "fourth_official", label: "Wasit Keempat" },
      { value: "var", label: "VAR" },
    ];

    const assignedRoles = existingOfficials.map((o) => o.role);
    return allRoles.filter((role) => !assignedRoles.includes(role.value));
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setLoading(true);

      const { error } = await supabase.from("match_officials").insert({
        match_id: matchId,
        referee_id: values.referee_id,
        role: values.role,
        notes: values.notes || null,
        confirmed: false,
      });

      if (error) throw error;

      toast({
        title: "Wasit ditugaskan",
        description: "Wasit berhasil ditugaskan untuk pertandingan ini",
      });

      onClose(true);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal menugaskan wasit",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const availableRoles = getAvailableRoles();

  return (
    <Dialog open={open} onOpenChange={() => onClose(false)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tugaskan Wasit</DialogTitle>
          <DialogDescription>
            Pilih wasit dan perannya untuk pertandingan ini
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Peran *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={availableRoles.length === 0}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            availableRoles.length === 0
                              ? "Semua peran sudah terisi"
                              : "Pilih peran wasit"
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableRoles.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="referee_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Wasit *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih wasit" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {referees.map((referee) => (
                        <SelectItem key={referee.id} value={referee.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{referee.full_name}</span>
                            <span className="text-xs text-muted-foreground ml-2">
                              {referee.license_type}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Catatan</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Catatan tambahan untuk penugasan ini"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onClose(false)}
                disabled={loading}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={loading || availableRoles.length === 0}
              >
                {loading ? "Menyimpan..." : "Tugaskan"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
