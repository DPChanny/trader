import type { JSX } from "preact";
import "./button.css";

interface ButtonProps {
  onClick?: (e: JSX.TargetedMouseEvent<HTMLButtonElement>) => void;
  children: JSX.Element | string;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  className?: string;
}

export function PrimaryButton({
  onClick,
  children,
  disabled,
  type = "button",
  className = "",
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`btn-primary ${className}`}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({
  onClick,
  children,
  disabled,
  type = "button",
  className = "",
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`btn-secondary ${className}`}
    >
      {children}
    </button>
  );
}

export function EditButton({
  onClick,
  disabled,
  className = "",
}: Omit<ButtonProps, "children">) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`btn-icon btn-edit ${className}`}
      title="수정"
    >
      ✎
    </button>
  );
}

export function DeleteButton({
  onClick,
  disabled,
  className = "",
}: Omit<ButtonProps, "children">) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`btn-icon btn-delete ${className}`}
      title="삭제"
    >
      🗑
    </button>
  );
}

export function CloseButton({
  onClick,
  disabled,
  className = "",
}: Omit<ButtonProps, "children">) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`btn-icon btn-close ${className}`}
      title="닫기"
    >
      ✕
    </button>
  );
}

export function SaveButton({
  onClick,
  disabled,
  className = "",
}: Omit<ButtonProps, "children">) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`btn-icon btn-save ${className}`}
      title="저장"
    >
      ✓
    </button>
  );
}

export function DangerButton({
  onClick,
  children,
  disabled,
  type = "button",
  className = "",
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`btn-danger-full ${className}`}
    >
      {children}
    </button>
  );
}
