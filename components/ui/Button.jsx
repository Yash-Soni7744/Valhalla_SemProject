import * as React from "react"
import { cn } from "../../utils/cn"

import { Loader2 } from "lucide-react"

/**
 * BUTTON COMPONENT
 * 
 * A reusable button that can have different styles (primary, outline, etc.) 
 * and can show a loading spinner.
 */
const Button = React.forwardRef(
    ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {

        // Different style 'variants' for the button
        const variants = {
            primary: "bg-primary text-primary-foreground hover:bg-primary/90",
            secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
            outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
            ghost: "hover:bg-accent hover:text-accent-foreground",
            destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        }

        // Different 'sizes' for the button
        const sizes = {
            sm: "h-9 rounded-md px-3",
            md: "h-10 px-4 py-2 rounded-md",
            lg: "h-11 rounded-md px-8",
        }

        return (
            <button
                className={cn(
                    "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                    variants[variant],
                    sizes[size],
                    className
                )}
                ref={ref}
                disabled={isLoading || disabled}
                {...props}
            >
                {/* Show a spinner if the button is in 'loading' state */}
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {children}
            </button>
        )
    }
)
Button.displayName = "Button"

export { Button }

