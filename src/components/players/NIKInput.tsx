import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { validateNIK } from "@/lib/nik-validator";
import { AlertCircle, CheckCircle2, User, MapPin, Calendar } from "lucide-react";

interface NIKInputProps {
  value: string;
  onChange: (value: string) => void;
  onValidationChange?: (isValid: boolean, dateOfBirth?: Date) => void;
  disabled?: boolean;
}

export function NIKInput({ value, onChange, onValidationChange, disabled }: NIKInputProps) {
  const [validation, setValidation] = useState(validateNIK(value));

  useEffect(() => {
    const result = validateNIK(value);
    setValidation(result);
    
    if (onValidationChange) {
      onValidationChange(result.isValid, result.info?.dateOfBirth);
    }
  }, [value, onValidationChange]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.replace(/\D/g, "").slice(0, 16);
    onChange(newValue);
  };

  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor="nik">NIK (Nomor Induk Kependudukan)</Label>
        <Input
          id="nik"
          value={value}
          onChange={handleChange}
          placeholder="1234567890123456"
          maxLength={16}
          disabled={disabled}
          className="font-mono"
        />
        <p className="text-sm text-muted-foreground mt-1">
          Masukkan 16 digit NIK sesuai KTP
        </p>
      </div>

      {value.length > 0 && (
        <>
          {validation.isValid && validation.info ? (
            <Alert className="border-green-500/50 bg-green-500/10">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription>
                <div className="space-y-2 mt-1">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-3.5 w-3.5" />
                    <span className="font-medium">Lokasi:</span>
                    <span>{validation.info.province}, {validation.info.city}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-3.5 w-3.5" />
                    <span className="font-medium">Tanggal Lahir:</span>
                    <span>
                      {validation.info.dateOfBirth.toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-3.5 w-3.5" />
                    <span className="font-medium">Jenis Kelamin:</span>
                    <Badge variant="outline" className="text-xs">
                      {validation.info.gender === "male" ? "Laki-laki" : "Perempuan"}
                    </Badge>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          ) : (
            validation.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <ul className="list-disc list-inside space-y-1">
                    {validation.errors.map((error, index) => (
                      <li key={index} className="text-sm">{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )
          )}
        </>
      )}
    </div>
  );
}
