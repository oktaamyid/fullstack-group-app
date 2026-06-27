import { Dialog } from "../ui/Dialog";
import { Button } from "../ui/Button";

export function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirm", cancelText = "Cancel", isDanger = false }) {
  if (!isOpen) return null;

  return (
    <Dialog isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col overflow-hidden rounded-3xl border-2 border-[#1c1c13] bg-[#fffbeb] shadow-[8px_8px_0_#1c1c13]">
        <header className={`flex items-center justify-between border-b-2 border-[#1c1c13] px-6 py-4 ${isDanger ? 'bg-red-400' : 'bg-[#ffc329]'}`}>
          <h2 className="text-lg font-black uppercase tracking-tight text-[#1c1c13]">
            {title}
          </h2>
        </header>

        <div className="p-6">
          <p className="text-sm font-bold text-[#1c1c13] mb-6">
            {message}
          </p>

          <div className="flex gap-3">
            <Button type="button" variant="outline" fullWidth onClick={onClose}>
              {cancelText}
            </Button>
            <Button 
              type="button" 
              variant={isDanger ? "outline" : "accent"} 
              className={isDanger ? "border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600 bg-white" : ""}
              fullWidth 
              onClick={onConfirm}
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
