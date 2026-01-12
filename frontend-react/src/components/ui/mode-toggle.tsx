import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useThemeStore } from "@/stores/themeStore"

export function ModeToggle() {
    const { theme, toggleTheme } = useThemeStore()

    return (
        <Button variant="ghost" size="icon" onClick={toggleTheme} title={theme === 'dark' ? "Switch to light mode" : "Switch to dark mode"}>
            {theme === 'dark' ? <Sun className="size-5" /> : <Moon className="size-5" />}
        </Button>
    )
}
