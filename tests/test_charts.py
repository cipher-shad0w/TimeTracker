import unittest
import pandas as pd
import tkinter as tk
import customtkinter as ctk
from unittest.mock import MagicMock, patch
from src.charts import create_customer_pie_chart, create_daily_line_chart, create_project_bar_chart


class TestCharts(unittest.TestCase):
    """Test class for chart functionality"""

    def setUp(self):
        """Set up test environment before each test case"""
        # Create a root window for testing
        self.root = ctk.CTk()
        self.frame = ctk.CTkFrame(self.root)
        
        # Sample data for charts
        self.customer_data = pd.DataFrame({
            'Kunden': ['Customer A', 'Customer B', 'Customer C'],
            'Minutes': [120, 240, 60],
            'Hours': [2, 4, 1]
        })
        
        self.daily_data = pd.DataFrame({
            'Date': pd.date_range(start='2023-01-01', periods=5),
            'Minutes': [120, 180, 90, 240, 60],
            'Hours': [2, 3, 1.5, 4, 1]
        })
        
        self.project_data = pd.DataFrame({
            'Auftrag': ['Project A', 'Project B', 'Project C', 'Project D'],
            'Minutes': [300, 180, 240, 120],
            'Hours': [5, 3, 4, 2]
        })
        
        # Empty dataframes for testing empty data scenarios
        self.empty_data = pd.DataFrame(columns=['Kunden', 'Minutes', 'Hours'])

    def tearDown(self):
        """Clean up after each test"""
        self.root.destroy()

    @patch('matplotlib.pyplot.figure')
    @patch('matplotlib.backends.backend_tkagg.FigureCanvasTkAgg')
    def test_customer_pie_chart_with_data(self, mock_canvas, mock_figure):
        """Test customer pie chart creation with data"""
        create_customer_pie_chart(self.frame, self.customer_data)
        
        # Verify that canvas was created
        mock_canvas.assert_called()
        
        # Check that children were created in the frame
        self.assertGreater(len(self.frame.winfo_children()), 0)

    def test_customer_pie_chart_empty_data(self):
        """Test customer pie chart with empty data"""
        create_customer_pie_chart(self.frame, self.empty_data)
        
        # Check for the "No data available" message
        children = self.frame.winfo_children()
        self.assertEqual(len(children), 2)  # Title + message
        
        # Find the label showing "No data available"
        no_data_label = None
        for child in children:
            if isinstance(child, ctk.CTkLabel) and hasattr(child, 'cget'):
                if child.cget('text') == "No data available":
                    no_data_label = child
                    break
                    
        self.assertIsNotNone(no_data_label)

    @patch('matplotlib.pyplot.figure')
    @patch('matplotlib.backends.backend_tkagg.FigureCanvasTkAgg')
    def test_daily_line_chart_with_data(self, mock_canvas, mock_figure):
        """Test daily line chart creation with data"""
        create_daily_line_chart(self.frame, self.daily_data)
        
        # Verify that canvas was created
        mock_canvas.assert_called()
        
        # Check that children were created in the frame
        self.assertGreater(len(self.frame.winfo_children()), 0)

    def test_daily_line_chart_empty_data(self):
        """Test daily line chart with empty data"""
        empty_daily_data = pd.DataFrame(columns=['Date', 'Minutes', 'Hours'])
        create_daily_line_chart(self.frame, empty_daily_data)
        
        # Check for the "No data available" message
        children = self.frame.winfo_children()
        self.assertEqual(len(children), 2)  # Title + message

    @patch('matplotlib.pyplot.figure')
    @patch('matplotlib.backends.backend_tkagg.FigureCanvasTkAgg')
    def test_project_bar_chart_with_data(self, mock_canvas, mock_figure):
        """Test project bar chart creation with data"""
        create_project_bar_chart(self.frame, self.project_data)
        
        # Verify that canvas was created
        mock_canvas.assert_called()
        
        # Check that children were created in the frame
        self.assertGreater(len(self.frame.winfo_children()), 0)

    @patch('matplotlib.pyplot.figure')
    @patch('matplotlib.backends.backend_tkagg.FigureCanvasTkAgg')
    def test_project_bar_chart_limit(self, mock_canvas, mock_figure):
        """Test project bar chart limiting to top N projects"""
        # Create data with more than the default limit
        large_project_data = pd.DataFrame({
            'Auftrag': [f'Project {i}' for i in range(15)],
            'Minutes': [i * 30 for i in range(15, 0, -1)],
            'Hours': [i * 0.5 for i in range(15, 0, -1)]
        })
        
        create_project_bar_chart(self.frame, large_project_data, top_n=5)
        
        # Verify that canvas was created
        mock_canvas.assert_called()


if __name__ == '__main__':
    unittest.main()