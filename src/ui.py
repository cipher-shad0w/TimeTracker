import customtkinter as ctk
import os
import re
from src.data_manager import TimeDataManager
from src.tabs import setup_team_tab, setup_fibu_tab, setup_main_tab


class App(ctk.CTk):
    def __init__(self) -> None:
        super().__init__()
        ctk.set_default_color_theme("dark-blue")
        self.geometry("1500x1000")
        self.title("Time Tracker")
        
        # Initialize the TimeDataManager with the CSV data
        csv_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 
                               "data", "time.csv")
        self.data_manager = TimeDataManager(csv_path)
        
        # Initialize UI components
        self.chart_frames = None
        self.create_widgets()
        
        # Bind the Escape key to close the app
        self.bind("<Escape>", self.close_app)

    def create_widgets(self) -> None:
        # Create the main frames with different gray shades
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
        self.title_label.pack(pady=20)

        # Add customer selection with actual customer data
        self._setup_left_panel()

        # Create tabview in right frame
        self.create_tabview()

    def _setup_left_panel(self):
        """Creates the controls in the left panel for data filtering"""
 
        # Customers
        self.customers_label = ctk.CTkLabel(
            self.left_frame, text="Select Customer:", font=("Arial", 16)
        )
        self.customers_label.pack(pady=(20, 10))
        self.customers = ["All Customers"] + sorted(self.data_manager.customers)
        self.customer_optionmenu = ctk.CTkOptionMenu(
            self.left_frame,
            values=self.customers,
            command=self.on_customer_selection_change,
        )
        self.customer_optionmenu.pack(pady=(0, 20), padx=20)
        self.customer_optionmenu.set("All Customers")
        
        # Projects
        self.projects_label = ctk.CTkLabel(
            self.left_frame, text="Select Project:", font=("Arial", 16)
        )
        self.projects_label.pack(pady=(10, 10))
        self.projects = ["All Projects"] + sorted(self.data_manager.project_types)
        self.project_optionmenu = ctk.CTkOptionMenu(
            self.left_frame,
            values=self.projects,
            command=self.on_project_selection_change,
        )
        self.project_optionmenu.pack(pady=(0, 20), padx=20)
        self.project_optionmenu.set("All Projects")
        
        # Orders - Only show years
        self.orders_label = ctk.CTkLabel(
            self.left_frame, text="Select Order Year:", font=("Arial", 16)
        )
        self.orders_label.pack(pady=(10, 10))
        
        # Extract unique years from the "Auftrag" field
        order_years = self._extract_unique_order_years()
        self.orders = ["All Years"] + order_years
        
        self.order_optionmenu = ctk.CTkOptionMenu(
            self.left_frame,
            values=self.orders,
            command=self.on_order_selection_change,
        )
        self.order_optionmenu.pack(pady=(0, 20), padx=20)
        self.order_optionmenu.set("All Years")
        
        # Add spacer to push invoiced status to bottom
        spacer = ctk.CTkFrame(self.left_frame, fg_color="transparent")
        spacer.pack(pady=10, fill="both", expand=True)
        
        # Invoiced Status - at the bottom
        self.invoiced_label = ctk.CTkLabel(
            self.left_frame, text="Invoiced Status:", font=("Arial", 16)
        )
        self.invoiced_label.pack(pady=(10, 10))
        
        # Create a frame for the radio buttons
        self.invoiced_frame = ctk.CTkFrame(self.left_frame, fg_color="transparent")
        self.invoiced_frame.pack(pady=(0, 20), padx=20, fill="x")
        
        # Create a variable to store the invoiced status selection
        self.invoiced_var = ctk.StringVar(value="All")
        
        # Create radio buttons for invoiced status
        self.radio_all = ctk.CTkRadioButton(
            self.invoiced_frame, 
            text="All", 
            variable=self.invoiced_var, 
            value="All",
            command=self.on_invoiced_selection_change
        )
        self.radio_all.pack(anchor="w", pady=5)
        
        self.radio_invoiced = ctk.CTkRadioButton(
            self.invoiced_frame, 
            text="Invoiced", 
            variable=self.invoiced_var, 
            value="Invoiced",
            command=self.on_invoiced_selection_change
        )
        self.radio_invoiced.pack(anchor="w", pady=5)
        
        self.radio_not_invoiced = ctk.CTkRadioButton(
            self.invoiced_frame, 
            text="Not Invoiced", 
            variable=self.invoiced_var, 
            value="Not Invoiced",
            command=self.on_invoiced_selection_change
        )
        self.radio_not_invoiced.pack(anchor="w", pady=5)
        
    def _extract_unique_order_years(self):
        """Extract unique years from the Auftrag field"""
        years = set()
        for order in self.data_manager._get_unique_values('Auftrag'):
            if isinstance(order, str):
                # Check for years in format 20XX
                matches = re.findall(r'20\d{2}', order)
                for match in matches:
                    years.add(match)
        
        return sorted(list(years))
        
    def on_customer_selection_change(self, customer):
        """Handle customer selection change and update related dropdowns"""
        # Update project dropdown with projects related to this customer
        if customer != "All Customers":
            # Filter data by customer
            customer_data = self.data_manager.filter_by_customer(customer)
            
            # Get projects for this customer
            customer_projects = sorted(customer_data['Projekte'].unique().tolist())
            self.project_optionmenu.configure(values=["All Projects"] + customer_projects)
            self.project_optionmenu.set("All Projects")
            
            # Get order years for this customer
            customer_orders = customer_data['Auftrag'].tolist()
            order_years = set()
            for order in customer_orders:
                if isinstance(order, str):
                    matches = re.findall(r'20\d{2}', order)
                    for match in matches:
                        order_years.add(match)
            
            self.order_optionmenu.configure(values=["All Years"] + sorted(list(order_years)))
            self.order_optionmenu.set("All Years")
        else:
            # Reset to all projects and all order years
            self.project_optionmenu.configure(values=["All Projects"] + sorted(self.data_manager.project_types))
            self.project_optionmenu.set("All Projects")
            
            order_years = self._extract_unique_order_years()
            self.order_optionmenu.configure(values=["All Years"] + order_years)
            self.order_optionmenu.set("All Years")
        
        # Refresh data display
        self.refresh_data()
        
    def on_project_selection_change(self, project):
        """Handle project selection change and update related dropdowns"""
        selected_customer = self.customer_optionmenu.get()
        customer = None if selected_customer == "All Customers" else selected_customer
        
        # Filter by both customer (if selected) and project type
        filtered_data = self.data_manager.data
        if customer:
            filtered_data = self.data_manager.filter_by_customer(customer)
        
        if project != "All Projects":
            filtered_data = filtered_data[filtered_data['Projekte'] == project]
            
            # Update order years based on the filtered data
            order_years = set()
            for order in filtered_data['Auftrag'].tolist():
                if isinstance(order, str):
                    matches = re.findall(r'20\d{2}', order)
                    for match in matches:
                        order_years.add(match)
                        
            self.order_optionmenu.configure(values=["All Years"] + sorted(list(order_years)))
            self.order_optionmenu.set("All Years")
        else:
            # If "All Projects" is selected, reset order years based on customer selection
            if customer:
                customer_data = self.data_manager.filter_by_customer(customer)
                customer_orders = customer_data['Auftrag'].tolist()
                order_years = set()
                for order in customer_orders:
                    if isinstance(order, str):
                        matches = re.findall(r'20\d{2}', order)
                        for match in matches:
                            order_years.add(match)
                
                self.order_optionmenu.configure(values=["All Years"] + sorted(list(order_years)))
            else:
                # Reset to all order years
                order_years = self._extract_unique_order_years()
                self.order_optionmenu.configure(values=["All Years"] + order_years)
            
            self.order_optionmenu.set("All Years")
        
        # Refresh data display
        self.refresh_data()
        
    def on_order_selection_change(self, order_year):
        """Handle order year selection change"""
        # No need to update other dropdowns when order year changes
        # Just refresh the data display with the new filter
        self.refresh_data()
    
    def on_invoiced_selection_change(self):
        """Handle invoice status selection change"""
        # Refresh the data display with the new filter
        self.refresh_data()
    
    def set_customer(self, customer):
        """Sets the selected customer and refreshes the data"""
        self.refresh_data()

    def create_tabview(self):
        """Create and setup the tab view with multiple tabs"""
        # Add tabview to right frame
        self.tabview = ctk.CTkTabview(self.right_frame, fg_color="#616161")
        self.tabview.pack(padx=20, pady=20, fill="both", expand=True)

        # Create tabs
        self.main_tab = self.tabview.add("Jahresabschluss")
        self.fibu_tab = self.tabview.add("Fibu Jahresblatt")
        self.team_tab = self.tabview.add("Aufwand")
        
        # Set default tab
        self.tabview.set("Jahresabschluss")
        
        # Fill the tabs with content
        self.main_frame = setup_main_tab(self.main_tab, self.data_manager)
        self.fibu_frame = setup_fibu_tab(self.fibu_tab, self.data_manager)
        self.team_frame = setup_team_tab(self.team_tab, self.data_manager)
        
        # Add tab change event
        # self.tabview._segmented_button.configure(command=self.on_tab_change)
    
    def on_tab_change(self, tab_name):
        """Handle tab change event"""
        # If changing to the Team Members tab, make sure to update with filtered data
        if tab_name == "Team Members":
            # Get current filter settings and apply them
            self.refresh_data(force_update_team=True)
        # If changing to the Fibu tab, make sure to initialize/update its content
        elif tab_name == "Fibu Jahresblatt":
            self.refresh_fibu_data()

    def refresh_fibu_data(self):
        """Update Fibu tab with current year data"""
        try:
            # Skip if fibu_frame is not yet initialized
            if not hasattr(self, 'fibu_frame') or not self.fibu_frame:
                return
                
            # Remove old Fibu content
            for widget in self.fibu_tab.winfo_children():
                widget.destroy()
            
            # Re-initialize Fibu tab with new content
            self.fibu_frame = setup_fibu_tab(self.fibu_tab, self.data_manager)
        except Exception as e:
            print(f"Fehler beim Aktualisieren des Fibu-Tabs: {e}")
            
    def refresh_data(self, force_update_team=False):
        """
        Updates all charts and views with the currently selected filters.
        
        Args:
            force_update_team: If True, will force an update of the team tab even if not active
        """
        # Get the selected filter values
        selected_customer = self.customer_optionmenu.get()
        selected_project = self.project_optionmenu.get()
        selected_order_year = self.order_optionmenu.get()
        selected_invoiced = self.invoiced_var.get()
        
        # Convert to None if "All" is selected
        customer = None if selected_customer == "All Customers" else selected_customer
        project_type = None if selected_project == "All Projects" else selected_project
        
        # Initialize invoiced filter as None (all entries)
        invoiced_filter = None
        if selected_invoiced == "Invoiced":
            invoiced_filter = True
        elif selected_invoiced == "Not Invoiced":
            invoiced_filter = False
        
        # Start with the original unfiltered data
        filtered_data = self.data_manager.data.copy()
        
        # Apply filters step by step
        if customer:
            filtered_data = filtered_data[filtered_data['Kunden'] == customer]
        
        if project_type:
            filtered_data = filtered_data[filtered_data['Projekte'] == project_type]
            
        # Apply order year filter if not "All Years"
        if selected_order_year != "All Years":
            filtered_data = filtered_data[filtered_data['Auftrag'].str.contains(selected_order_year, na=False)]
        
        # Apply invoiced status filter
        if invoiced_filter is not None:
            filtered_data = filtered_data[filtered_data['Abgerechnet'] == invoiced_filter]
        
        # Compare filtered data with previous filtered data for logging
        if hasattr(self, 'current_filtered_data') and self.current_filtered_data is not None:
            if len(filtered_data) == len(self.current_filtered_data):
                print(f"Filters applied but number of records unchanged: {len(filtered_data)} entries.")
            else:
                print(f"Filters applied. Before: {len(self.current_filtered_data)} entries, after: {len(filtered_data)} entries.")
        else:
            print(f"Initial filtering complete: {len(filtered_data)} entries.")
                
        # Store the filtered data for later use
        self.current_filtered_data = filtered_data
        
        # Update the Team tab with the filtered data
        if self.tabview.get() == "Team Members" or force_update_team:
            print("Updating Team tab with filtered data...")
            for widget in self.team_tab.winfo_children():
                widget.destroy()
            self.team_frame = setup_team_tab(self.team_tab, self.data_manager, filtered_data, show_initial_data=True)
            
        # Update Fibu tab if it's the current one
        if self.tabview.get() == "Fibu Jahresblatt":
            self.refresh_fibu_data()
    
    def close_app(self, event=None):
        """Closes the application"""
        self.quit()
        self.destroy()

if __name__ == "__main__":
    app = App()
    app.mainloop()
