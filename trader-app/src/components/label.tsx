import "./label.css";

interface LabelProps {
  children: any;
  htmlFor?: string;
}

export function Label({ children, htmlFor }: LabelProps) {
  return (
    <label className="form-label" htmlFor={htmlFor}>
      {children}
    </label>
  );
}
