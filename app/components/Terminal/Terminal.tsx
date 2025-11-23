export default function Terminal({ isOpen }: { isOpen: boolean }) {
  return (
    <textarea
      className={`absolute z-10 left-64 right-1 bottom-1 backdrop-blur-md shadow-xl rounded-2xl ${isOpen ? "visible" : "hidden"} transition-opacity ${isOpen ? "opacity-100" : "opacity-0"}
        bg-black/70 border-2 border-slate-500 focus:border-emerald-500/60 text-white text-2xl p-2 h-3/6 resize`}
    >
      $ ~
    </textarea>
  );
}
