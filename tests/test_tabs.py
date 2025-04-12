import unittest
import pandas as pd
import customtkinter as ctk
from unittest.mock import MagicMock, patch
from src.tabs import setup_time_entries_tab, setup_statistics_tab, setup_reports_tab


class TestTabs(unittest.TestCase):
    """Test class for application tabs functionality"""

    def setUp(self):
        """Set up test environment before each test case"""
        # Create a root window for testing
        self.root = ctk.CTk()
        self.tab = ctk.CTkFrame(self.root)
        
        # Create sample data for tests
        self.sample_data = pd.DataFrame({
            'Kunden': ['Customer A', 'Customer B', 'Customer A'],
            'Auftrag': ['Project1', 'Project2', 'Project1'],
            'Start Date': pd.to_datetime(['2023-01-01', '2023-01-15', '2023-01-20']),
            'End Date': pd.to_datetime(['2023-01-01', '2023-01-15', '2023-01-20']),
            'Dauer': ['1h 30m 00s', '2h 15m 00s', '0h 45m 00s'],
            'Notiz': ['Note 1', 'This is a very long note that should be truncated in the UI display', 'Note 3'],
            'Date': pd.to_datetime(['2023-01-01', '2023-01-15', '2023-01-20'])
        })

    def tearDown(self):
        """Clean up after each test"""
        self.root.destroy()

    def test_setup_time_entries_tab(self):
        """Test if time entries tab is properly set up"""
        # Call the function we want to test
        setup_time_entries_tab(self.tab, self.sample_data)
        
        # Check if table frame was created
        children = self.tab.winfo_children()
        self.assertEqual(len(children), 1)  # Should have one table frame
        
        # Check table frame has headers and data rows
        table_frame = children[0]
        table_children = table_frame.winfo_children()
        
        # Should have headers (5) + data rows (3*5)
        self.assertEqual(len(table_children), 5 + (3 * 5))
        
        # Check for truncation of long notes
        note_labels = [child for child in table_children if isinstance(child, ctk.CTkLabel) and 
                       child.cget('text').endswith('...')]
        self.assertGreaterEqual(len(note_labels), 1)

    def test_setup_statistics_tab(self):
        """Test if statistics tab is properly set up"""
        # Create a mock data manager
        mock_data_manager = MagicMock()
        mock_data_manager.get_time_by_customer.return_value = pd.DataFrame({'Kunden': ['A'], 'Minutes': [60]})
        mock_data_manager.get_time_by_day.return_value = pd.DataFrame({'Date': [pd.Timestamp('2023-01-01')], 'Minutes': [60]})
        mock_data_manager.get_time_by_project.return_value = pd.DataFrame({'Auftrag': ['P1'], 'Minutes': [60]})
        
        # Call the function we want to test
        result = setup_statistics_tab(self.tab, mock_data_manager)
        
        # Check if chart frames were created
        self.assertIn('client_chart_frame', result)
        self.assertIn('daily_chart_frame', result)
        self.assertIn('project_chart_frame', result)

    def test_setup_reports_tab(self):
        """Test if reports tab is properly set up"""
        # Call the function we want to test
        result = setup_reports_tab(self.tab)
        
        # Check if the returned widgets dictionary has the expected keys
        self.assertIn('report_dropdown', result)
        self.assertIn('export_pdf', result)
        self.assertIn('export_csv', result)
        self.assertIn('preview_frame', result)
        
        # Check that the dropdown has the correct values
        report_types = ["Daily Report", "Weekly Report", "Monthly Report", "Customer Specific Report"]
        self.assertEqual(result['report_dropdown'].cget('values'), report_types)


if __name__ == '__main__':
    unittest.main()