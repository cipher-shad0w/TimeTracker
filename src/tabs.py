import customtkinter as ctk
# Change relative import to absolute import
from src.charts import create_customer_pie_chart, create_daily_line_chart, create_project_bar_chart


def setup_time_entries_tab(tab, data_frame):
    """Shows the time entries as a table"""
    # Frame for the table
    table_frame = ctk.CTkFrame(tab)
    table_frame.pack(padx=10, pady=10, fill="both", expand=True)
    
    # Create table header
    headers = ["Customer", "Project", "Date", "Duration", "Note"]
    col_widths = [200, 100, 100, 100, 400]
    
    # Header row
    for i, header in enumerate(headers):
        label = ctk.CTkLabel(table_frame, text=header, font=("Arial", 12, "bold"), 
                          width=col_widths[i])
        label.grid(row=0, column=i, padx=5, pady=5, sticky="w")
    
    # Insert data (first 20 entries)
    data = data_frame.head(20)
    for idx, row in enumerate(data.itertuples(), 1):
        # Customer
        ctk.CTkLabel(table_frame, text=row.Kunden, 
                  width=col_widths[0]).grid(row=idx, column=0, padx=5, pady=2, sticky="w")
        
        # Project
        ctk.CTkLabel(table_frame, text=row.Auftrag,
                  width=col_widths[1]).grid(row=idx, column=1, padx=5, pady=2, sticky="w")
        
        # Date (now from the new Date column)
        date_str = row.Date.strftime('%d.%m.%Y') if hasattr(row, 'Date') else ""
        ctk.CTkLabel(table_frame, text=date_str,
                  width=col_widths[2]).grid(row=idx, column=2, padx=5, pady=2, sticky="w")
        
        # Duration
        ctk.CTkLabel(table_frame, text=row.Dauer,
                  width=col_widths[3]).grid(row=idx, column=3, padx=5, pady=2, sticky="w")
        
        # Note (shortened)
        note = row.Notiz if isinstance(row.Notiz, str) else ""
        if len(note) > 50:
            note = note[:47] + "..."
        ctk.CTkLabel(table_frame, text=note, 
                  width=col_widths[4]).grid(row=idx, column=4, padx=5, pady=2, sticky="w")


def setup_statistics_tab(tab, data_manager, selected_customer=None):
    """Shows the statistical charts"""
    # Create a container for the charts
    charts_container = ctk.CTkFrame(tab)
    charts_container.pack(padx=20, pady=20, fill="both", expand=True)
    
    # First row: Time per customer and Time per day
    top_row = ctk.CTkFrame(charts_container)
    top_row.pack(fill="both", expand=True, padx=10, pady=10)
    
    # Second row: Time per project
    bottom_row = ctk.CTkFrame(charts_container)
    bottom_row.pack(fill="both", expand=True, padx=10, pady=10)
    
    # Chart 1: Time per customer (Pie Chart)
    client_chart_frame = ctk.CTkFrame(top_row)
    client_chart_frame.pack(side="left", fill="both", expand=True, padx=5, pady=5)
    
    # Chart 2: Time per day (Line Chart)
    daily_chart_frame = ctk.CTkFrame(top_row)
    daily_chart_frame.pack(side="right", fill="both", expand=True, padx=5, pady=5)
    
    # Chart 3: Time per project (Bar Chart)
    project_chart_frame = ctk.CTkFrame(bottom_row)
    project_chart_frame.pack(fill="both", expand=True, padx=5, pady=5)
    
    # Create the charts with the appropriate data
    customer = None if selected_customer == "All Customers" else selected_customer
    
    # Customer chart
    customer_data = data_manager.get_time_by_customer()
    create_customer_pie_chart(client_chart_frame, customer_data)
    
    # Daily chart
    daily_data = data_manager.get_time_by_day(customer)
    create_daily_line_chart(daily_chart_frame, daily_data)
    
    # Project chart
    project_data = data_manager.get_time_by_project(customer)
    create_project_bar_chart(project_chart_frame, project_data)
    
    return {
        'client_chart_frame': client_chart_frame,
        'daily_chart_frame': daily_chart_frame,
        'project_chart_frame': project_chart_frame
    }


def setup_reports_tab(tab):
    """Shows report options and export functionality"""
    # Container for the reports
    reports_container = ctk.CTkFrame(tab)
    reports_container.pack(padx=20, pady=20, fill="both", expand=True)
    
    # Heading
    report_title = ctk.CTkLabel(
        reports_container, text="Time Reports", font=("Arial", 18)
    )
    report_title.pack(pady=(20, 30))
    
    # Report options
    options_frame = ctk.CTkFrame(reports_container)
    options_frame.pack(fill="x", padx=20, pady=10)
    
    # Options for report type
    report_label = ctk.CTkLabel(options_frame, text="Report type:")
    report_label.grid(row=0, column=0, padx=10, pady=10, sticky="w")
    
    report_types = ["Daily Report", "Weekly Report", "Monthly Report", "Customer Specific Report"]
    report_dropdown = ctk.CTkOptionMenu(options_frame, values=report_types)
    report_dropdown.grid(row=0, column=1, padx=10, pady=10)
    
    # Export buttons
    export_frame = ctk.CTkFrame(reports_container)
    export_frame.pack(fill="x", padx=20, pady=30)
    
    export_pdf = ctk.CTkButton(export_frame, text="Export as PDF")
    export_pdf.pack(side="left", padx=20)
    
    export_csv = ctk.CTkButton(export_frame, text="Export as CSV")
    export_csv.pack(side="left", padx=20)
    
    # Preview area
    preview_label = ctk.CTkLabel(reports_container, text="Report preview:")
    preview_label.pack(anchor="w", padx=20, pady=(30, 10))
    
    preview_frame = ctk.CTkFrame(reports_container, fg_color="#555555")
    preview_frame.pack(fill="both", expand=True, padx=20, pady=(0, 20))
    
    preview_text = ctk.CTkLabel(
        preview_frame, 
        text="The report preview will appear here when a report is generated.",
        wraplength=600
    )
    preview_text.pack(pady=50)
    
    return {
        'report_dropdown': report_dropdown,
        'export_pdf': export_pdf,
        'export_csv': export_csv,
        'preview_frame': preview_frame
    }