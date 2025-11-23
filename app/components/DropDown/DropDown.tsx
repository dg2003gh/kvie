import React, { useState, ReactNode, useEffect, useRef } from "react";

interface DropdownProps {
  children: ReactNode;
  icon?: ReactNode;
  defaultValueId?: string;
}

export default function Dropdown({
  children,
  icon,
  defaultValueId,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const optionRef = useRef<HTMLElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);

  const open = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    event.stopPropagation();

    setIsOpen(true);
    optionsRef.current?.classList.remove("opacity-0");
  };

  const close = (
    event: React.MouseEvent<HTMLLIElement, MouseEvent> | MouseEvent,
  ) => {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target as Node)
    ) {
      optionsRef.current?.classList.add("opacity-0");
      setTimeout(() => setIsOpen(false), 600);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", close);

    if (optionRef.current === null)
      optionRef.current = document.getElementById(`${defaultValueId}`);

    return () => {
      document.removeEventListener("mousedown", close);
    };
  }, [isOpen, defaultValueId]);

  useEffect(() => {
    if (!optionsRef.current) return;

    optionsRef.current.querySelectorAll("li").forEach((li) => {
      li.id === optionRef.current?.id
        ? li.classList.add("bg-zinc-800")
        : li.classList.remove("bg-zinc-800");
    });
  }, [isOpen, optionRef.current]);

  return (
    <div
      ref={dropdownRef}
      className={`relative cursor-pointer inline-block text-left`}
    >
      <button
        onClick={open}
        className="bg-zinc-900 cursor-pointer text-white border border-slate-700 px-4 py-2 rounded-md focus:outline-none"
      >
        {icon ? icon : optionRef.current?.innerText}
      </button>

      {isOpen && (
        <div
          ref={optionsRef}
          className="absolute w-fit min-w-14 bg-zinc-900 right-5 top-10 p-2 opacity-100 opacity-0  transition-opacity duration-500 border border-slate-700 shadow-lg rounded-md "
        >
          <ul className="py-1 max-h-44 min-w-fit overflow-y-scroll overflow-x-hidden">
            {React.Children.map(children, (child, key) => {
              return (
                <li
                  id={String(key)}
                  key={key}
                  onClick={(e) => {
                    optionRef.current = e.currentTarget;
                    close(e);
                  }}
                  className="w-full min-w-14 h-full text-left font-bold hover:bg-zinc-800 cursor-pointer rounded-2xl text-nowrap p-2 overflow-x-hidden"
                >
                  {child}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
