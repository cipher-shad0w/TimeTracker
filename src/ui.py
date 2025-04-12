import customtkinter as ctk
import os
# Change relative imports to absolute imports
from src.data_manager import TimeDataManager
from src.charts import create_customer_pie_chart, create_daily_line_chart, create_project_bar_chart
from src.tabs import setup_time_entries_tab, setup_statistics_tab, setup_reports_tab


class App(ctk.CTk):
    def __init__(self) -> None:
        super().__init__()
        ctk.set_default_color_theme("dark-blue")
        self.geometry("1500x1000")
        self.title("Time Tracker")
        
        # Initialize the TimeDataManager with the CSV data
        csv_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 
                               "data", "example_csv_time.csv")
        self.data_manager = TimeDataManager(csv_path)
        
        # Initialize UI components
        self.chart_frames = None
        self.create_widgets()

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
        self.title_label.pack(pady=30)

        # Add customer selection with actual customer data
        self._setup_left_panel()

        # Create tabview in right frame
        self.create_tabview()

    def _setup_left_panel(self):
        """Creates the controls in the left panel"""
        # Heading
        settings_label = ctk.CTkLabel(self.left_frame, text="Settings", font=("Arial", 18))
        settings_label.pack(pady=(20, 20))
        
        # Customer selection
        self.customer_label = ctk.CTkLabel(self.left_frame, text="Select customer:")
        self.customer_label.pack(pady=(10, 5))
        
        # Add "All Customers" option
        customers = ["All Customers"] + self.data_manager.customers
        
        self.optionmenu = ctk.CTkOptionMenu(
            self.left_frame, values=customers, command=self.set_customer
        )
        self.optionmenu.set("All Customers")
        self.optionmenu.pack(pady=(0, 20))
        
        # Date range
        date_label = ctk.CTkLabel(self.left_frame, text="Time period:")
        date_label.pack(pady=(10, 5))
        
        # Create dropdown for time periods
        date_ranges = ["Last Week", "Last Month", "Last Quarter", "All Time"]
        self.date_option = ctk.CTkOptionMenu(
            self.left_frame, values=date_ranges, command=self.update_date_range
        )
        self.date_option.set("All Time")
        self.date_option.pack(pady=(0, 20))
        
        # Refresh button
        refresh_button = ctk.CTkButton(
            self.left_frame, text="Refresh", command=self.refresh_data
        )
        refresh_button.pack(pady=(30, 10))
        
        # Statistics summary
        self.summary_label = ctk.CTkLabel(self.left_frame, text="Statistics Overview:")
        self.summary_label.pack(pady=(30, 5))
        
        # Frame for summary
        summary_frame = ctk.CTkFrame(self.left_frame, fg_color="#6B6B6B")
        summary_frame.pack(pady=10, padx=10, fill="x")
        
        # Total time
        self.total_time_label = ctk.CTkLabel(summary_frame, text="Total time: 0h 0m")
        self.total_time_label.pack(pady=(10, 5), padx=10, anchor="w")
        
        # Update the summary
        self.update_summary()

    def create_tabview(self):
        # Add tabview to right frame
        self.tabview = ctk.CTkTabview(self.right_frame, fg_color="#616161")
        self.tabview.pack(padx=20, pady=20, fill="both", expand=True)

        # Create the three tabs
        self.time_entries_tab = self.tabview.add("Time Entries")
        self.statistics_tab = self.tabview.add("Statistics")
        self.reports_tab = self.tabview.add("Reports")

        # Set default tab
        self.tabview.set("Statistics")
        
        # Fill the tabs with content - now from external functions
        setup_time_entries_tab(self.time_entries_tab, self.data_manager.data)
        self.chart_frames = setup_statistics_tab(self.statistics_tab, self.data_manager)
        self.report_widgets = setup_reports_tab(self.reports_tab)
    
    def set_customer(self, customer: str) -> None:
        """Handles the customer selection and updates the data"""
        self.refresh_data()
    
    def update_date_range(self, range_option: str) -> None:
        """Updates the date range for filtering"""
        # This function would filter the data by date
        self.refresh_data()
    
    def refresh_data(self):
        """Updates all charts and views"""
        selected_customer = self.optionmenu.get()
        customer = None if selected_customer == "All Customers" else selected_customer
        
        # Update the charts with external chart functions
        if self.chart_frames:
            customer_data = self.data_manager.get_time_by_customer()
            daily_data = self.data_manager.get_time_by_day(customer)
            project_data = self.data_manager.get_time_by_project(customer)
            
            create_customer_pie_chart(self.chart_frames['client_chart_frame'], customer_data)
            create_daily_line_chart(self.chart_frames['daily_chart_frame'], daily_data)
            create_project_bar_chart(self.chart_frames['project_chart_frame'], project_data)
        
        # Update the summary
        self.update_summary()
    
    def update_summary(self):
        """Updates the summary in the left panel"""
        selected_customer = self.optionmenu.get()
        customer = None if selected_customer == "All Customers" else selected_customer
        
        # Calculate the total time
        total_minutes = self.data_manager.get_total_time(customer)
        hours = int(total_minutes // 60)
        minutes = int(total_minutes % 60)
        
        # Update the label
        self.total_time_label.configure(text=f"Total time: {hours}h {minutes}m")
        
        # If a specific customer is selected, update the text accordingly
        if customer:
            self.summary_label.configure(text=f"Statistics for {customer}:")
        else:
            self.summary_label.configure(text="Statistics Overview:")


if __name__ == "__main__":
    app = App()
    app.mainloop()
