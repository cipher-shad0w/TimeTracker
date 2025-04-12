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
        date_str = row.Start_Date.strftime('%d.%m.%Y') if hasattr(row, 'Start_Date') else ""
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


def setup_team_tab(tab, data_manager, filtered_data=None):
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
    
    # Get unique team members from the filtered data
    team_members = sorted(filtered_data['Teammitglied'].unique())
    
    if len(team_members) == 0:
        no_data_label = ctk.CTkLabel(
            team_container,
            text="No team members found with current filter settings.",
            font=("Arial", 14)
        )
        no_data_label.pack(pady=50)
        return
    
    # Create scrollable frame for team members
    team_scroll_frame = ctk.CTkScrollableFrame(team_container)
    team_scroll_frame.pack(fill="both", expand=True, padx=10, pady=10)
    
    # Store toggle state for each member
    toggle_states = {}
    
    # For each team member, create a section with their entries
    for i, member in enumerate(team_members):
        # Create a frame for this member
        member_frame = ctk.CTkFrame(team_scroll_frame)
        member_frame.pack(fill="x", expand=True, padx=5, pady=10, anchor="n")
        
        # Get entries for this member
        member_data = filtered_data[filtered_data['Teammitglied'] == member]
        
        # Summary statistics for this member
        total_hours = member_data['Hours'].sum()
        total_entries = len(member_data)
        
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
        stats_summary = ctk.CTkLabel(
            header_frame,
            text=f"Total Hours: {total_hours:.2f}   |   Entries: {total_entries}",
            font=("Arial", 12),
            text_color="white"
        )
        stats_summary.pack(side="right", padx=10, pady=5)
        
        # Create a container for the collapsible content
        content_container = ctk.CTkFrame(member_frame)
        content_container.pack(fill="x", padx=10, pady=5)
        
        # Function to toggle visibility of the entries
        def toggle_entries(container=content_container, member_name=member):
            if toggle_states.get(member_name, True):
                container.pack_forget()
                toggle_states[member_name] = False
            else:
                container.pack(fill="x", padx=10, pady=5)
                toggle_states[member_name] = True
        
        # Bind click event to header
        member_header.bind("<Button-1>", lambda e, toggle_func=toggle_entries: toggle_func())
        stats_summary.bind("<Button-1>", lambda e, toggle_func=toggle_entries: toggle_func())
        header_frame.bind("<Button-1>", lambda e, toggle_func=toggle_entries: toggle_func())
        
        # Initially set to expanded
        toggle_states[member] = True
        
        # Create a table for the entries
        entries_frame = ctk.CTkFrame(content_container)
        entries_frame.pack(fill="x", pady=5)
        
        # Table headers
        headers = ["Date", "Customer", "Project", "Order", "Duration", "Invoiced"]
        col_widths = [100, 200, 150, 100, 100, 80]
        
        for j, header in enumerate(headers):
            header_label = ctk.CTkLabel(
                entries_frame,
                text=header,
                font=("Arial", 12, "bold"),
                width=col_widths[j]
            )
            header_label.grid(row=0, column=j, padx=5, pady=5, sticky="w")
        
        # Add a horizontal separator
        separator = ctk.CTkFrame(entries_frame, height=1, fg_color="gray")
        separator.grid(row=1, column=0, columnspan=len(headers), sticky="ew", padx=5, pady=2)
        
        # Sort entries by date
        member_data_sorted = member_data.sort_values('Start Date', ascending=False)
        
        # Show entries (limited to 10 per member to avoid UI overload)
        max_entries = min(10, len(member_data_sorted))
        for k, row in enumerate(member_data_sorted.head(max_entries).itertuples(), 2):
            # Date
            date_str = row.Start_Date.strftime('%d.%m.%Y') if hasattr(row, 'Start_Date') else ""
            if date_str == "":
                date_str = row._5.strftime('%d.%m.%Y') if hasattr(row, '_5') else "" # Using the index if column name is different
            
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
            
            # Order
            ctk.CTkLabel(
                entries_frame,
                text=row.Auftrag,
                width=col_widths[3]
            ).grid(row=k, column=3, padx=5, pady=2, sticky="w")
            
            # Duration
            ctk.CTkLabel(
                entries_frame,
                text=row.Dauer,
                width=col_widths[4]
            ).grid(row=k, column=4, padx=5, pady=2, sticky="w")
            
            # Invoiced
            invoiced_text = "Yes" if row.Abgerechnet else "No"
            invoiced_color = "#4CAF50" if row.Abgerechnet else "#F44336"
            
            ctk.CTkLabel(
                entries_frame,
                text=invoiced_text,
                text_color=invoiced_color,
                width=col_widths[5],
                font=("Arial", 12, "bold")
            ).grid(row=k, column=5, padx=5, pady=2, sticky="w")
        
        # If there are more entries than shown
        if len(member_data_sorted) > max_entries:
            more_label = ctk.CTkLabel(
                entries_frame,
                text=f"... and {len(member_data_sorted) - max_entries} more entries",
                font=("Arial", 10, "italic")
            )
            more_label.grid(row=max_entries+2, column=0, columnspan=len(headers), padx=5, pady=(5, 10), sticky="w")
    
    return team_scroll_frame