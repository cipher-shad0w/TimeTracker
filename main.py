import ctypes
import customtkinter as ctk
from src.ui import App

# Fix for XCB thread issues on Linux
try:
    ctypes.CDLL("libX11.so.6").XInitThreads()
except:
    print("Warning: Could not initialize XCB threads. UI might have issues.")

def main() -> None:
    ui_zoom = 1.5
    
    ctk.set_widget_scaling(ui_zoom)      # Controls UI element sizes
    ctk.set_window_scaling(1.0)          # Keep window size constant
    
    app = App()
    app.mainloop()

if __name__ == "__main__":
    main()