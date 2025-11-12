import { Input, type InputProps } from "@/components/input";
import { Label } from "@/components/label";
import { Section } from "./section";

type LabelInputProps = InputProps & {
  label: string;
  htmlFor?: string;
};

export function LabelInput({ label, htmlFor, ...inputProps }: LabelInputProps) {
  return (
    <Section variant="invisible">
      <Label htmlFor={htmlFor}>{label}</Label>
      <Input {...inputProps} />
    </Section>
  );
}
