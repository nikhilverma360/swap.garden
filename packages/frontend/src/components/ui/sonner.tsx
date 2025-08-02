"use client"

import { Toaster as Sonner, ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {


  return (
    <Sonner
      theme="light"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-green-50 group-[.toaster]:text-green-900 group-[.toaster]:border-green-200 group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-green-700",
          actionButton:
            "group-[.toast]:bg-green-600 group-[.toast]:text-white",
          cancelButton:
            "group-[.toast]:bg-green-100 group-[.toast]:text-green-600",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
