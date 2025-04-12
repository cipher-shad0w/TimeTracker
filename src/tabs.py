import customtkinter as ctk
import re
# Change relative import to absolute import
from src.charts import create_customer_pie_chart, create_daily_line_chart, create_project_bar_chart


def format_date_string(row):
    """
    Helper function to extract and format date strings consistently across the application.
    Tries multiple approaches to find and format a date value.
    
    Args:
        row: A pandas DataFrame row (namedtuple)
        
    Returns:
        str: Formatted date string in dd.mm.yyyy format
    """
    date_str = ""
    
    # Try different ways to access the date
    try:
        # Direct access to End Date column from CSV format
        if isinstance(row._6, str):
            # If it's already in string format, use it directly
            date_str = row._6
        elif hasattr(row._6, 'strftime'):
            # If it's a datetime object, format it
            date_str = row._6.strftime('%d.%m.%Y')
    except:
        # Try to access through specific attribute names
        try:
            if hasattr(row, 'End_Date'):
                if isinstance(row.End_Date, str):
                    date_str = row.End_Date
                elif hasattr(row.End_Date, 'strftime'):
                    date_str = row.End_Date.strftime('%d.%m.%Y')
            elif hasattr(row, 'End Date'):
                if isinstance(getattr(row, 'End Date'), str):
                    date_str = getattr(row, 'End Date')
                elif hasattr(getattr(row, 'End Date'), 'strftime'):
                    date_str = getattr(row, 'End Date').strftime('%d.%m.%Y')
            elif hasattr(row, 'Start_Date'):
                if isinstance(row.Start_Date, str):
                    date_str = row.Start_Date
                elif hasattr(row.Start_Date, 'strftime'):
                    date_str = row.Start_Date.strftime('%d.%m.%Y')
        except:
            # Last resort: look for any string that looks like a date
            for attr in dir(row):
                if attr.startswith('_') and attr != '__class__':
                    val = getattr(row, attr)
                    if isinstance(val, str) and re.match(r'\d{2}\.\d{2}\.\d{4}', val):
                        date_str = val
                        break
                    elif hasattr(val, 'strftime'):
                        date_str = val.strftime('%d.%m.%Y')
                        break
    
    return date_str


def format_duration(duration):
    """
    Format duration string by removing seconds.
    
    Args:
        duration: Duration string in format like "2h 30m 00s"
        
    Returns:
        str: Formatted duration string like "2h 30m"
    """
    if duration and isinstance(duration, str):
        # Remove seconds counter (e.g. from "2h 30m 00s" to "2h 30m")
        return re.sub(r'\s\d+s$', '', duration)
    return duration


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
        date_str = format_date_string(row)
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


