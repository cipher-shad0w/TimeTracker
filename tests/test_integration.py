import unittest
import os
import pandas as pd
import tempfile
import datetime
from src.data_manager import TimeDataManager
from src.charts import create_customer_pie_chart, create_daily_line_chart, create_project_bar_chart
from src.tabs import setup_time_entries_tab, setup_statistics_tab, setup_reports_tab


class TestIntegration(unittest.TestCase):
    """Integration tests for time_app components"""

    def setUp(self):
        """Set up test environment before each test case"""
        # Create a temporary CSV file with test data
        self.test_data = pd.DataFrame({
            'Teammitglied': ['User1', 'User1', 'User2'],
            'Kunden': ['Customer A', 'Customer B', 'Customer A'],
            'Auftrag': ['Project2023', 'Project2024', 'Project2023'],
            'Projekte': ['Finance', 'Consulting', 'Finance'],
            'Start Date': ['01.01.2023', '15.01.2023', '20.01.2023'],
            'End Date': ['01.01.2023', '15.01.2023', '20.01.2023'],
            'Dauer': ['1h 30m 00s', '2h 15m 00s', '0h 45m 00s'],
            'Abgerechnet': ['TRUE', 'FALSE', 'TRUE'],
            'Notiz': ['Note with 01.02.2023 date', 'Regular note', 'Another 15.03.2023 date note']
        })
        
        # Create a temporary CSV file
        self.temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.csv')
        self.test_data.to_csv(self.temp_file.name, index=False)
        
        # Initialize TimeDataManager with the test file
        self.data_manager = TimeDataManager(self.temp_file.name)

    def tearDown(self):
        """Clean up after each test"""
        # Close and delete the temporary file
        self.temp_file.close()
        os.unlink(self.temp_file.name)

    def test_data_manager_to_charts_integration(self):
        """Test integration between data manager and chart creation"""
        # Get data from the data manager
        customer_data = self.data_manager.get_time_by_customer()
        daily_data = self.data_manager.get_time_by_day()
        project_data = self.data_manager.get_time_by_project()
        
        # Verify data frames contain the required columns for charts
        self.assertIn('Kunden', customer_data.columns)
        self.assertIn('Minutes', customer_data.columns)
        
        self.assertIn('Date', daily_data.columns)
        self.assertIn('Minutes', daily_data.columns)
        
        self.assertIn('Auftrag', project_data.columns)
        self.assertIn('Minutes', project_data.columns)

    def test_data_manager_to_tabs_integration(self):
        """Test integration between data manager and tabs setup"""
        # Verify that the data format from data_manager works with tabs setup
        filtered_data = self.data_manager.filter_by_customer('Customer A')
        
        # Check if filtered data has the expected fields needed by the tabs
        self.assertIn('Kunden', filtered_data.columns)
        self.assertIn('Auftrag', filtered_data.columns)
        self.assertIn('Start Date', filtered_data.columns)
        self.assertIn('Dauer', filtered_data.columns)
        self.assertIn('Notiz', filtered_data.columns)
        
        # Check date formatting for time entries tab
        self.assertTrue(pd.api.types.is_datetime64_any_dtype(filtered_data['Start Date']))

    def test_date_filtering_integration(self):
        """Test date filtering functionality across components"""
        # Filter data by year
        year_data = self.data_manager.filter_by_year(2023)
        self.assertEqual(len(year_data), 3)  # All entries are from 2023
        
        # Test date range filtering
        start_date = datetime.datetime(2023, 1, 15)
        end_date = datetime.datetime(2023, 1, 25)
        date_range_data = self.data_manager.filter_by_date_range(start_date, end_date)
        
        # Should include only entries from Jan 15 and Jan 20
        self.assertEqual(len(date_range_data), 2)
        
        # Test period filtering
        # Create a mock for current date to test current_month
        with unittest.mock.patch('datetime.datetime') as mock_datetime:
            mock_datetime.now.return_value = datetime.datetime(2023, 1, 20)
            current_month_data = self.data_manager.filter_by_time_period('current_month')
            # Should include all entries since they're all in January 2023
            self.assertEqual(len(current_month_data), 3)

    def test_customer_filtering_integration(self):
        """Test customer filtering across components"""
        # Filter by customer
        customer_a_data = self.data_manager.filter_by_customer('Customer A')
        self.assertEqual(len(customer_a_data), 2)
        
        # Get statistics for this customer
        customer_a_time = self.data_manager.get_time_by_project('Customer A')
        # Should be only one project for Customer A (Project2023)
        self.assertEqual(len(customer_a_time), 1)
        self.assertEqual(customer_a_time.iloc[0]['Auftrag'], 'Project2023')
        
        # Verify total time calculation
        total_minutes, total_hours, entry_count = self.data_manager.get_total_time(customer='Customer A')
        self.assertEqual(entry_count, 2)
        # User1 (1h 30m) + User2 (0h 45m) = 2h 15m = 135 minutes
        self.assertEqual(total_minutes, 135)
        self.assertEqual(total_hours, 135/60)


if __name__ == '__main__':
    unittest.main()