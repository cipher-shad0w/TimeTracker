import ctypes

ctypes.CDLL("libX11.so.6").XInitThreads()

import customtkinter as ctk

app = ctk.CTk()
app.title("Hyprland Test")
app.mainloop()
