import React, { useEffect } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className: string;
}

export default function Modal({
  isOpen,
  onClose,
  children,
  className,
}: ModalProps) {
  const handleOutsideClick = (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>,
  ) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  }, [isOpen]);

  return (
    <div
      className={`fixed inset-0 z-50 bg-[rgba(0,0,0,0.8)] backdrop-blur-sm flex justify-center items-center transition-opacity duration-300 ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
      onClick={handleOutsideClick}
    >
      <div
        className={`bg-white p-6 rounded-lg shadow-lg transform transition-all duration-300 ${isOpen ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"} ${className}`}
      >
        {children}
      </div>
    </div>
  );
}
