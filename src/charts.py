import matplotlib.pyplot as plt
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
import customtkinter as ctk


def create_customer_pie_chart(frame, customer_data):
    """Erstellt ein Kuchendiagramm der Zeit pro Kunde"""
    # Lösche bisherige Widgets
    for widget in frame.winfo_children():
        widget.destroy()
        
    # Titel
    title_label = ctk.CTkLabel(frame, text="Zeit pro Kunde", font=("Arial", 14, "bold"))
    title_label.pack(pady=(10, 5))
    
    # Prüfe ob Daten verfügbar sind
    if customer_data.empty:
        ctk.CTkLabel(frame, text="Keine Daten verfügbar").pack(pady=50)
        return
        
    # Erstelle das Diagramm
    fig, ax = plt.subplots(figsize=(5, 4), dpi=100)
    ax.pie(
        customer_data['Minuten'], 
        labels=customer_data['Kunden'],
        autopct='%1.1f%%',
        startangle=90,
        wedgeprops={'edgecolor': 'white', 'linewidth': 1}
    )
    ax.axis('equal')  # Ensures the pie chart is circular
    plt.tight_layout()
    
    # Füge das Diagramm in den Frame ein
    canvas = FigureCanvasTkAgg(fig, master=frame)
    canvas.draw()
    canvas.get_tk_widget().pack(fill="both", expand=True)


def create_daily_line_chart(frame, daily_data):
    """Erstellt ein Liniendiagramm der Zeit pro Tag"""
    # Lösche bisherige Widgets
    for widget in frame.winfo_children():
        widget.destroy()
        
    # Titel
    title_label = ctk.CTkLabel(frame, text="Zeit pro Tag", font=("Arial", 14, "bold"))
    title_label.pack(pady=(10, 5))
    
    # Prüfe ob Daten verfügbar sind
    if daily_data.empty:
        ctk.CTkLabel(frame, text="Keine Daten verfügbar").pack(pady=50)
        return
        
    # Erstelle das Diagramm
    fig, ax = plt.subplots(figsize=(5, 4), dpi=100)
    ax.plot(
        daily_data['Start Date'], 
        daily_data['Minuten'] / 60,  # Konvertiere zu Stunden
        marker='o',
        linestyle='-',
        color='#007acc'
    )
    
    # Formatierung
    ax.set_ylabel('Stunden')
    ax.set_xlabel('Datum')
    ax.grid(True, linestyle='--', alpha=0.7)
    
    # Rotate x-axis labels for better readability
    plt.xticks(rotation=45)
    plt.tight_layout()
    
    # Füge das Diagramm in den Frame ein
    canvas = FigureCanvasTkAgg(fig, master=frame)
    canvas.draw()
    canvas.get_tk_widget().pack(fill="both", expand=True)


def create_project_bar_chart(frame, project_data, top_n=10):
    """Erstellt ein Balkendiagramm der Zeit pro Projekt"""
    # Lösche bisherige Widgets
    for widget in frame.winfo_children():
        widget.destroy()
        
    # Titel
    title_label = ctk.CTkLabel(frame, text="Zeit pro Projekt", font=("Arial", 14, "bold"))
    title_label.pack(pady=(10, 5))
    
    # Prüfe ob Daten verfügbar sind
    if project_data.empty:
        ctk.CTkLabel(frame, text="Keine Daten verfügbar").pack(pady=50)
        return
        
    # Limitiere auf Top N Projekte für bessere Lesbarkeit
    if len(project_data) > top_n:
        project_data = project_data.head(top_n)
        
    # Erstelle das Diagramm
    fig, ax = plt.subplots(figsize=(8, 4), dpi=100)
    bars = ax.barh(
        project_data['Auftrag'], 
        project_data['Minuten'] / 60,  # Konvertiere zu Stunden
        color='#5cb85c'
    )
    
    # Formatierung
    ax.set_xlabel('Stunden')
    ax.set_title('Top Projekte nach Zeitaufwand')
    ax.grid(True, axis='x', linestyle='--', alpha=0.7)
    
    # Werte am Ende der Balken anzeigen
    for bar in bars:
        width = bar.get_width()
        label_x_pos = width + 0.1
        ax.text(label_x_pos, bar.get_y() + bar.get_height()/2, f'{width:.1f}h',
               va='center')
    
    plt.tight_layout()
    
    # Füge das Diagramm in den Frame ein
    canvas = FigureCanvasTkAgg(fig, master=frame)
    canvas.draw()
    canvas.get_tk_widget().pack(fill="both", expand=True)