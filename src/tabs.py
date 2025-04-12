import customtkinter as ctk
from .charts import create_customer_pie_chart, create_daily_line_chart, create_project_bar_chart


def setup_time_entries_tab(tab, data_frame):
    """Zeigt die Zeiteinträge als Tabelle an"""
    # Frame für die Tabelle
    table_frame = ctk.CTkFrame(tab)
    table_frame.pack(padx=10, pady=10, fill="both", expand=True)
    
    # Tabellenkopf erstellen
    headers = ["Kunde", "Projekt", "Datum", "Dauer", "Notiz"]
    col_widths = [200, 100, 100, 100, 400]
    
    # Header-Zeile
    for i, header in enumerate(headers):
        label = ctk.CTkLabel(table_frame, text=header, font=("Arial", 12, "bold"), 
                          width=col_widths[i])
        label.grid(row=0, column=i, padx=5, pady=5, sticky="w")
    
    # Daten einfügen (erste 20 Einträge)
    data = data_frame.head(20)
    for idx, row in enumerate(data.itertuples(), 1):
        # Kunde
        ctk.CTkLabel(table_frame, text=row.Kunden, 
                  width=col_widths[0]).grid(row=idx, column=0, padx=5, pady=2, sticky="w")
        
        # Projekt
        ctk.CTkLabel(table_frame, text=row.Auftrag,
                  width=col_widths[1]).grid(row=idx, column=1, padx=5, pady=2, sticky="w")
        
        # Datum
        datum = row._4.strftime('%d.%m.%Y')
        ctk.CTkLabel(table_frame, text=datum,
                  width=col_widths[2]).grid(row=idx, column=2, padx=5, pady=2, sticky="w")
        
        # Dauer
        ctk.CTkLabel(table_frame, text=row.Dauer,
                  width=col_widths[3]).grid(row=idx, column=3, padx=5, pady=2, sticky="w")
        
        # Notiz (gekürzt)
        notiz = row.Notiz if isinstance(row.Notiz, str) else ""
        if len(notiz) > 50:
            notiz = notiz[:47] + "..."
        ctk.CTkLabel(table_frame, text=notiz, 
                  width=col_widths[4]).grid(row=idx, column=4, padx=5, pady=2, sticky="w")


def setup_statistics_tab(tab, data_manager, selected_customer=None):
    """Zeigt die statistischen Grafiken an"""
    # Erstelle einen Container für die Grafiken
    charts_container = ctk.CTkFrame(tab)
    charts_container.pack(padx=20, pady=20, fill="both", expand=True)
    
    # Erste Reihe: Zeit pro Kunde und Zeit pro Tag
    top_row = ctk.CTkFrame(charts_container)
    top_row.pack(fill="both", expand=True, padx=10, pady=10)
    
    # Zweite Reihe: Zeit pro Projekt
    bottom_row = ctk.CTkFrame(charts_container)
    bottom_row.pack(fill="both", expand=True, padx=10, pady=10)
    
    # Chart 1: Zeit pro Kunde (Pie Chart)
    client_chart_frame = ctk.CTkFrame(top_row)
    client_chart_frame.pack(side="left", fill="both", expand=True, padx=5, pady=5)
    
    # Chart 2: Zeit pro Tag (Line Chart)
    daily_chart_frame = ctk.CTkFrame(top_row)
    daily_chart_frame.pack(side="right", fill="both", expand=True, padx=5, pady=5)
    
    # Chart 3: Zeit pro Projekt (Bar Chart)
    project_chart_frame = ctk.CTkFrame(bottom_row)
    project_chart_frame.pack(fill="both", expand=True, padx=5, pady=5)
    
    # Erstelle die Grafiken mit den passenden Daten
    customer = None if selected_customer == "Alle Kunden" else selected_customer
    
    # Kundendiagramm
    customer_data = data_manager.get_time_by_customer()
    create_customer_pie_chart(client_chart_frame, customer_data)
    
    # Tagesdiagramm
    daily_data = data_manager.get_time_by_day(customer)
    create_daily_line_chart(daily_chart_frame, daily_data)
    
    # Projektdiagramm
    project_data = data_manager.get_time_by_project(customer)
    create_project_bar_chart(project_chart_frame, project_data)
    
    return {
        'client_chart_frame': client_chart_frame,
        'daily_chart_frame': daily_chart_frame,
        'project_chart_frame': project_chart_frame
    }


def setup_reports_tab(tab):
    """Zeigt Berichtsoptionen und Export-Funktionalitäten"""
    # Container für die Reports
    reports_container = ctk.CTkFrame(tab)
    reports_container.pack(padx=20, pady=20, fill="both", expand=True)
    
    # Überschrift
    report_title = ctk.CTkLabel(
        reports_container, text="Zeitberichte", font=("Arial", 18)
    )
    report_title.pack(pady=(20, 30))
    
    # Berichtsoptionen
    options_frame = ctk.CTkFrame(reports_container)
    options_frame.pack(fill="x", padx=20, pady=10)
    
    # Optionen für Berichtstyp
    report_label = ctk.CTkLabel(options_frame, text="Berichtstyp:")
    report_label.grid(row=0, column=0, padx=10, pady=10, sticky="w")
    
    report_types = ["Täglicher Bericht", "Wöchentlicher Bericht", "Monatlicher Bericht", "Kundenspezifischer Bericht"]
    report_dropdown = ctk.CTkOptionMenu(options_frame, values=report_types)
    report_dropdown.grid(row=0, column=1, padx=10, pady=10)
    
    # Export-Buttons
    export_frame = ctk.CTkFrame(reports_container)
    export_frame.pack(fill="x", padx=20, pady=30)
    
    export_pdf = ctk.CTkButton(export_frame, text="Als PDF exportieren")
    export_pdf.pack(side="left", padx=20)
    
    export_csv = ctk.CTkButton(export_frame, text="Als CSV exportieren")
    export_csv.pack(side="left", padx=20)
    
    # Vorschau-Bereich
    preview_label = ctk.CTkLabel(reports_container, text="Berichtsvorschau:")
    preview_label.pack(anchor="w", padx=20, pady=(30, 10))
    
    preview_frame = ctk.CTkFrame(reports_container, fg_color="#555555")
    preview_frame.pack(fill="both", expand=True, padx=20, pady=(0, 20))
    
    preview_text = ctk.CTkLabel(
        preview_frame, 
        text="Hier erscheint die Berichtsvorschau, wenn ein Bericht generiert wird.",
        wraplength=600
    )
    preview_text.pack(pady=50)
    
    return {
        'report_dropdown': report_dropdown,
        'export_pdf': export_pdf,
        'export_csv': export_csv,
        'preview_frame': preview_frame
    }