def setup_fibu_tab(tab):
    """
    Shows the Fibu (accounting) yearly sheet with financial accounting data
    organized by months and customers
    """
    import pandas as pd
    from src.data_manager import TimeDataManager
    import os
    
    # Container for the Fibu section
    fibu_container = ctk.CTkFrame(tab)
    fibu_container.pack(padx=20, pady=20, fill="both", expand=True)
    
    # Create a title for the tab
    title_label = ctk.CTkLabel(
        fibu_container, text="Finanzbuchhaltung Jahresübersicht", font=("Arial", 18, "bold")
    )
    title_label.pack(pady=(10, 20))
    
    # Control frame for year selection and filters
    control_frame = ctk.CTkFrame(fibu_container)
    control_frame.pack(fill="x", padx=10, pady=10)
    
    # Year selection
    year_label = ctk.CTkLabel(control_frame, text="Jahr auswählen:", font=("Arial", 14))
    year_label.grid(row=0, column=0, padx=10, pady=10, sticky="w")
    
    # Get current year as default
    import datetime
    current_year = datetime.datetime.now().year
    years = [str(year) for year in range(current_year-5, current_year+1)]
    
    year_var = ctk.StringVar(value=str(current_year))
    year_dropdown = ctk.CTkOptionMenu(
        control_frame,
        values=years,
        variable=year_var,
        command=lambda selected_year: refresh_fibu_data(selected_year, customer_var.get())
    )
    year_dropdown.grid(row=0, column=1, padx=10, pady=10, sticky="w")
    
    # Customer filter
    customer_label = ctk.CTkLabel(control_frame, text="Kunde filtern:", font=("Arial", 14))
    customer_label.grid(row=0, column=2, padx=(20, 10), pady=10, sticky="w")
    
    # Get data manager instance to fetch customers
    csv_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "time.csv")
    data_manager = TimeDataManager(csv_path)
    
    # Create customer dropdown with "All Customers" option
    customers = ["Alle Kunden"] + sorted(data_manager.customers)
    customer_var = ctk.StringVar(value="Alle Kunden")
    customer_dropdown = ctk.CTkOptionMenu(
        control_frame,
        values=customers,
        variable=customer_var,
        command=lambda selected_customer: refresh_fibu_data(year_var.get(), selected_customer)
    )
    customer_dropdown.grid(row=0, column=3, padx=10, pady=10, sticky="w")
    
    # Additional button frame for exporting data
    button_frame = ctk.CTkFrame(control_frame, fg_color="transparent")
    button_frame.grid(row=0, column=4, padx=(30, 10), pady=10, sticky="e")
    
    export_button = ctk.CTkButton(
        button_frame, 
        text="Exportieren als CSV",
        command=lambda: export_fibu_data(year_var.get(), customer_var.get())
    )
    export_button.pack(side="right", padx=10)
    
    # Create the main data container with scrolling capability
    data_scroll_frame = ctk.CTkScrollableFrame(fibu_container)
    data_scroll_frame.pack(fill="both", expand=True, padx=10, pady=10)
    
    # Status label for data operations
    status_label = ctk.CTkLabel(
        fibu_container,
        text="",
        font=("Arial", 12),
        text_color="#4CAF50"  # Green color for status
    )
    status_label.pack(pady=(5, 10), fill="x")
    
    # Main data table
    data_table_frame = ctk.CTkFrame(data_scroll_frame)
    data_table_frame.pack(fill="both", expand=True)
    
    # Function to update the data table
    def update_data_table(fibu_data):
        # Clear existing widgets in the table
        for widget in data_table_frame.winfo_children():
            widget.destroy()
            
        if fibu_data is None or fibu_data.empty:
            no_data_label = ctk.CTkLabel(
                data_table_frame,
                text="Keine Daten für die ausgewählten Filter verfügbar.",
                font=("Arial", 14)
            )
            no_data_label.pack(pady=50)
            return
            
        # Define columns: Month, Customer, Hours, Amount, etc.
        col_names = ["Monat", "Kunde", "Projekt", "Aufgaben", "Stunden", "Abgerechnet", "FiBu-Status"]
        col_widths = [80, 180, 150, 180, 80, 100, 100]
        
        # Create header row
        for col_idx, (col_name, col_width) in enumerate(zip(col_names, col_widths)):
            header = ctk.CTkLabel(
                data_table_frame,
                text=col_name,
                font=("Arial", 12, "bold"),
                width=col_width
            )
            header.grid(row=0, column=col_idx, padx=5, pady=5, sticky="w")
        
        # Add separator
        separator = ctk.CTkFrame(data_table_frame, height=1, fg_color="gray")
        separator.grid(row=1, column=0, columnspan=len(col_names), sticky="ew", padx=5, pady=2)
        
        # Create data rows
        month_names = [
            "Januar", "Februar", "März", "April", "Mai", "Juni",
            "Juli", "August", "September", "Oktober", "November", "Dezember"
        ]
        
        # Group data by month and customer
        if 'Month' in fibu_data.columns:
            # Group by month and customer
            grouped_data = fibu_data.groupby(['Month', 'Kunden', 'Projekte']).agg({
                'Notiz': lambda x: '; '.join(set(filter(lambda y: isinstance(y, str), x)))[:50],
                'Hours': 'sum',
                'Abgerechnet': lambda x: 'Ja' if all(x) else 'Teilweise' if any(x) else 'Nein'
            }).reset_index()
            
            # Sort by month and customer
            grouped_data = grouped_data.sort_values(['Month', 'Kunden'])
            
            # Create rows
            for idx, (_, row) in enumerate(grouped_data.iterrows(), start=2):
                # Month name
                month_name = month_names[row['Month']-1] if 1 <= row['Month'] <= 12 else str(row['Month'])
                
                month_label = ctk.CTkLabel(
                    data_table_frame,
                    text=month_name,
                    width=col_widths[0]
                )
                month_label.grid(row=idx, column=0, padx=5, pady=2, sticky="w")
                
                # Customer
                customer_label = ctk.CTkLabel(
                    data_table_frame,
                    text=row['Kunden'],
                    width=col_widths[1]
                )
                customer_label.grid(row=idx, column=1, padx=5, pady=2, sticky="w")
                
                # Project type
                project_label = ctk.CTkLabel(
                    data_table_frame,
                    text=row['Projekte'],
                    width=col_widths[2]
                )
                project_label.grid(row=idx, column=2, padx=5, pady=2, sticky="w")
                
                # Tasks (from notes)
                tasks_text = row['Notiz']
                if tasks_text and len(tasks_text) > 30:
                    tasks_text = tasks_text[:27] + "..."
                    
                tasks_label = ctk.CTkLabel(
                    data_table_frame,
                    text=tasks_text if tasks_text else "-",
                    width=col_widths[3]
                )
                tasks_label.grid(row=idx, column=3, padx=5, pady=2, sticky="w")
                
                # Hours
                hours_label = ctk.CTkLabel(
                    data_table_frame,
                    text=f"{row['Hours']:.2f}",
                    width=col_widths[4]
                )
                hours_label.grid(row=idx, column=4, padx=5, pady=2, sticky="w")
                
                # Invoiced status
                invoice_status = row['Abgerechnet']
                invoice_color = "#4CAF50" if invoice_status == 'Ja' else "#FFC107" if invoice_status == 'Teilweise' else "#F44336"
                
                invoice_label = ctk.CTkLabel(
                    data_table_frame,
                    text=invoice_status,
                    text_color=invoice_color,
                    font=("Arial", 12, "bold"),
                    width=col_widths[5]
                )
                invoice_label.grid(row=idx, column=5, padx=5, pady=2, sticky="w")
                
                # FIBU status - Here just placeholder
                fibu_status = "Verbucht" if row['Abgerechnet'] == 'Ja' else "Offen"
                fibu_color = "#4CAF50" if fibu_status == "Verbucht" else "#F44336"
                
                fibu_label = ctk.CTkLabel(
                    data_table_frame,
                    text=fibu_status,
                    text_color=fibu_color,
                    font=("Arial", 12, "bold"),
                    width=col_widths[6]
                )
                fibu_label.grid(row=idx, column=6, padx=5, pady=2, sticky="w")
            
            # Add summary row at the bottom
            summary_row = len(grouped_data) + 2
            
            # Add separator before summary
            separator = ctk.CTkFrame(data_table_frame, height=1, fg_color="gray")
            separator.grid(row=summary_row, column=0, columnspan=len(col_names), sticky="ew", padx=5, pady=2)
            
            # Total label
            total_label = ctk.CTkLabel(
                data_table_frame,
                text="Gesamt:",
                font=("Arial", 12, "bold"),
                width=col_widths[0]
            )
            total_label.grid(row=summary_row+1, column=0, padx=5, pady=5, sticky="w")
            
            # Total hours
            total_hours = fibu_data['Hours'].sum()
            total_hours_label = ctk.CTkLabel(
                data_table_frame,
                text=f"{total_hours:.2f}",
                font=("Arial", 12, "bold"),
                width=col_widths[4]
            )
            total_hours_label.grid(row=summary_row+1, column=4, padx=5, pady=5, sticky="w")
            
            # Total invoiced percentage
            invoiced_hours = fibu_data[fibu_data['Abgerechnet'] == True]['Hours'].sum()
            percentage = (invoiced_hours / total_hours * 100) if total_hours > 0 else 0
            
            total_invoiced_label = ctk.CTkLabel(
                data_table_frame,
                text=f"{percentage:.1f}% abgerechnet",
                font=("Arial", 12, "bold"),
                width=col_widths[5]
            )
            total_invoiced_label.grid(row=summary_row+1, column=5, padx=5, pady=5, sticky="w")
            
        else:
            no_data_label = ctk.CTkLabel(
                data_table_frame,
                text="Die Daten enthalten keine Monatsinformationen.",
                font=("Arial", 14)
            )
            no_data_label.pack(pady=50)
    
    # Function to refresh the data based on selections
    def refresh_fibu_data(year, customer):
        try:
            # Update status
            status_label.configure(text="Daten werden geladen...", text_color="#FFC107")
            tab.update()  # Force UI update
            
            # Filter data by year
            year_int = int(year)
            year_data = data_manager.filter_by_year(year_int)
            
            # Filter by customer if not "All Customers"
            if customer != "Alle Kunden":
                year_data = year_data[year_data['Kunden'] == customer]
            
            # Show only entries of type "Finanzbuchhaltung"
            fibu_data = year_data[year_data['Projekte'] == "Finanzbuchhaltung"]
            
            # Update the table with filtered data
            update_data_table(fibu_data)
            
            # Update status
            entry_count = len(fibu_data) if fibu_data is not None else 0
            status_label.configure(
                text=f"Daten geladen: {entry_count} Einträge gefunden für {year}", 
                text_color="#4CAF50"
            )
            
        except Exception as e:
            status_label.configure(
                text=f"Fehler beim Laden der Daten: {str(e)}", 
                text_color="#F44336"
            )
    
    # Function to export data to CSV
    def export_fibu_data(year, customer):
        try:
            # Filter data by year
            year_int = int(year)
            year_data = data_manager.filter_by_year(year_int)
            
            # Filter by customer if not "All Customers"
            if customer != "Alle Kunden":
                year_data = year_data[year_data['Kunden'] == customer]
            
            # Show only entries of type "Finanzbuchhaltung"
            fibu_data = year_data[year_data['Projekte'] == "Finanzbuchhaltung"]
            
            if fibu_data is None or fibu_data.empty:
                status_label.configure(
                    text="Keine Daten zum Exportieren vorhanden.", 
                    text_color="#F44336"
                )
                return
            
            # Create export filename
            customer_suffix = customer.replace(" ", "_") if customer != "Alle Kunden" else "Alle_Kunden"
            export_filename = f"Fibu_{year}_{customer_suffix}.csv"
            export_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", export_filename)
            
            # Export the data
            fibu_data.to_csv(export_path, index=False)
            
            status_label.configure(
                text=f"Daten exportiert nach: {export_filename}", 
                text_color="#4CAF50"
            )
            
        except Exception as e:
            status_label.configure(
                text=f"Fehler beim Exportieren der Daten: {str(e)}", 
                text_color="#F44336"
            )
    
    # Initial data load
    refresh_fibu_data(year_var.get(), customer_var.get())
    
    return fibu_container


