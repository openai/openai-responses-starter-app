"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Właściwości wariantów etykiety
 * Definiuje możliwe warianty stylów dla komponentu Label
 */
const label_variants = cva(
    "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
)

/**
 * Właściwości komponentu Label
 * Rozszerza standardowe właściwości HTML elementu label oraz warianty
 */
interface LabelProps
    extends React.LabelHTMLAttributes<HTMLLabelElement>,
    VariantProps<typeof label_variants> {
    /**
     * Element potomny do wyświetlenia w etykiecie
     */
    children?: React.ReactNode
}

/**
 * Komponent Label służący do tworzenia etykiet dla pól formularzy
 * Wykorzystuje konwencję React.forwardRef dla przekazania referencji
 *
 * @param props - Właściwości komponentu
 * @param ref - Referencja do elementu label
 * @returns Komponent Label z odpowiednimi stylami
 */
const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
    ({ className, ...props }, ref) => (
        <label
            ref={ref}
            className={cn(label_variants(), className)}
            {...props}
        />
    )
)
Label.displayName = "Label"

export { Label }
