"use client"

import { Toaster as SonnerToaster, toast as sonnerToast } from "sonner"

export { sonnerToast as toast }

type ToasterProps = React.ComponentProps<typeof SonnerToaster>

export function Toaster({ ...props }: ToasterProps) {
  return (
    <SonnerToaster
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white group-[.toaster]:text-neutral-950 group-[.toaster]:border-neutral-200 group-[.toaster]:shadow-lg dark:group-[.toaster]:bg-neutral-900 dark:group-[.toaster]:text-neutral-50 dark:group-[.toaster]:border-neutral-700",
          description:
            "group-[.toast]:text-neutral-500 dark:group-[.toast]:text-neutral-400",
          actionButton:
            "group-[.toast]:bg-blue-600 group-[.toast]:text-white",
          cancelButton:
            "group-[.toast]:bg-neutral-100 group-[.toast]:text-neutral-500 dark:group-[.toast]:bg-neutral-800 dark:group-[.toast]:text-neutral-400",
        },
      }}
      {...props}
    />
  )
}
