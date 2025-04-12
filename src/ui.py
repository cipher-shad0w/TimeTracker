import customtkinter as ctk
import os
from .data_manager import TimeDataManager
from .charts import create_customer_pie_chart, create_daily_line_chart, create_project_bar_chart
from .tabs import setup_time_entries_tab, setup_statistics_tab, setup_reports_tab


class App(ctk.CTk):
    def __init__(self) -> None:
        super().__init__()
        ctk.set_default_color_theme("dark-blue")
        self.geometry("1500x1000")
        self.title("Time Tracker")
        
        # Initialisiere den TimeDataManager mit den CSV-Daten
        csv_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 
                               "data", "example_csv_time.csv")
        self.data_manager = TimeDataManager(csv_path)
        
        # UI-Komponenten initialisieren
        self.chart_frames = None
        self.create_widgets()

    def create_widgets(self) -> None:
        # Erstelle die Hauptframes mit verschiedenen Grautönen
        self.top_frame = ctk.CTkFrame(self, fg_color="#424242", height=100)
        self.top_frame.pack(side="top", fill="x", padx=10, pady=10)

        self.content_frame = ctk.CTkFrame(self)
        self.content_frame.pack(
            side="bottom", fill="both", expand=True, padx=10, pady=(0, 10)
        )

        self.left_frame = ctk.CTkFrame(
            self.content_frame, fg_color="#757575", width=300
        )
        self.left_frame.pack(side="left", fill="y", padx=(0, 10), pady=0)

        self.right_frame = ctk.CTkFrame(self.content_frame, fg_color="#9E9E9E")
        self.right_frame.pack(side="right", fill="both", expand=True)

        # Add content to top frame
        self.title_label = ctk.CTkLabel(
            self.top_frame, text="Time Tracker", font=("Arial", 24)
        )
        self.title_label.pack(pady=30)

        # Kunden-Auswahl hinzufügen mit den tatsächlichen Kundendaten
        self._setup_left_panel()

        # Create tabview in right frame
        self.create_tabview()

    def _setup_left_panel(self):
        """Erstellt die Steuerelemente im linken Panel"""
        # Überschrift
        settings_label = ctk.CTkLabel(self.left_frame, text="Einstellungen", font=("Arial", 18))
        settings_label.pack(pady=(20, 20))
        
        # Kundenauswahl
        self.customer_label = ctk.CTkLabel(self.left_frame, text="Kunde auswählen:")
        self.customer_label.pack(pady=(10, 5))
        
        # "Alle Kunden" Option hinzufügen
        customers = ["Alle Kunden"] + self.data_manager.customers
        
        self.optionmenu = ctk.CTkOptionMenu(
            self.left_frame, values=customers, command=self.set_customer
        )
        self.optionmenu.set("Alle Kunden")
        self.optionmenu.pack(pady=(0, 20))
        
        # Datum-Bereich
        date_label = ctk.CTkLabel(self.left_frame, text="Zeitraum:")
        date_label.pack(pady=(10, 5))
        
        # Erstellte eine Dropdown für Zeiträume
        date_ranges = ["Letzte Woche", "Letzter Monat", "Letztes Quartal", "Alle Zeiten"]
        self.date_option = ctk.CTkOptionMenu(
            self.left_frame, values=date_ranges, command=self.update_date_range
        )
        self.date_option.set("Alle Zeiten")
        self.date_option.pack(pady=(0, 20))
        
        # Aktualisieren-Button
        refresh_button = ctk.CTkButton(
            self.left_frame, text="Aktualisieren", command=self.refresh_data
        )
        refresh_button.pack(pady=(30, 10))
        
        # Statistik-Zusammenfassung
        self.summary_label = ctk.CTkLabel(self.left_frame, text="Statistik Übersicht:")
        self.summary_label.pack(pady=(30, 5))
        
        # Frame für Zusammenfassung
        summary_frame = ctk.CTkFrame(self.left_frame, fg_color="#6B6B6B")
        summary_frame.pack(pady=10, padx=10, fill="x")
        
        # Gesamt Zeit
        self.total_time_label = ctk.CTkLabel(summary_frame, text="Gesamtzeit: 0h 0m")
        self.total_time_label.pack(pady=(10, 5), padx=10, anchor="w")
        
        # Update the summary
        self.update_summary()

    def create_tabview(self):
        # Add tabview to right frame
        self.tabview = ctk.CTkTabview(self.right_frame, fg_color="#616161")
        self.tabview.pack(padx=20, pady=20, fill="both", expand=True)

        # Create the three tabs
        self.time_entries_tab = self.tabview.add("Zeiteintragungen")
        self.statistics_tab = self.tabview.add("Statistiken")
        self.reports_tab = self.tabview.add("Berichte")

        # Set default tab
        self.tabview.set("Statistiken")
        
        # Fülle die Tabs mit Inhalt - jetzt aus externen Funktionen
        setup_time_entries_tab(self.time_entries_tab, self.data_manager.data)
        self.chart_frames = setup_statistics_tab(self.statistics_tab, self.data_manager)
        self.report_widgets = setup_reports_tab(self.reports_tab)
    
    def set_customer(self, customer: str) -> None:
        """Behandelt die Kundenauswahl und aktualisiert die Daten"""
        self.refresh_data()
    
    def update_date_range(self, range_option: str) -> None:
        """Aktualisiert den Datumsbereich für die Filterung"""
        # Diese Funktion würde die Daten nach Datum filtern
        self.refresh_data()
    
    def refresh_data(self):
        """Aktualisiert alle Diagramme und Ansichten"""
        selected_customer = self.optionmenu.get()
        customer = None if selected_customer == "Alle Kunden" else selected_customer
        
        # Aktualisiere die Diagramme mit den externen Chart-Funktionen
        if self.chart_frames:
            customer_data = self.data_manager.get_time_by_customer()
            daily_data = self.data_manager.get_time_by_day(customer)
            project_data = self.data_manager.get_time_by_project(customer)
            
            create_customer_pie_chart(self.chart_frames['client_chart_frame'], customer_data)
            create_daily_line_chart(self.chart_frames['daily_chart_frame'], daily_data)
            create_project_bar_chart(self.chart_frames['project_chart_frame'], project_data)
        
        # Aktualisiere die Zusammenfassung
        self.update_summary()
    
    def update_summary(self):
        """Aktualisiert die Zusammenfassung im linken Panel"""
        selected_customer = self.optionmenu.get()
        customer = None if selected_customer == "Alle Kunden" else selected_customer
        
        # Berechne die Gesamtzeit
        total_minutes = self.data_manager.get_total_time(customer)
        hours = int(total_minutes // 60)
        minutes = int(total_minutes % 60)
        
        # Aktualisiere das Label
        self.total_time_label.configure(text=f"Gesamtzeit: {hours}h {minutes}m")
        
        # Wenn ein bestimmter Kunde ausgewählt ist, aktualisiere den Text entsprechend
        if customer:
            self.summary_label.configure(text=f"Statistik für {customer}:")
        else:
            self.summary_label.configure(text="Statistik Übersicht:")


if __name__ == "__main__":
    app = App()
    app.mainloop()
