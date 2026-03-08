import { useTheme, COLOR_SCHEMES, ColorScheme } from '@/contexts/ThemeContext';
import { Palette, Monitor, Sun, Moon, Code2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

const Developer = () => {
  const { colorScheme, setColorScheme, isDark, setIsDark } = useTheme();

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
          <Code2 className="w-6 h-6 text-primary" />
          Developer Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Customize login screen appearance and application theme</p>
      </div>

      {/* Dark/Light Toggle */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isDark ? <Moon className="w-5 h-5 text-primary" /> : <Sun className="w-5 h-5 text-primary" />}
            <div>
              <h3 className="text-sm font-semibold text-foreground">Theme Mode</h3>
              <p className="text-xs text-muted-foreground">Switch between light and dark mode</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">{isDark ? 'Dark' : 'Light'}</span>
            <Switch checked={isDark} onCheckedChange={setIsDark} />
          </div>
        </div>
      </div>

      {/* Color Scheme Selection */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <Palette className="w-5 h-5 text-primary" />
          <div>
            <h3 className="text-sm font-semibold text-foreground">Color Scheme</h3>
            <p className="text-xs text-muted-foreground">Choose the primary color scheme for the application and login screen</p>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-4">
          {(Object.entries(COLOR_SCHEMES) as [ColorScheme, typeof COLOR_SCHEMES[ColorScheme]][]).map(([key, scheme]) => (
            <button
              key={key}
              onClick={() => setColorScheme(key)}
              className={`relative p-4 rounded-xl border-2 transition-all duration-200 ${
                colorScheme === key
                  ? 'border-primary shadow-lg ring-2 ring-primary/20'
                  : 'border-border hover:border-primary/40'
              }`}
            >
              <div
                className="w-full h-16 rounded-lg mb-3"
                style={{ backgroundColor: scheme.preview }}
              />
              <p className="text-sm font-medium text-foreground text-center">{scheme.label}</p>
              {colorScheme === key && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground text-xs">✓</span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Login Preview */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <Monitor className="w-5 h-5 text-primary" />
          <div>
            <h3 className="text-sm font-semibold text-foreground">Login Screen Preview</h3>
            <p className="text-xs text-muted-foreground">Preview of the login screen with current theme settings</p>
          </div>
        </div>

        <div className={`rounded-xl border border-border overflow-hidden ${isDark ? 'bg-[hsl(220,25%,7%)]' : 'bg-[hsl(0,0%,98%)]'}`}>
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center">
              <div className="w-[180px] h-[250px] overflow-hidden rounded-l-lg">
                <img src="/src/assets/logo.png" alt="Preview Logo" className="w-full h-full object-cover" />
              </div>
              <div className={`p-6 w-[240px] h-[250px] flex flex-col justify-center rounded-r-lg border ${isDark ? 'bg-[hsl(220,22%,10%)] border-[hsl(220,15%,18%)]' : 'bg-white border-[hsl(220,13%,88%)]'}`}>
                <h2 className={`text-sm font-semibold mb-4 text-center ${isDark ? 'text-[hsl(210,40%,95%)]' : 'text-[hsl(220,20%,15%)]'}`}>Sign In</h2>
                <div className="space-y-3">
                  <div className={`h-8 rounded-md border ${isDark ? 'bg-[hsl(220,18%,14%)] border-[hsl(220,15%,18%)]' : 'bg-[hsl(220,14%,96%)] border-[hsl(220,13%,88%)]'}`} />
                  <div className={`h-8 rounded-md border ${isDark ? 'bg-[hsl(220,18%,14%)] border-[hsl(220,15%,18%)]' : 'bg-[hsl(220,14%,96%)] border-[hsl(220,13%,88%)]'}`} />
                  <div className="h-8 rounded-md" style={{ backgroundColor: COLOR_SCHEMES[colorScheme].preview }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Developer;
