import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/services/supabase/client";

export default function Sidebar() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/Auth");
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-900 text-white shadow-lg hover:bg-zinc-800"
      >
        ☰
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-50 h-full w-64 transform bg-zinc-900 border-r border-zinc-800 p-6 transition-transform ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col justify-between">
          {/* Menu */}
          <div>
            <h2 className="mb-8 text-xl font-bold text-white">AMA da Favela</h2>

            <nav className="space-y-2">
              <button
                onClick={() => {
                  navigate("/dashboard");
                  setOpen(false);
                }}
                className="w-full rounded-lg px-4 py-3 text-left text-zinc-300 hover:bg-zinc-800"
              >
                Dashboard
              </button>

              <button
                onClick={() => {
                  navigate("/dashboard/lost-and-found");
                  setOpen(false);
                }}
                className="w-full rounded-lg px-4 py-3 text-left text-zinc-300 hover:bg-zinc-800"
              >
                Achados e Perdidos
              </button>

              <button
                onClick={() => {
                  navigate("/dashboard/lost-animals");
                  setOpen(false);
                }}
                className="w-full rounded-lg px-4 py-3 text-left text-zinc-300 hover:bg-zinc-800"
              >
                Animais Perdidos
              </button>

              <button
                onClick={() => {
                  navigate("/dashboard/home-rent");
                  setOpen(false);
                }}
                className="w-full rounded-lg px-4 py-3 text-left text-zinc-300 hover:bg-zinc-800"
              >
                Moradia
              </button>
            </nav>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="rounded-lg bg-red-500/10 px-4 py-3 text-left text-red-400 hover:bg-red-500/20"
          >
            Sair da conta
          </button>
        </div>
      </aside>
    </>
  );
}
