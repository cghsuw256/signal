import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Sheet({
  open,
  onOpenChange,
  title,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-bg/70" />
        <Dialog.Content
          className={cn(
            "fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col bg-surface shadow-[var(--shadow-border)] outline-none",
          )}
        >
          <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
            <div>
              <Dialog.Title className="font-display text-lg text-fg">{title}</Dialog.Title>
              <Dialog.Description className="sr-only">선택한 보안 이슈의 상세 정보</Dialog.Description>
            </div>
            <Dialog.Close className="inline-flex size-11 items-center justify-center rounded-md text-muted hover:bg-surface-2 hover:text-fg">
              <X className="size-4" />
              <span className="sr-only">닫기</span>
            </Dialog.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
