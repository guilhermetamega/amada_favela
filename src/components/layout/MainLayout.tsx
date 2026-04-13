import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
};

export default function MainLayout({ children, className }: Props) {
  return (
    <div
      className={`px-4 pt-12 pb-4 sm:px-5 sm:py-5 md:px-8 md:py-8 ${className}`}
    >
      {children}
    </div>
  );
}
