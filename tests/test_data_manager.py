import unittest
import os
import pandas as pd
import datetime
import tempfile
from src.data_manager import TimeDataManager


class TestTimeDataManager(unittest.TestCase):
    """Test class for TimeDataManager functionality"""

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

    def test_initialization(self):
        """Test if the TimeDataManager initializes correctly"""
        self.assertIsNotNone(self.data_manager.data)
        self.assertFalse(self.data_manager.data.empty)
        self.assertEqual(len(self.data_manager.data), 3)

    def test_get_unique_values(self):
        """Test if unique values are correctly extracted from columns"""
        self.assertEqual(set(self.data_manager.customers), {'Customer A', 'Customer B'})
        self.assertEqual(set(self.data_manager.team_members), {'User1', 'User2'})
        self.assertEqual(set(self.data_manager.projects), {'Project2023', 'Project2024'})
        self.assertEqual(set(self.data_manager.project_types), {'Finance', 'Consulting'})

    def test_time_conversion(self):
        """Test if time conversion works correctly"""
        minutes = self.data_manager._convert_time_to_minutes('1h 30m 00s')
        self.assertEqual(minutes, 90)
        
        minutes = self.data_manager._convert_time_to_minutes('0h 45m 30s')
        self.assertEqual(minutes, 45.5)
        
        # Test invalid input
        minutes = self.data_manager._convert_time_to_minutes(None)
        self.assertEqual(minutes, 0)

    def test_filter_by_customer(self):
        """Test customer filtering"""
        filtered = self.data_manager.filter_by_customer('Customer A')
        self.assertEqual(len(filtered), 2)
        self.assertTrue(all(filtered['Kunden'] == 'Customer A'))
        
        # Test with None customer
        filtered = self.data_manager.filter_by_customer(None)
        self.assertEqual(len(filtered), 3)

    def test_filter_by_year(self):
        """Test year filtering"""
        filtered = self.data_manager.filter_by_year(2023)
        self.assertEqual(len(filtered), 3)
        
        # Test with string input
        filtered = self.data_manager.filter_by_year('2023')
        self.assertEqual(len(filtered), 3)

    def test_get_time_by_customer(self):
        """Test time aggregation by customer"""
        customer_time = self.data_manager.get_time_by_customer()
        self.assertEqual(len(customer_time), 2)
        
        # Customer A should have more time entries than Customer B
        customer_a = customer_time[customer_time['Kunden'] == 'Customer A']
        customer_b = customer_time[customer_time['Kunden'] == 'Customer B']
        
        self.assertGreater(customer_a['Minutes'].iloc[0], 0)
        self.assertGreater(customer_b['Minutes'].iloc[0], 0)

    def test_get_time_by_project(self):
        """Test time aggregation by project"""
        project_time = self.data_manager.get_time_by_project()
        self.assertEqual(len(project_time), 2)
        
        # Project2023 should have more entries
        project_2023 = project_time[project_time['Auftrag'] == 'Project2023']
        self.assertGreater(project_2023['Minutes'].iloc[0], 0)

    def test_get_total_time(self):
        """Test total time calculation"""
        total_minutes, total_hours, entry_count = self.data_manager.get_total_time()
        self.assertEqual(entry_count, 3)
        self.assertGreater(total_minutes, 0)
        self.assertEqual(total_hours, total_minutes / 60)

    def test_extract_date_from_note(self):
        """Test date extraction from notes"""
        # Test with a date
        date = self.data_manager._extract_date_from_note('Note with 01.02.2023 date')
        self.assertIsNotNone(date)
        self.assertEqual(date.strftime('%d.%m.%Y'), '01.02.2023')
        
        # Test without a date
        date = self.data_manager._extract_date_from_note('Regular note')
        self.assertIsNone(date)
        
        # Test with None
        date = self.data_manager._extract_date_from_note(None)
        self.assertIsNone(date)


if __name__ == '__main__':
    unittest.main()