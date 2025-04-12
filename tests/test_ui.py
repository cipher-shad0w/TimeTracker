import unittest
import os
import tempfile
import pandas as pd
from unittest.mock import MagicMock, patch
from src.ui import App


class TestApp(unittest.TestCase):
    """Test class for main application UI functionality"""

    @patch('src.ui.TimeDataManager')
    @patch('src.ui.setup_time_entries_tab')
    @patch('src.ui.setup_statistics_tab')
    @patch('src.ui.setup_reports_tab')
    def setUp(self, mock_setup_reports, mock_setup_statistics, mock_setup_entries, mock_data_manager_class):
        """Set up test environment before each test case"""
        # Create a mock data manager
        self.mock_data_manager = mock_data_manager_class.return_value
        self.mock_data_manager.customers = ['Customer A', 'Customer B']
        self.mock_data_manager.projects = ['Project1', 'Project2']
        
        # Sample data for DataManager
        sample_data = pd.DataFrame({
            'Kunden': ['Customer A', 'Customer B'],
            'Auftrag': ['Project1', 'Project2'],
            'Dauer': ['1h 30m 00s', '2h 15m 00s'],
        })
        self.mock_data_manager.data = sample_data
        
        # Mock the setup functions to prevent actual UI creation
        self.mock_setup_entries = mock_setup_entries
        self.mock_setup_statistics = mock_setup_statistics
        self.mock_setup_statistics.return_value = {
            'client_chart_frame': MagicMock(),
            'daily_chart_frame': MagicMock(),
            'project_chart_frame': MagicMock()
        }
        self.mock_setup_reports = mock_setup_reports
        
        # Create the App instance
        with patch('src.ui.os.path.join', return_value='dummy_path'):
            self.app = App()
        
        # App instance is created but we don't want to show it
        self.app.withdraw()

    def tearDown(self):
        """Clean up after each test"""
        try:
            self.app.destroy()
        except:
            pass  # Already destroyed or not created

    def test_app_initialization(self):
        """Test if the app initializes correctly"""
        # Check if data manager is initialized
        self.assertIsNotNone(self.app.data_manager)
        
        # Verify UI components are created
        self.assertIsNotNone(self.app.top_frame)
        self.assertIsNotNone(self.app.content_frame)
        self.assertIsNotNone(self.app.left_frame)
        self.assertIsNotNone(self.app.right_frame)
        self.assertIsNotNone(self.app.tabview)
        
        # Check tabs setup
        self.mock_setup_entries.assert_called_once()
        self.mock_setup_statistics.assert_called_once()
        self.mock_setup_reports.assert_called_once()

    def test_setup_left_panel(self):
        """Test if the left panel is set up correctly"""
        # Check if the customer dropdown is populated
        self.assertIn('Alle Mandanten', self.app.optionmenu.cget('values'))
        for customer in self.mock_data_manager.customers:
            self.assertIn(customer, self.app.optionmenu.cget('values'))
            
        # Check if the project dropdown is populated
        for project in self.mock_data_manager.projects:
            self.assertIn(project, self.app.project_optionmenu.cget('values'))

    def test_create_tabview(self):
        """Test if tabview is created correctly"""
        # Check if all three tabs exist
        self.assertTrue(hasattr(self.app, 'time_entries_tab'))
        self.assertTrue(hasattr(self.app, 'statistics_tab'))
        self.assertTrue(hasattr(self.app, 'reports_tab'))
        
        # Check if default tab is set
        self.assertEqual(self.app.tabview.get(), "Statistics")

    @patch('src.ui.create_customer_pie_chart')
    @patch('src.ui.create_daily_line_chart')
    @patch('src.ui.create_project_bar_chart')
    def test_refresh_data(self, mock_project_chart, mock_daily_chart, mock_customer_chart):
        """Test refresh data functionality"""
        # Mock data for chart updates
        customer_data = pd.DataFrame({'Kunden': ['A'], 'Minutes': [60]})
        daily_data = pd.DataFrame({'Date': [pd.Timestamp('2023-01-01')], 'Minutes': [60]})
        project_data = pd.DataFrame({'Auftrag': ['P1'], 'Minutes': [60]})
        
        self.mock_data_manager.get_time_by_customer.return_value = customer_data
        self.mock_data_manager.get_time_by_day.return_value = daily_data
        self.mock_data_manager.get_time_by_project.return_value = project_data
        
        # Create chart frames for the test
        self.app.chart_frames = {
            'client_chart_frame': MagicMock(),
            'daily_chart_frame': MagicMock(),
            'project_chart_frame': MagicMock()
        }
        
        # Call the refresh method
        self.app.refresh_data()
        
        # Verify that data was retrieved
        self.mock_data_manager.get_time_by_customer.assert_called_once()
        self.mock_data_manager.get_time_by_day.assert_called_once()
        self.mock_data_manager.get_time_by_project.assert_called_once()
        
        # Verify charts were updated
        mock_customer_chart.assert_called_once()
        mock_daily_chart.assert_called_once()
        mock_project_chart.assert_called_once()

    def test_set_customer(self):
        """Test customer selection functionality"""
        with patch.object(self.app, 'refresh_data') as mock_refresh:
            self.app.set_customer("Customer A")
            mock_refresh.assert_called_once()

    def test_set_year(self):
        """Test year selection functionality"""
        with patch.object(self.app, 'refresh_data') as mock_refresh:
            self.app.set_year("2023")
            mock_refresh.assert_called_once()

    def test_close_app(self):
        """Test close app functionality"""
        with patch.object(self.app, 'quit') as mock_quit, \
             patch.object(self.app, 'destroy') as mock_destroy:
            self.app.close_app()
            mock_quit.assert_called_once()
            mock_destroy.assert_called_once()


if __name__ == '__main__':
    unittest.main()