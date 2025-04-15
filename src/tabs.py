import customtkinter as ctk
import re

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

def setup_main_tab(tab, data_manager):
    """Shows the Jahresabschluss (annual financial summary)"""

    # Create a main container frame
    main_container = ctk.CTkFrame(tab)
    main_container.pack(padx=20, pady=20, fill="both", expand=True)

    # Create a title for the tab
    title_label = ctk.CTkLabel(
        main_container, text="Jahresabschluss", font=("Arial", 18, "bold")
    )
    title_label.pack(pady=(10, 20))

    # Create a frame for the financial data
    financial_frame = ctk.CTkFrame(main_container)
    financial_frame.pack(padx=10, pady=10, fill="both", expand=True)

    # Calculate total hours from data
    total_hours = data_manager.data['Hours'].sum() if 'Hours' in data_manager.data.columns else 0

    # Variables to store input values
    total_income_var = ctk.StringVar()
    previous_rate_var = ctk.StringVar(value="0.0")
    comparison_rate_var = ctk.StringVar()

    # Function to recalculate dependent values
    def update_calculations(*args):
        try:
            # Get input values
            total_income = float(total_income_var.get().replace('.', ',') or 0)
            comparison_rate = float(comparison_rate_var.get().replace('.', ',') or 0)

            # Calculate average hourly rate
            avg_hourly_rate = total_income / total_hours if total_hours > 0 else 0
            avg_hourly_rate_label.configure(text=f"{avg_hourly_rate:.2f} €/h")

            # Calculate comparison value (hourly rate * total hours)
            comparison_value = comparison_rate * total_hours
            comparison_value_label.configure(text=f"{comparison_value:.2f} €")

            # Calculate over/under amount
            diff_amount = total_income - comparison_value
            diff_amount_label.configure(
                text=f"{diff_amount:.2f} €",
                text_color="#4CAF50" if diff_amount >= 0 else "#F44336"
            )
        except (ValueError, ZeroDivisionError):
            # Handle invalid input
            pass

    # Create rows for each data point with appropriate layout
    row = 0
    pad_y = (10, 5)

    # 1. Label: Honorar fakultiert :: Input: Gesamte Abrechnung des Jahres
    ctk.CTkLabel(
        financial_frame, text="Honorar fakultiert:", font=("Arial", 14, "bold")
    ).grid(row=row, column=0, padx=(10, 5), pady=pad_y, sticky="w")

    income_entry = ctk.CTkEntry(financial_frame, width=150, textvariable=total_income_var)
    income_entry.grid(row=row, column=1, padx=(5, 10), pady=pad_y, sticky="e")
    income_entry.bind("<KeyRelease>", update_calculations)
    row += 1

    # 2. Label: Stunden Abgerechnet :: Input: €
    ctk.CTkLabel(
        financial_frame, text="Stunden Abgerechnet:", font=("Arial", 14, "bold")
    ).grid(row=row, column=0, padx=(10, 5), pady=pad_y, sticky="w")

    hours_label = ctk.CTkEntry(
        financial_frame
    )
    hours_label.grid(row=row, column=1, padx=(5, 10), pady=pad_y, sticky="e")
    hours_label.bind("<KeyRelease>", update_calculations)
    row += 1

    # 3. Label: Durchschnittlicher Stundenlohn :: Label: Gesamter Betrag (1.) / echte Zeit
    ctk.CTkLabel(
        financial_frame, text="Durchschnittlicher Stundenlohn:", font=("Arial", 14, "bold")
    ).grid(row=row, column=0, padx=(10, 5), pady=pad_y, sticky="w")

    avg_hourly_rate_label = ctk.CTkLabel(
        financial_frame, text="0,00 €/h", font=("Arial", 14)
    )
    avg_hourly_rate_label.grid(row=row, column=1, padx=(5, 10), pady=pad_y, sticky="e")
    row += 1

    # 4. Label: Stundenlohn im Vorjahr :: Label: €
    ctk.CTkLabel(
        financial_frame, text="Stundenlohn im Vorjahr:", font=("Arial", 14, "bold")
    ).grid(row=row, column=0, padx=(10, 5), pady=pad_y, sticky="w")

    # Automatically calculate the previous rate if data is available
    if 'Previous_Rate' in data_manager.data.columns and not data_manager.data['Previous_Rate'].empty:
        previous_rate = data_manager.data['Previous_Rate'].iloc[0]
        previous_rate_var.set(f"{previous_rate:.2f}")
        previous_rate_entry = ctk.CTkLabel(financial_frame, width=150, textvariable=previous_rate_var)
    else:
        previous_rate_entry = ctk.CTkLabel(financial_frame, width=150, text="N/A")
    previous_rate_entry.grid(row=row, column=1, padx=(5, 10), pady=pad_y, sticky="e")
    row += 1

    # 5. Label: Zeiten :: Label: alle Stunden zusammenaddiert
    ctk.CTkLabel(
        financial_frame, text="Zeiten:", font=("Arial", 14, "bold")
    ).grid(row=row, column=0, padx=(10, 5), pady=pad_y, sticky="w")

    total_hours_label = ctk.CTkLabel(
        financial_frame, text=f"{total_hours:.2f} h", font=("Arial", 14)
    )
    total_hours_label.grid(row=row, column=1, padx=(5, 10), pady=pad_y, sticky="e")
    row += 1

    # 6. Input: Stundenlohn zum Vergleichen :: Label: Stundenlohn zum vergleichen * 5.
    ctk.CTkLabel(
        financial_frame, text="Stundenlohn zum Vergleichen:", font=("Arial", 14, "bold")
    ).grid(row=row, column=0, padx=(10, 5), pady=pad_y, sticky="w")

    comparison_frame = ctk.CTkFrame(financial_frame, fg_color="transparent")
    comparison_frame.grid(row=row, column=1, padx=(5, 10), pady=pad_y, sticky="e")

    comparison_rate_entry = ctk.CTkEntry(comparison_frame, width=80, textvariable=comparison_rate_var)
    comparison_rate_entry.pack(side="left", padx=(0, 5))
    comparison_rate_entry.bind("<KeyRelease>", update_calculations)

    ctk.CTkLabel(comparison_frame, text="€/h →", font=("Arial", 12)).pack(side="left", padx=(0, 5))

    comparison_value_label = ctk.CTkLabel(comparison_frame, text="0.00 €", font=("Arial", 14))
    comparison_value_label.pack(side="left")
    row += 1

    # 7. Label: Über/Unterdeckung :: Label: 1. minus 6.
    ctk.CTkLabel(
        financial_frame, text="Über/Unterdeckung:", font=("Arial", 14, "bold")
    ).grid(row=row, column=0, padx=(10, 5), pady=pad_y, sticky="w")

    diff_amount_label = ctk.CTkLabel(
        financial_frame, text="0.00 €", font=("Arial", 14, "bold")
    )
    diff_amount_label.grid(row=row, column=1, padx=(5, 10), pady=pad_y, sticky="e")

    # Add some spacing at the bottom
    ctk.CTkLabel(financial_frame, text="").grid(row=row+1, column=0, columnspan=2, pady=(20, 0))

    return main_container

def setup_fibu_tab(tab, data_manager):
    """Show """


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