def setup_team_tab(tab, data_manager, filtered_data=None, show_initial_data=False):
    """Shows the team members and their time entries with applied filters"""
    if filtered_data is None:
        filtered_data = data_manager.data
    
    # Container for the team members section
    team_container = ctk.CTkFrame(tab)
    team_container.pack(padx=20, pady=20, fill="both", expand=True)
    
    # Create a title for the tab
    title_label = ctk.CTkLabel(
        team_container, text="Team Members Time Entries", font=("Arial", 18, "bold")
    )
    title_label.pack(pady=(10, 20))
    
    # Limitiere Datenmenge für bessere Performance
    max_entries_per_member = 100  # Eine vernünftige Grenze
    
    # Get unique team members from the filtered data
    team_members = sorted(filtered_data['Teammitglied'].unique())
    
    if len(team_members) == 0:
        no_data_label = ctk.CTkLabel(
            team_container,
            text="No team members found with current filter settings.",
            font=("Arial", 14)
        )
        no_data_label.pack(pady=50)
        return team_container
    
    # Create scrollable frame for team members to improve performance
    team_scroll_frame = ctk.CTkScrollableFrame(team_container)
    team_scroll_frame.pack(fill="both", expand=True, padx=10, pady=10)
    
    # Create frame for team members within the scrollable frame
    team_frame = ctk.CTkFrame(team_scroll_frame, fg_color="transparent")
    team_frame.pack(fill="both", expand=True)
    
    # Store toggle state for each member
    toggle_states = {}
    
    # Store sort direction for each column of each team member
    # Dictionary structure: {member_name: {"column_name": True/False}}
    # True = ascending, False = descending
    sort_directions = {}
    
    # For each team member, create a section with their entries
    for i, member in enumerate(team_members):
        # Create a frame for this member
        member_frame = ctk.CTkFrame(team_frame)
        member_frame.pack(fill="x", expand=True, padx=5, pady=10, anchor="n")
        
        # Get entries for this member - limit to improve performance
        member_data = filtered_data[filtered_data['Teammitglied'] == member].head(max_entries_per_member)
        
        # Summary statistics for this member
        total_hours = member_data['Hours'].sum()
        total_entries = len(member_data)
        total_entries_all = len(filtered_data[filtered_data['Teammitglied'] == member])
        
        # Create a frame for the collapsible header
        header_frame = ctk.CTkFrame(member_frame, fg_color="#3a7ebf", corner_radius=8)
        header_frame.pack(fill="x", padx=5, pady=5)
        
        # Add member name as clickable header
        member_header = ctk.CTkLabel(
            header_frame,
            text=f"Team Member: {member}",
            font=("Arial", 16, "bold"),
            text_color="white",
            cursor="hand2"  # Change cursor to hand when hovering
        )
        member_header.pack(side="left", fill="x", padx=10, pady=5, expand=True)
        
        # Add statistics summary next to the name
        entries_msg = f"Total Hours: {total_hours:.2f}   |   Entries: {total_entries}"
        if total_entries_all > max_entries_per_member:
            entries_msg += f" (showing {max_entries_per_member} of {total_entries_all})"
            
        stats_summary = ctk.CTkLabel(
            header_frame,
            text=entries_msg,
            font=("Arial", 12),
            text_color="white"
        )
        stats_summary.pack(side="right", padx=10, pady=5)
        
        # Create a container for the collapsible content
        content_container = ctk.CTkFrame(member_frame)
        
        # Initially hide content to improve initial rendering performance unless show_initial_data is True
        toggle_states[member] = show_initial_data
        if show_initial_data:
            content_container.pack(fill="x", padx=10, pady=5)
        
        # Function to toggle visibility of the entries
        def toggle_entries(container=content_container, member_name=member):
            if toggle_states.get(member_name, False):
                container.pack_forget()
                toggle_states[member_name] = False
            else:
                container.pack(fill="x", padx=10, pady=5)
                toggle_states[member_name] = True
        
        # Bind click event to header
        member_header.bind("<Button-1>", lambda e, toggle_func=toggle_entries: toggle_func())
        stats_summary.bind("<Button-1>", lambda e, toggle_func=toggle_entries: toggle_func())
        header_frame.bind("<Button-1>", lambda e, toggle_func=toggle_entries: toggle_func())
        
        # Initialize sort direction for each column
        sort_directions[member] = {
            "Date": True,  # Ascending
            "Customer": True,
            "Project": True,
            "Duration": True,
            "Invoiced": True
        }
        
        # Create a scrollable frame for the entries
        entries_scroll_frame = ctk.CTkScrollableFrame(content_container, height=300)
        entries_scroll_frame.pack(fill="x", pady=5)
        
        # Create a table for the entries within the scrollable frame
        entries_frame = ctk.CTkFrame(entries_scroll_frame)
        entries_frame.pack(fill="x", pady=5)
        
        # Table headers - removed "Order" column
        headers = ["Date", "Customer", "Project", "Duration", "Invoiced"]
        col_widths = [100, 200, 150, 100, 80]
        
        # Converts column names to DataFrame column names
        column_map = {
            "Date": "End Date",
            "Customer": "Kunden",
            "Project": "Projekte",
            "Duration": "Dauer",
            "Invoiced": "Abgerechnet"
        }
        
        # Function to reload the table with sorted data - optimized version
        def reload_table(entries_frame, member_data, sort_column, member_name=member):
            # Reverse sort direction
            sort_directions[member_name][sort_column] = not sort_directions[member_name][sort_column]
            ascending = sort_directions[member_name][sort_column]
            
            # Determine DataFrame column for sorting
            df_column = column_map.get(sort_column)
            
            # Sort the data
            if df_column:
                sorted_data = member_data.sort_values(df_column, ascending=ascending)
            else:
                # Fallback if column not found in mapping
                sorted_data = member_data
            
            # Delete all old entries (from row 2 onwards, to keep header and separator)
            for widget in entries_frame.winfo_children():
                if widget.grid_info().get('row', 0) >= 2:
                    widget.destroy()
            
            # Display new sorted entries - limited to improve performance
            for k, row in enumerate(sorted_data.head(max_entries_per_member).itertuples(), 2):
                # Date - Fix to show End Date correctly in dd.mm.yyyy format without time
                date_str = format_date_string(row)
                
                ctk.CTkLabel(
                    entries_frame,
                    text=date_str,
                    width=col_widths[0]
                ).grid(row=k, column=0, padx=5, pady=2, sticky="w")
                
                # Customer
                ctk.CTkLabel(
                    entries_frame,
                    text=row.Kunden,
                    width=col_widths[1]
                ).grid(row=k, column=1, padx=5, pady=2, sticky="w")
                
                # Project Type
                ctk.CTkLabel(
                    entries_frame,
                    text=row.Projekte,
                    width=col_widths[2]
                ).grid(row=k, column=2, padx=5, pady=2, sticky="w")
                
                # Duration - Remove seconds
                duration = format_duration(row.Dauer if hasattr(row, 'Dauer') else "")
                
                ctk.CTkLabel(
                    entries_frame,
                    text=duration,
                    width=col_widths[3]
                ).grid(row=k, column=3, padx=5, pady=2, sticky="w")
                
                # Invoiced
                invoiced_text = "Yes" if row.Abgerechnet else "No"
                invoiced_color = "#4CAF50" if row.Abgerechnet else "#F44336"
                
                ctk.CTkLabel(
                    entries_frame,
                    text=invoiced_text,
                    text_color=invoiced_color,
                    width=col_widths[4],
                    font=("Arial", 12, "bold")
                ).grid(row=k, column=4, padx=5, pady=2, sticky="w")
        
        # Create header labels with click functionality
        for j, header in enumerate(headers):
            header_label = ctk.CTkLabel(
                entries_frame,
                text=header,
                font=("Arial", 12, "bold"),
                width=col_widths[j],
                cursor="hand2"  # Hand cursor for clickability
            )
            header_label.grid(row=0, column=j, padx=5, pady=5, sticky="w")
            
            # Add sort direction indicator (arrow)
            sort_indicator = ctk.CTkLabel(
                entries_frame,
                text="▲",  # Up arrow
                font=("Arial", 10),
                width=10
            )
            sort_indicator.grid(row=0, column=j, padx=(col_widths[j]-15, 0), pady=5, sticky="e")
            sort_indicator.grid_remove()  # Hide initially
            
            # Click event for sorting
            header_label.bind("<Button-1>", lambda e, col=header, ef=entries_frame, md=member_data, si=sort_indicator: 
                            (reload_table(ef, md, col), 
                             # Update sort indicator for all headers
                             update_sort_indicators(ef, col)))
            
            # Save the indicator widget for later updates
            header_label.sort_indicator = sort_indicator
            header_label.column_name = header
        
        # Function to update sort direction indicators
        def update_sort_indicators(frame, active_column):
            # Remove all previous indicators
            for widget in frame.winfo_children():
                if isinstance(widget, ctk.CTkLabel) and hasattr(widget, 'column_name'):
                    if hasattr(widget, 'sort_indicator'):
                        widget.sort_indicator.grid_remove()
            
            # Show indicator for active column
            for widget in frame.winfo_children():
                if isinstance(widget, ctk.CTkLabel) and hasattr(widget, 'column_name'):
                    if widget.column_name == active_column and hasattr(widget, 'sort_indicator'):
                        widget.sort_indicator.configure(text="▲" if sort_directions[member][active_column] else "▼")
                        widget.sort_indicator.grid()
        
        # Add a horizontal separator
        separator = ctk.CTkFrame(entries_frame, height=1, fg_color="gray")
        separator.grid(row=1, column=0, columnspan=len(headers), sticky="ew", padx=5, pady=2)
        
        # Sort entries by date (initial sort) - limited for performance
        member_data_sorted = member_data.sort_values('End Date', ascending=False).head(max_entries_per_member)
        
        # Show entries for the member
        for k, row in enumerate(member_data_sorted.itertuples(), 2):
            # Date - Fix to show End Date correctly in dd.mm.yyyy format without time
            date_str = format_date_string(row)
            
            ctk.CTkLabel(
                entries_frame,
                text=date_str,
                width=col_widths[0]
            ).grid(row=k, column=0, padx=5, pady=2, sticky="w")
            
            # Customer
            ctk.CTkLabel(
                entries_frame,
                text=row.Kunden,
                width=col_widths[1]
            ).grid(row=k, column=1, padx=5, pady=2, sticky="w")
            
            # Project Type
            ctk.CTkLabel(
                entries_frame,
                text=row.Projekte,
                width=col_widths[2]
            ).grid(row=k, column=2, padx=5, pady=2, sticky="w")
            
            # Duration - Remove seconds
            duration = format_duration(row.Dauer if hasattr(row, 'Dauer') else "")
            
            ctk.CTkLabel(
                entries_frame,
                text=duration,
                width=col_widths[3]
            ).grid(row=k, column=3, padx=5, pady=2, sticky="w")
            
            # Invoiced
            invoiced_text = "Yes" if row.Abgerechnet else "No"
            invoiced_color = "#4CAF50" if row.Abgerechnet else "#F44336"
            
            ctk.CTkLabel(
                entries_frame,
                text=invoiced_text,
                text_color=invoiced_color,
                width=col_widths[4],
                font=("Arial", 12, "bold")
            ).grid(row=k, column=4, padx=5, pady=2, sticky="w")
        
    # Wenn show_initial_data aktiviert ist, öffne automatisch die erste Sektion
    if show_initial_data and team_members:
        # Wähle den ersten Teammember aus und zeige dessen Daten an
        first_member = team_members[0]
        toggle_states[first_member] = True
    
    return team_container